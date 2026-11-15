# Smart Eco Station – Firmware

Sketches that talk to the same Firebase database as the website
(`Desktop/eco station/Nyrc/smart eco station.html`).

| Folder | Board | Job |
|---|---|---|
| `EcoStation_Main/` | ESP32 DevKit | **The one we use.** RFID, SG90 servo, 3× ultrasonic (2 bins + item on flap), moisture sensor (wet/dry), LCD, Wi-Fi → Firebase. Wiring: [WIRING.md](WIRING.md) |
| `EcoStation_Main_Camera/` | ESP32 DevKit | Backup: same, but an ESP32-CAM decides wet/dry. Wiring: [WIRING_CAMERA.md](WIRING_CAMERA.md) |
| `EcoStation_Cam/`  | ESP32-CAM (AI-Thinker) | Camera backup, **Option A:** classifies wet/dry on the CAM (Edge Impulse model) |
| `EcoStation_Cam_Server/` | ESP32-CAM (AI-Thinker) | Camera backup, **Option B:** sends photo to `ClassifierServer`, relays WET/DRY |
| `ClassifierServer/` | PC / Raspberry Pi | Flask server running a Teachable Machine model (`python app.py`) |

The rest of this section is only for the camera backup. Flash **either** Option A or
Option B onto the ESP32-CAM, not both. Both reply to `EcoStation_Main_Camera` in the
same format.
For Option B: put `keras_model.h5` + `labels.txt` (Teachable Machine → Export →
Tensorflow → Keras) in `ClassifierServer/`, run `pip install -r requirements.txt`
then `python app.py`, and copy the URL it prints into `SERVER_URL`. The PC must
stay on and on the same Wi-Fi as the station.

## Wiring (Main ESP32, moisture build)

| Part | Pin | ESP32 |
|---|---|---|
| RC522 RFID (3.3 V!) | SDA/SS · SCK · MOSI · MISO · RST | 5 · 18 · 23 · 19 · 27 |
| I2C LCD 16×2 | SDA · SCL | 21 · 22 |
| Servo SG90 (signal, orange) | SIG | 13 (power from separate 5 V supply, common GND) |
| Buzzer | + | 4 |
| Ultrasonic – WET bin | TRIG · ECHO | 32 · 33 |
| Ultrasonic – DRY bin | TRIG · ECHO | 25 · 14 |
| Ultrasonic – ITEM (above flap) | TRIG · ECHO | 26 · 35 |
| Moisture sensor | AO · VCC · GND | 34 · 16 · GND |

- HC-SR04 ECHO outputs 5 V → use a 1 kΩ / 2.2 kΩ divider before the ESP32 pin (1 kΩ on the ECHO side, 2.2 kΩ to GND).
- All grounds (ESP32, servo supply, 12 V supply) must be connected together.
- Switch on with the flap **empty and dry**: the station measures it at boot. Calibrate the moisture threshold with WIRING.md section 4.

## Setup

1. **Libraries** (Library Manager): `ESP32Servo`, `LiquidCrystal I2C`, `MFRC522`.
   Upload `EcoStation_Main` (board: ESP32 Dev Module).
2. **Main sketch:** set `WIFI_SSID`, `WIFI_PASSWORD`, `STATION_ID`, `BIN_DEPTH_CM`.
   If your Firebase rules block unauthenticated writes, put a database secret in `FIREBASE_AUTH`.
3. **Camera backup only, model (Option A):** your Edge Impulse project
   `shivali-project-2` (labels `wet` and `dry`). Deployment → Arduino library → Build,
   then in the Arduino IDE Sketch > Include Library > Add .ZIP Library. The `#include`
   in `EcoStation_Cam.ino` already matches. Switch the station on with the flap empty:
   the CAM uses that photo to detect "nothing on the flap" (see WIRING_CAMERA.md 5a and 5b).
4. Register cards on the website's Authority Portal. No card UIDs are written in
   the sketch: the station looks every tap up in Firebase `/users`, so a card works
   the moment it is registered (no re-upload). To add a new card, tap it at the
   station: the LCD shows **Not registered** plus its UID (e.g. `41 9E FE 03`), and
   the portal lists it under **Cards tapped but not registered**. Click it, type the
   name, press Register. The UID format (capitals, a space between bytes) is the
   same on the ESP32 and the website, and the website tidies typed UIDs
   (`419efe03` becomes `41 9E FE 03`).

## What goes to Firebase

- `/users/{UID}/points` – +10 per sorted item
- `/bins/STATION-01` – `{ zone, columns: { wet, dry }, updated }` every 15 s → Authority Portal bin cards (warning ≥75 %, critical ≥95 %)
- `/logs` – scans, rewards and "bin full" alerts → portal event feed
