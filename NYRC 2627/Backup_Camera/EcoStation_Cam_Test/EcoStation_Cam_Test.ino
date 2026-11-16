/*
 * ============================================================================
 *  SMART ECO STATION  -  ESP32-CAM TESTER (AI-Thinker board)
 * ============================================================================
 *  Stand-alone test: the ESP32-CAM only needs power and the USB adapter.
 *  Nothing else has to be wired.
 *
 *  What it does:
 *    1. Checks PSRAM and starts the camera (prints OK or the error).
 *    2. Capture check: takes one photo and prints its size and brightness.
 *    3. Every 2 seconds: takes a photo, runs your Edge Impulse model and
 *       prints every label with its confidence, plus the winner.
 *
 *  Open Serial Monitor at 9600 baud. Type into the box at the top and
 *  press Enter:
 *      f   turn the flash LED on/off for photos (default ON)
 *      p   pause / resume the loop
 *
 *  Library: Sketch > Include Library > Add .ZIP Library... and pick the
 *  Edge Impulse zip (ei-shivali-project-2-arduino-....zip).
 *  If your library has a different name, change ONLY the #include line
 *  below to <YourProjectName_inferencing.h>.
 *
 *  Board: "AI Thinker ESP32-CAM", PSRAM: Enabled.
 * ============================================================================
 */

#include <shivali-project-2_inferencing.h>    // <-- change this line if your library name is different
#include "edge-impulse-sdk/dsp/image/image.hpp"
#include "esp_camera.h"
#include "img_converters.h"

// ---------------- AI-Thinker pin map
#define PWDN_GPIO_NUM   32
#define RESET_GPIO_NUM  -1
#define XCLK_GPIO_NUM    0
#define SIOD_GPIO_NUM   26
#define SIOC_GPIO_NUM   27
#define Y9_GPIO_NUM     35
#define Y8_GPIO_NUM     34
#define Y7_GPIO_NUM     39
#define Y6_GPIO_NUM     36
#define Y5_GPIO_NUM     21
#define Y4_GPIO_NUM     19
#define Y3_GPIO_NUM     18
#define Y2_GPIO_NUM      5
#define VSYNC_GPIO_NUM  25
#define HREF_GPIO_NUM   23
#define PCLK_GPIO_NUM   22
#define FLASH_LED_PIN    4

#define RAW_W 320
#define RAW_H 240

const unsigned long LOOP_DELAY_MS = 2000;   // time between tests

static uint8_t* snapshot = nullptr;   // 320x240 RGB, then shrunk to model size
bool useFlash = true;
bool paused = false;
int photoCount = 0;

bool initCamera() {
  camera_config_t c = {};
  c.ledc_channel = LEDC_CHANNEL_0;  c.ledc_timer = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM; c.pin_d1 = Y3_GPIO_NUM; c.pin_d2 = Y4_GPIO_NUM;
  c.pin_d3 = Y5_GPIO_NUM; c.pin_d4 = Y6_GPIO_NUM; c.pin_d5 = Y7_GPIO_NUM;
  c.pin_d6 = Y8_GPIO_NUM; c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM; c.pin_pclk = PCLK_GPIO_NUM;
  c.pin_vsync = VSYNC_GPIO_NUM; c.pin_href = HREF_GPIO_NUM;
  c.pin_sccb_sda = SIOD_GPIO_NUM; c.pin_sccb_scl = SIOC_GPIO_NUM;
  c.pin_pwdn = PWDN_GPIO_NUM; c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000;
  c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size = FRAMESIZE_QVGA;       // 320x240
  c.jpeg_quality = 12;
  c.fb_count = 1;
  c.fb_location = CAMERA_FB_IN_PSRAM;
  c.grab_mode = CAMERA_GRAB_LATEST;

  esp_err_t err = esp_camera_init(&c);
  if (err != ESP_OK) {
    Serial.printf("  Camera error code: 0x%x\n", err);
    return false;
  }
  return true;
}

// Takes a photo. Prints JPEG size if 'verbose'. Leaves a 320x240 RGB image in snapshot.
bool takePhoto(bool verbose) {
  if (useFlash) { digitalWrite(FLASH_LED_PIN, HIGH); delay(150); }
  camera_fb_t* fb = esp_camera_fb_get();       // throw away the old frame
  if (fb) esp_camera_fb_return(fb);
  fb = esp_camera_fb_get();
  digitalWrite(FLASH_LED_PIN, LOW);
  if (!fb) { Serial.println("  FAIL: no photo from camera"); return false; }

  if (verbose) Serial.printf("  Photo: %dx%d, JPEG %u bytes\n", fb->width, fb->height, fb->len);
  if (fb->width != RAW_W || fb->height != RAW_H) {
    Serial.println("  FAIL: unexpected photo size");
    esp_camera_fb_return(fb);
    return false;
  }
  bool ok = fmt2rgb888(fb->buf, fb->len, PIXFORMAT_JPEG, snapshot);
  esp_camera_fb_return(fb);
  if (!ok) Serial.println("  FAIL: could not decode the JPEG");
  return ok;
}

