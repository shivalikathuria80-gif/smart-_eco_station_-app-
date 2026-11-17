/*
 * ============================================================================
 *  SMART ECO STATION  -  MAIN CONTROLLER (ESP32 DevKit)
 * ============================================================================
 *  Flow:
 *    1. User taps RFID card (RC522)          -> checked against Firebase /users
 *    2. Valid card -> LCD asks user to put waste on the flap
 *    3. Ultrasonic #3 ("eyes") above the flap sees the item land
 *       Moisture sensor on the flap decides "WET" or "DRY"
 *    4. Servo tilts flap into the right bin  -> user gets reward points
 *    5. Two ultrasonic sensors measure fill  -> LCD + Firebase /bins (portal)
 *
 *  Stack: ESP32 DevKit (powered from the computer's USB), RC522 RFID,
 *  16x2 I2C LCD, SG90 servo, 2 ultrasonics for bin fill, 1 ultrasonic as the
 *  "eyes" above the flap, moisture sensor for wet/dry. Wiring: WIRING.md
 *
 *  KEEP THE FLAP EMPTY AND DRY WHEN YOU SWITCH ON: the station measures the
 *  empty flap (height + dry moisture reading) at boot and compares to that.
 *
 *  Firebase paths (same as the website "smart eco station.html"):
 *    /users/{UID}          { name, points }
 *    /bins/{STATION_ID}    { zone, columns: { wet, dry }, updated }
 *    /logs/{pushId}        { type: scan|reward|alert, text, time }
 *
 *  Libraries (Arduino Library Manager):
 *    - MFRC522            (GithubCommunity)
 *    - ESP32Servo         (Kevin Harrington)
 *    - LiquidCrystal I2C  (Frank de Brabander)
 *  Board: "ESP32 Dev Module"  (esp32 core by Espressif, v2.x or v3.x)
 * ============================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <time.h>

// ---------------------------------------------------------------- SETTINGS --
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Realtime Database URL from the website's firebaseConfig (no trailing slash)
const char* FIREBASE_URL  = "https://smart-eco-station-default-rtdb.europe-west1.firebasedatabase.app";
// Leave "" if your DB rules allow writes; otherwise put a Database Secret here
const char* FIREBASE_AUTH = "";

const char* STATION_ID    = "STATION-01";     // shows as the bin card title
const char* STATION_ZONE  = "School Block A"; // shows under the bin card title

const int   POINTS_PER_ITEM = 10;

// Item detection (ultrasonic #3, pointing DOWN at the flap from above)
const float ITEM_MIN_HEIGHT_CM = 1.5;  // item must be at least this much closer than the empty flap

// Moisture sensor (on the flap, where the waste lands).
// Both resistive and capacitive modules read LOWER when wet. At boot the
// station reads the dry, empty flap; an item counts as WET if the reading
// drops more than MOISTURE_DROP below that. Calibrate: see WIRING.md section 4.
const int  MOISTURE_DROP  = 400;       // 0..4095 scale. Smaller = more items called WET
const bool MOISTURE_DEBUG = true;      // print the reading every 2 s on Serial Monitor

// Bin geometry (cm) - measure your own dustbins!
const float BIN_DEPTH_CM = 40.0;  // sensor to bottom of empty bin
const float FULL_GAP_CM  = 5.0;   // sensor to waste when we call it 100%
const int   FULL_ALERT_PERCENT = 90;

// SG90 micro servo for the diverter flap (plastic gears, ~1.8 kg-cm).
// Keep the flap light and pivot it near its middle so the SG90 isn't strained.
// If the flap tilts the wrong way, swap SERVO_WET and SERVO_DRY.
// If it hits the bin wall or buzzes at the end, move the angle 10 closer to 90.
const int SERVO_CENTER  = 90;
const int SERVO_WET     = 150;   // swapped 2026-11-17: bins are placed reversed
const int SERVO_DRY     = 30;
const int SERVO_MIN_US  = 500;   // SG90 pulse range (0 deg .. 180 deg)
const int SERVO_MAX_US  = 2400;
const int SERVO_STEP_MS = 8;     // ms per degree: slow sweep = gentler on gears and on USB power
                                 // (ESP32 restarts when the flap moves? try 12 or 15)

// Timings (ms)
const unsigned long DEPOSIT_TIME     = 10000;  // time the user gets to put waste on the flap
const unsigned long ITEM_SETTLE_TIME = 1500;   // wait for item to rest on flap / soak the probe
const unsigned long BIN_UPLOAD_EVERY = 15000;
const unsigned long WIFI_RETRY_EVERY = 10000;

// Ultrasonic reliability on laptop USB power. The 5 V rail sags when the
// servo or Wi-Fi pulls current, and then the HC-SR04s return no echo.
// So: the servo is switched off between moves, sensors wait for the rail to
// recover after the servo stops, only one sensor pings at a time, and each
// reading takes the median of several tries.
const int           US_TRIES          = 5;    // pings per reading
const unsigned long US_GAP_MS         = 60;   // pause between pings (and between sensors)
const unsigned long US_AFTER_SERVO_MS = 300;  // wait this long after the servo stops
const int           FLAP_CAL_TRIES    = 10;   // boot calibration attempts for the "eyes"

// ------------------------------------------------------------------- PINS --
// RC522 (SPI): SCK 18, MISO 19, MOSI 23
#define RFID_SS_PIN    5
#define RFID_RST_PIN   27
// I2C LCD: SDA 21, SCL 22
#define LCD_ADDR       0x27      // try 0x3F if screen stays blank
#define SERVO_PIN      13
#define BUZZER_PIN     4         // optional: leave unconnected if you have no buzzer
// Ultrasonic HC-SR04 (ECHO is 5V -> use a 1k/2k voltage divider)
#define WET_TRIG_PIN   32
#define WET_ECHO_PIN   33
#define DRY_TRIG_PIN   25
#define DRY_ECHO_PIN   14
// Ultrasonic #3 = the "eyes": sees waste on the flap (ECHO via 1k/2.2k divider too)
#define ITEM_TRIG_PIN  26
#define ITEM_ECHO_PIN  35        // input-only pin, fine for ECHO
// Moisture sensor: AO must be on an ADC1 pin (ADC2 stops working with WiFi on)
#define MOISTURE_PIN   34        // AO  (input-only, ADC1)
#define MOISTURE_PWR   16        // VCC (powered only while reading: probes last longer)

// ---------------------------------------------------------------- OBJECTS --
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(LCD_ADDR, 16, 2);
Servo flap;

int wetLevel = 0, dryLevel = 0;
bool wetAlertSent = false, dryAlertSent = false;
unsigned long lastBinUpload = 0;
unsigned long lastWifiRetry = 0;
float flapEmptyCm = 0;      // ultrasonic #3 to the empty flap, measured at boot
int   moistureDry = 4095;   // moisture reading of the dry, empty flap, measured at boot
unsigned long lastMoisturePrint = 0;

// ================================================================ HELPERS ==
void beep(int times, int ms = 80) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH); delay(ms);
    digitalWrite(BUZZER_PIN, LOW);  delay(ms);
  }
}

void lcdShow(const String& l1, const String& l2) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1.substring(0, 16));
  lcd.setCursor(0, 1); lcd.print(l2.substring(0, 16));
}

void lcdIdle() {
  lcdShow("Wet:" + String(wetLevel) + "% Dry:" + String(dryLevel) + "%",
          (wetLevel >= FULL_ALERT_PERCENT || dryLevel >= FULL_ALERT_PERCENT)
            ? "!! BIN FULL !!" : "Tap your card");
}

// "41 9E FE 03" fits the 16-char LCD; longer 7/10-byte UIDs drop the spaces
String lcdUid(const String& uid) {
  if (uid.length() <= 16) return uid;
  String c = uid;
  c.replace(" ", "");
  return c;
}

String timeNow() {
  struct tm t;
  if (!getLocalTime(&t, 100)) return "--:--:--";
  char buf[12];
  strftime(buf, sizeof(buf), "%I:%M:%S %p", &t);
  return String(buf);
}

// UID bytes -> "A3 5F 8C 12" (same format the website registers)
String readUid() {
  String uid;
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (i) uid += " ";
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

String urlEncode(const String& s) {
  String out;
  for (char c : s) out += (c == ' ') ? String("%20") : String(c);
  return out;
}

String jsonEscape(const String& s) {
  String out;
  for (char c : s) { if (c == '"' || c == '\\') out += '\\'; out += c; }
  return out;
}

// ============================================================== FIREBASE ==
// true if the last firebase() call got an answer from the server (HTTP 200)
bool firebaseOk = false;

// method: GET / PUT / PATCH / POST. Returns response body, "" on failure.
String firebase(const char* method, const String& path, const String& body = "") {
  firebaseOk = false;
  if (WiFi.status() != WL_CONNECTED) return "";
  WiFiClientSecure client;
  client.setInsecure();                   // skip cert check (fine for a school project)
  HTTPClient http;
  String url = String(FIREBASE_URL) + "/" + path + ".json";
  if (strlen(FIREBASE_AUTH)) url += "?auth=" + String(FIREBASE_AUTH);
  if (!http.begin(client, url)) return "";
  http.addHeader("Content-Type", "application/json");
  int code = http.sendRequest(method, body);
  String resp = (code > 0) ? http.getString() : "";
  http.end();
  if (code != 200) {
    Serial.printf("[Firebase] %s %s -> %d %s\n", method, path.c_str(), code, resp.c_str());
    return "";
  }
  firebaseOk = true;
  return resp;
}

void pushLog(const char* type, const String& text) {
  firebase("POST", "logs",
           "{\"type\":\"" + String(type) + "\",\"text\":\"" + jsonEscape(text) +
           "\",\"time\":\"" + timeNow() + "\"}");
}

// Looks the card up live in Firebase /users, so a card registered on the
// website works at the next tap (no UIDs in this sketch, no re-upload).
// Returns the user's name, or "" if the card isn't registered.
// Check firebaseOk afterwards: false means "no connection", not "unknown card".
String getUserName(const String& uid) {
  String r = firebase("GET", "users/" + urlEncode(uid) + "/name");
  if (!firebaseOk) {                      // one retry: Wi-Fi/TLS hiccups happen
    delay(300);
    r = firebase("GET", "users/" + urlEncode(uid) + "/name");
  }
  r.trim();
  if (r.length() < 2 || r == "null") return "";
  return r.substring(1, r.length() - 1);  // strip JSON quotes
}

// Adds points atomically on the Firebase server (same as the website's
// transaction), so a failed read can never overwrite a balance with 0.
// Returns the new total, or -1 on failure.
long addPoints(const String& uid, int delta) {
  String path = "users/" + urlEncode(uid) + "/points";
  String r = firebase("PUT", path, "{\".sv\":{\"increment\":" + String(delta) + "}}");
  r.trim();
  if (r == "") return -1;
  return r.toInt();
}

void uploadBinLevels() {
  firebase("PATCH", "bins/" + String(STATION_ID),
           "{\"zone\":\"" + jsonEscape(STATION_ZONE) + "\","
           "\"columns\":{\"wet\":" + String(wetLevel) + ",\"dry\":" + String(dryLevel) + "},"
           "\"updated\":\"" + timeNow() + "\"}");
}

// ============================================================ ULTRASONIC ==
unsigned long servoOffAt = 0;   // millis() when the servo was last switched off
bool servoOn = false;

// One ping. Returns the distance in cm, or -1 if no echo came back.
float pingOnce(int trig, int echo) {
  digitalWrite(trig, LOW);  delayMicroseconds(4);
  digitalWrite(trig, HIGH); delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long us = pulseIn(echo, HIGH, 30000);   // 30 ms timeout (~5 m)
  if (us <= 0) return -1;
  float cm = us * 0.0343 / 2.0;
  return (cm < 2 || cm > 400) ? -1 : cm;  // outside the HC-SR04's range = bad
}

// Median of up to US_TRIES good pings. fallback: value returned when none came back.
// Never pings while the servo is powered, and waits for the 5 V rail to recover.
float readDistanceCm(int trig, int echo, float fallback = BIN_DEPTH_CM) {
  if (servoOn) return fallback;
  unsigned long since = millis() - servoOffAt;
  if (since < US_AFTER_SERVO_MS) delay(US_AFTER_SERVO_MS - since);

  float good[US_TRIES];
  int n = 0;
  for (int i = 0; i < US_TRIES; i++) {
    delay(US_GAP_MS);                      // also keeps sensors from hearing each other
    float cm = pingOnce(trig, echo);
    if (cm > 0) good[n++] = cm;
  }
  if (n == 0) return fallback;             // no echo at all
  for (int i = 1; i < n; i++) {            // sort, then take the middle value
    float v = good[i]; int j = i - 1;
    while (j >= 0 && good[j] > v) { good[j + 1] = good[j]; j--; }
    good[j + 1] = v;
  }
  return good[n / 2];
}

int toPercent(float distance) {
  float pct = (BIN_DEPTH_CM - distance) / (BIN_DEPTH_CM - FULL_GAP_CM) * 100.0;
  return constrain((int)pct, 0, 100);
}

void updateBinLevels() {
  wetLevel = toPercent(readDistanceCm(WET_TRIG_PIN, WET_ECHO_PIN));
  dryLevel = toPercent(readDistanceCm(DRY_TRIG_PIN, DRY_ECHO_PIN));
  Serial.printf("[Bins] wet=%d%% dry=%d%%\n", wetLevel, dryLevel);

  // One alert per overflow; reset once the bin is emptied
  if (wetLevel >= FULL_ALERT_PERCENT && !wetAlertSent) {
    pushLog("alert", String(STATION_ID) + " - WET bin is " + wetLevel + "% full. Please empty.");
    wetAlertSent = true;
  } else if (wetLevel < FULL_ALERT_PERCENT - 20) wetAlertSent = false;

  if (dryLevel >= FULL_ALERT_PERCENT && !dryAlertSent) {
    pushLog("alert", String(STATION_ID) + " - DRY bin is " + dryLevel + "% full. Please empty.");
    dryAlertSent = true;
  } else if (dryLevel < FULL_ALERT_PERCENT - 20) dryAlertSent = false;
}

// ===================================================== ITEM + MOISTURE ==
// Distance from ultrasonic #3 to whatever is on the flap
float flapDistanceCm() {
  return readDistanceCm(ITEM_TRIG_PIN, ITEM_ECHO_PIN, flapEmptyCm);
}

bool itemOnFlap() {
  return flapDistanceCm() < flapEmptyCm - ITEM_MIN_HEIGHT_CM;
}

// Average of 16 readings, 0 (very wet) .. 4095 (bone dry)
int readMoisture() {
  digitalWrite(MOISTURE_PWR, HIGH);
  delay(100);                                    // let the module settle
  long sum = 0;
  for (int i = 0; i < 16; i++) { sum += analogRead(MOISTURE_PIN); delay(5); }
  digitalWrite(MOISTURE_PWR, LOW);
  return sum / 16;
}

// Waits up to DEPOSIT_TIME for an item, then decides.
// Returns "WET", "DRY" or "NONE" (nothing put on the flap).
String detectWaste(int& moisture) {
  unsigned long start = millis();
  int shown = -1;
  bool seen = false;
  while (millis() - start < DEPOSIT_TIME) {
    int left = (DEPOSIT_TIME - (millis() - start) + 999) / 1000;
    if (left != shown) { lcdShow("Put waste on", "the flap... " + String(left) + "s"); shown = left; }
    if (itemOnFlap()) { seen = true; break; }
  }
  if (!seen) return "NONE";

  lcdShow("Item detected", "Checking...");
  delay(ITEM_SETTLE_TIME);
  if (!itemOnFlap()) return "NONE";              // taken back off

  moisture = readMoisture();
  Serial.printf("[Moisture] item=%d dry-flap=%d wet-below=%d\n",
                moisture, moistureDry, moistureDry - MOISTURE_DROP);
  return (moisture < moistureDry - MOISTURE_DROP) ? "WET" : "DRY";
}

int flapAngle = SERVO_CENTER;

// Servo power: PWM only while moving. Switched off, the SG90 draws almost no
// current, which leaves the 5 V rail clean for the ultrasonics.
void servoStart() {
  if (servoOn) return;
  flap.setPeriodHertz(50);
  flap.attach(SERVO_PIN, SERVO_MIN_US, SERVO_MAX_US);   // SG90
  flap.write(flapAngle);
  servoOn = true;
}

void servoStop() {
  if (!servoOn) return;
  delay(150);                                    // let it finish the last step
  flap.detach();
  pinMode(SERVO_PIN, OUTPUT); digitalWrite(SERVO_PIN, LOW);
  servoOn = false;
  servoOffAt = millis();
}

// Moves one degree at a time: smaller current spikes (no brown-outs) and less
// shock on the SG90's plastic gears than jumping straight to the angle.
void moveFlap(int target) {
  int step = (target > flapAngle) ? 1 : -1;
  while (flapAngle != target) {
    flapAngle += step;
    flap.write(flapAngle);
    delay(SERVO_STEP_MS);
  }
}

void sortItem(bool wet) {
  servoStart();
  moveFlap(wet ? SERVO_WET : SERVO_DRY);
  delay(800);                                     // let the waste slide off
  moveFlap(SERVO_CENTER);
  servoStop();                                    // no holding current between items
}

// Measures the empty flap with the "eyes". Tries several times before giving up.
bool calibrateFlap() {
  for (int i = 0; i < FLAP_CAL_TRIES; i++) {
    float cm = readDistanceCm(ITEM_TRIG_PIN, ITEM_ECHO_PIN, 0);
    if (cm >= 3) { flapEmptyCm = cm; return true; }
    Serial.printf("[Flap] calibration try %d: no reading\n", i + 1);
    delay(200);
  }
  return false;
}

// ================================================================= SETUP ==
void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(WET_TRIG_PIN, OUTPUT); pinMode(WET_ECHO_PIN, INPUT);
  pinMode(DRY_TRIG_PIN, OUTPUT); pinMode(DRY_ECHO_PIN, INPUT);
  pinMode(ITEM_TRIG_PIN, OUTPUT); pinMode(ITEM_ECHO_PIN, INPUT);
  pinMode(MOISTURE_PWR, OUTPUT); digitalWrite(MOISTURE_PWR, LOW);
  analogSetPinAttenuation(MOISTURE_PIN, ADC_11db);  // full 0..3.3 V range

  lcd.init(); lcd.backlight();
  lcdShow("Smart Eco", "Station booting");

  flapAngle = SERVO_CENTER;
  servoStart();                                  // centre the flap once...
  delay(500);
  servoStop();                                   // ...then switch the servo off

  SPI.begin();
  rfid.PCD_Init();

  // Empty-flap reference: height for ultrasonic #3, dry value for moisture
  lcdShow("Keep flap empty", "Calibrating...");
  delay(1000);
  bool flapOk = calibrateFlap();
  moistureDry = readMoisture();
  Serial.printf("[Flap] empty=%.1f cm  moisture dry=%d\n", flapEmptyCm, moistureDry);
  if (!flapOk) {                                 // keeps retrying in loop()
    lcdShow("Item sensor?", "Retrying...");
    Serial.println("[Flap] ultrasonic #3 gave no reading - will keep retrying every 5 s");
    beep(3, 300);
    delay(2000);
  }

  lcdShow("Connecting WiFi", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setTxPower(WIFI_POWER_11dBm);   // smaller current spikes on USB power; plenty for a nearby router/hotspot
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(500);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi OK: " + WiFi.localIP().toString());
    configTime(19800, 0, "pool.ntp.org");            // IST (UTC+5:30)
    lcdShow("WiFi connected", WiFi.localIP().toString());
  } else {
    lcdShow("WiFi FAILED", "Offline mode");
  }
  delay(1500);

  // Boot check: prove the database link works before users arrive
  updateBinLevels();
  String ok = "";
  if (WiFi.status() == WL_CONNECTED) {
    uploadBinLevels();
    ok = firebase("GET", "bins/" + String(STATION_ID) + "/zone");
  }
  Serial.println(ok.length() ? "[Firebase] link OK" : "[Firebase] link FAILED - check URL / rules / FIREBASE_AUTH");
  lcdShow(ok.length() ? "Firebase OK" : "Firebase FAILED", ok.length() ? STATION_ID : "Check rules/auth");
  if (!ok.length()) beep(3, 300);
  delay(1500);
  lastBinUpload = millis();
  lcdIdle();
}

// ================================================================== LOOP ==
void loop() {
  if (WiFi.status() != WL_CONNECTED && millis() - lastWifiRetry > WIFI_RETRY_EVERY) {
    WiFi.reconnect();                                // retry every 10 s, not every loop
    lastWifiRetry = millis();
  }

  // "Eyes" missed the boot calibration? Keep trying until it works.
  static unsigned long lastCalTry = 0;
  if (flapEmptyCm < 3 && millis() - lastCalTry > 5000) {
    lastCalTry = millis();
    float cm = readDistanceCm(ITEM_TRIG_PIN, ITEM_ECHO_PIN, 0);  // one quick try, so cards still work
    if (cm >= 3) {
      flapEmptyCm = cm;
      Serial.printf("[Flap] calibrated late: empty=%.1f cm\n", flapEmptyCm);
      lcdIdle();
    }
  }

  // Periodic fill-level report (LCD + website)
  if (millis() - lastBinUpload > BIN_UPLOAD_EVERY) {
    updateBinLevels();
    uploadBinLevels();
    lastBinUpload = millis();
    lcdIdle();
  }

  if (MOISTURE_DEBUG && millis() - lastMoisturePrint > 2000) {
    Serial.printf("[Moisture] now=%d dry-flap=%d (WET below %d)  flap=%.1f cm\n",
                  readMoisture(), moistureDry, moistureDry - MOISTURE_DROP, flapDistanceCm());
    lastMoisturePrint = millis();
  }

  // ---- 1. Wait for a card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  String uid = readUid();
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  Serial.println("[RFID] " + uid);

  lcdShow("Card detected", "Checking...");
  String name = getUserName(uid);

  if (name == "" && !firebaseOk) {                  // couldn't ask the database
    lcdShow("No connection", "Try again");
    Serial.println("[Firebase] lookup failed - check WiFi / rules");
    beep(2, 300);
    delay(2500);
    lcdIdle();
    return;
  }

  if (name == "") {                                 // database says: not registered
    // UID stays on screen so it can be typed into the website. The portal
    // also lists it under "Cards tapped but not registered" from this log.
    lcdShow("Not registered", lcdUid(uid));
    Serial.println("[RFID] Not registered: " + uid + "  -> register it on the Authority Portal");
    beep(3, 150);
    pushLog("scan", "Unknown card " + uid + " denied at " + STATION_ID);
    delay(4000);
    lcdIdle();
    return;
  }

  // ---- 2. User puts waste on the flap
  lcdShow("Hi " + name, "Put waste in");
  beep(1);
  pushLog("scan", name + " (" + uid + ") scanned at " + STATION_ID);
  delay(1200);

  // ---- 3. Detect the waste: ultrasonic #3 sees it, moisture decides
  int moisture = -1;
  String type = detectWaste(moisture);
  if (type == "NONE") {                            // nothing put on the flap -> no points
    lcdShow("No waste seen", "No points given");
    beep(2, 200);
    pushLog("scan", name + " (" + uid + ") - no item detected, no points");
    delay(2500);
    lcdIdle();
    return;
  }
  bool wet = (type == "WET");

  // ---- 4. Check target bin isn't full, then sort
  updateBinLevels();
  if ((wet ? wetLevel : dryLevel) >= 100) {
    lcdShow(wet ? "WET bin FULL" : "DRY bin FULL", "Item not sorted");
    beep(3, 200);
    pushLog("alert", String(STATION_ID) + " - " + type + " bin full, item rejected");
    delay(3000);
    lcdIdle();
    return;
  }

  lcdShow("Detected: " + type, wet ? "-> Wet bin" : "-> Dry bin");
  sortItem(wet);

  // ---- 5. Reward
  long total = addPoints(uid, POINTS_PER_ITEM);
  if (total >= 0) {
    lcdShow("+" + String(POINTS_PER_ITEM) + " points!", "Total: " + String(total));
    pushLog("reward", name + " earned +" + String(POINTS_PER_ITEM) + " pts (" + type + " waste)");
  } else {
    lcdShow("Sorted: " + type, "Points sync fail");
  }
  beep(2);

  // ---- 6. Report new fill levels immediately
  updateBinLevels();
  uploadBinLevels();
  lastBinUpload = millis();
  delay(2500);
  lcdIdle();
}
