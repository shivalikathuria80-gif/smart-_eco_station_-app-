# Smart Eco Station – Firmware

Sketches that talk to the same Firebase database as the website
(`Desktop/eco station/Nyrc/smart eco station.html`).

| Folder | Board | Job |
|---|---|---|
| `EcoStation_Main/` | ESP32 DevKit | **The one we use.** RFID, SG90 servo, 2 bin ultrasonics, 1 ultrasonic "eyes" above the flap, moisture sensor (wet/dry), LCD, Wi-Fi → Firebase. Powered from the computer's USB. Wiring: [WIRING.md](WIRING.md) |
| `Backup_Camera/` | | Old ESP32-CAM build, kept only as a backup. Not needed. See [Backup_Camera/README.md](Backup_Camera/README.md) |

## Wiring (ESP32 DevKit)

| Part | Pin | ESP32 |
|---|---|---|
| RC522 RFID (3.3 V!) | SDA/SS · SCK · MOSI · MISO · RST | 5 · 18 · 23 · 19 · 27 |
| I2C LCD 16×2 | SDA · SCL | 21 · 22 |
| Servo SG90 (signal, orange) | SIG | 13 (red to VIN / 5 V rail, brown to GND) |
| Ultrasonic – WET bin | TRIG · ECHO | 32 · 33 |
| Ultrasonic – DRY bin | TRIG · ECHO | 25 · 14 |
| Ultrasonic – EYES (above flap) | TRIG · ECHO | 26 · 35 |
| Moisture sensor | AO · VCC · GND | 34 · 16 · GND |
| Buzzer (optional) | + | 4 |

- HC-SR04 ECHO outputs 5 V → use a 1 kΩ / 2.2 kΩ divider before the ESP32 pin (1 kΩ on the ECHO side, 2.2 kΩ to GND).
- Power: the computer's USB cable into the ESP32. VIN feeds the servo, LCD and ultrasonics; 3V3 feeds the RC522. Put a 1000 µF capacitor across the servo's 5 V and GND so the flap moving doesn't restart the ESP32 (WIRING.md section 1a).
- All grounds must be connected together.
- Switch on with the flap **empty and dry**: the station measures it at boot. Calibrate the moisture threshold with WIRING.md section 4.

## Setup

1. **Libraries** (Library Manager): `ESP32Servo`, `LiquidCrystal I2C`, `MFRC522`.
   Upload `EcoStation_Main` (board: ESP32 Dev Module).
2. **Main sketch:** set `WIFI_SSID`, `WIFI_PASSWORD`, `STATION_ID`, `BIN_DEPTH_CM`.
   If your Firebase rules block unauthenticated writes, put a database secret in `FIREBASE_AUTH`.
3. Register cards on the website's Authority Portal. No card UIDs are written in
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