// Average brightness 0-255 of the 320x240 RGB image
float brightness() {
  uint32_t total = 0;
  const size_t n = RAW_W * RAW_H * 3;
  for (size_t i = 0; i < n; i += 30) total += snapshot[i];   // sample every 10th pixel
  return (float)total / (n / 30);
}

// Edge Impulse pulls pixels through this callback (packed 0xRRGGBB)
static int getData(size_t offset, size_t length, float* out) {
  size_t px = offset * 3;
  for (size_t i = 0; i < length; i++) {
    out[i] = (snapshot[px + 2] << 16) + (snapshot[px + 1] << 8) + snapshot[px];
    px += 3;
  }
  return 0;
}

void captureCheck() {
  Serial.println("\n[2] Capture check...");
  if (!takePhoto(true)) return;
  float b = brightness();
  Serial.printf("  Brightness: %.0f / 255", b);
  if (b < 15)       Serial.println("  -> very dark: lens cap on, or camera ribbon loose?");
  else if (b > 240) Serial.println("  -> very bright: too much light");
  else              Serial.println("  -> OK");
  Serial.println("  Capture check PASSED");
}

void classifyOnce() {
  photoCount++;
  Serial.printf("\n--- Test #%d ---\n", photoCount);
  unsigned long t0 = millis();
  if (!takePhoto(false)) return;
  Serial.printf("  Brightness: %.0f\n", brightness());

  ei::image::processing::crop_and_interpolate_rgb888(
      snapshot, RAW_W, RAW_H,
      snapshot, EI_CLASSIFIER_INPUT_WIDTH, EI_CLASSIFIER_INPUT_HEIGHT);

  signal_t signal;
  signal.total_length = EI_CLASSIFIER_INPUT_WIDTH * EI_CLASSIFIER_INPUT_HEIGHT;
  signal.get_data = &getData;

  ei_impulse_result_t result = {};
  EI_IMPULSE_ERROR err = run_classifier(&signal, &result, false);
  if (err != EI_IMPULSE_OK) {
    Serial.printf("  FAIL: model error %d\n", err);
    return;
  }

  size_t best = 0;
  for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++) {
    Serial.printf("  %-8s %5.1f %%\n", result.classification[i].label,
                  result.classification[i].value * 100.0f);
    if (result.classification[i].value > result.classification[best].value) best = i;
  }
  Serial.printf("  >>> RESULT: %s (%.0f%%)   model %d ms, total %lu ms\n",
                result.classification[best].label,
                result.classification[best].value * 100.0f,
                result.timing.classification, millis() - t0);
}

void handleSerial() {
  if (!Serial.available()) return;
  char ch = Serial.read();
  if (ch == 'f' || ch == 'F') {
    useFlash = !useFlash;
    Serial.printf("\nFlash is now %s\n", useFlash ? "ON" : "OFF");
  } else if (ch == 'p' || ch == 'P') {
    paused = !paused;
    Serial.println(paused ? "\nPaused (type p to resume)" : "\nResumed");
  }
}

void setup() {
  Serial.begin(9600);
  delay(500);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  Serial.println("\n===== ESP32-CAM TESTER =====");
  Serial.printf("Model: %d x %d input, %d labels:", EI_CLASSIFIER_INPUT_WIDTH,
                EI_CLASSIFIER_INPUT_HEIGHT, EI_CLASSIFIER_LABEL_COUNT);
  for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++) Serial.printf(" %s", ei_classifier_inferencing_categories[i]);
  Serial.println();

  Serial.println("\n[1] PSRAM and camera...");
  if (!psramFound()) {
    Serial.println("  FAIL: no PSRAM. Tools > PSRAM must be 'Enabled' and board 'AI Thinker ESP32-CAM'.");
    while (true) delay(1000);
  }
  Serial.printf("  PSRAM OK (%u KB free)\n", ESP.getFreePsram() / 1024);

  snapshot = (uint8_t*)ps_malloc(RAW_W * RAW_H * 3);
  if (!snapshot) { Serial.println("  FAIL: out of memory"); while (true) delay(1000); }

  if (!initCamera()) {
    Serial.println("  FAIL: camera did not start. Check the ribbon cable (black clip down,");
    Serial.println("        gold contacts facing the board) and use a 5V supply.");
    while (true) delay(1000);
  }
  Serial.println("  Camera OK");

  // Blink the flash twice so you can see the board is alive
  for (int i = 0; i < 2; i++) { digitalWrite(FLASH_LED_PIN, HIGH); delay(100); digitalWrite(FLASH_LED_PIN, LOW); delay(200); }

  delay(1000);           // let the camera adjust to the light
  captureCheck();

  Serial.println("\n[3] Running the model every 2 seconds. Hold wet or dry items in front of the camera.");
  Serial.println("    Type f = flash on/off, p = pause.");
}

void loop() {
  handleSerial();
  if (!paused) classifyOnce();
  unsigned long start = millis();
  while (millis() - start < LOOP_DELAY_MS) { handleSerial(); delay(10); }
}
