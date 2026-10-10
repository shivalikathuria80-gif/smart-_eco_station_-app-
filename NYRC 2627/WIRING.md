# Smart Eco Station: Final Wiring

Every connection below is taken from the sketches in this repo. Where the code and
[COMPONENTS.md](COMPONENTS.md) agree, the pin is listed once. Values come from
`EcoStation_Main.ino` and `EcoStation_Cam.ino`.

Two ESP32s and one ESP32-CAM run on the same 5 V rail, sharing one ground.
Flash the ESP32-CAM with **Option A** (`EcoStation_Cam`, Edge Impulse on the CAM)
or **Option B** (`EcoStation_Cam_Server`, Teachable Machine on a laptop). Do not
flash both. The wiring is identical either way.

---

## 1. Power

```
12V 2A adapter ──┬──► LM2596 IN+ ─────────────► LM2596 OUT+ (5V)
                 │                                   │
                 └──► Relay COM                      ├──► ESP32 DevKit VIN
                                                     ├──► ESP32-CAM 5V
Relay NO ──────► Solenoid +                          ├──► Servo red (5V)
Solenoid − ────► 12V GND                             ├──► HC-SR04 #1 VCC
1N4007 diode across solenoid                        ├──► HC-SR04 #2 VCC
   (stripe on the + side)                            ├──► LCD VCC
                                                     └──► Relay VCC
GND of every module ────► common ground (all GNDs tied together)
```

| From | To | Notes |
|---|---|---|
| 12V adapter + | LM2596 IN+ | |
| 12V adapter + | Relay COM | relay switches the solenoid's 12V |
| 12V adapter − | LM2596 IN−, Solenoid −, common GND | solenoid return goes straight to 12V GND |
| LM2596 OUT+ | ESP32 DevKit VIN, ESP32-CAM 5V, servo red, both HC-SR04 VCC, LCD VCC, relay VCC | set to **5.0 V** before connecting anything |
| Relay NO | Solenoid + | never wire the solenoid straight to the ESP32 |
| Solenoid − | 12V GND | |
| 1N4007 | across the solenoid | stripe toward Solenoid + |
| 1000 µF 16V capacitor | servo red / servo GND | stops brown-outs when the servo moves |

**Before powering up:** turn the LM2596 trim screw until the output reads 5.0 V
(the voltmeter version makes this easy).

---

## 2. Main ESP32 (EcoStation_Main, ESP32 DevKit V1)

| Module | Module pin | ESP32 pin | Code reference |
|---|---|---|---|
| RC522 RFID | SDA (SS) | GPIO 5 | `RFID_SS_PIN` |
| RC522 RFID | SCK | GPIO 18 | SPI (hardware) |
| RC522 RFID | MOSI | GPIO 23 | SPI (hardware) |
| RC522 RFID | MISO | GPIO 19 | SPI (hardware) |
| RC522 RFID | RST | GPIO 27 | `RFID_RST_PIN` |
| RC522 RFID | 3.3 V | **3V3** (not 5 V) | |
| LCD 16×2 I2C | SDA | GPIO 21 | I2C, address `0x27` |
| LCD 16×2 I2C | SCL | GPIO 22 | I2C |
| Relay module | IN | GPIO 26 | `SOLENOID_PIN` (high-level trigger) |
| Servo MG996R | Signal (orange) | GPIO 13 | `SERVO_PIN` |
| Buzzer | + | GPIO 4 | `BUZZER_PIN` |
| HC-SR04 WET bin | TRIG | GPIO 32 | `WET_TRIG_PIN` |
| HC-SR04 WET bin | ECHO | GPIO 33 via 1 kΩ / 2 kΩ divider | `WET_ECHO_PIN` |
| HC-SR04 DRY bin | TRIG | GPIO 25 | `DRY_TRIG_PIN` |
| HC-SR04 DRY bin | ECHO | GPIO 14 via 1 kΩ / 2 kΩ divider | `DRY_ECHO_PIN` |
| ESP32-CAM | U0T (GPIO 1) | GPIO 16 (RX2) | `CAM_RX_PIN` |
| ESP32-CAM | U0R (GPIO 3) | GPIO 17 (TX2) | `CAM_TX_PIN` |
| Buzzer, relay, LCD, HC-SR04, servo | GND | any GND pin | common ground |

**ECHO voltage divider (both HC-SR04s):** ECHO outputs 5 V, but ESP32 pins
tolerate 3.3 V.

```
HC-SR04 ECHO ──[ 1 kΩ ]──┬── ESP32 GPIO (33 or 14)
                          │
                       [ 2 kΩ ]   (2.2 kΩ also works)
                          │
                         GND
```

---

## 3. ESP32-CAM (AI-Thinker, OV2640 camera)

The camera ribbon plugs into the board's connector, latch closed. The pins below
are fixed on the AI-Thinker board, so nothing needs wiring except the UART link.

### Camera (on-board, fixed)

| Signal | GPIO |
|---|---|
| Data D0–D7 | 5, 18, 19, 21, 36, 39, 34, 35 |
| XCLK | 0 |
| PCLK | 22 |
| VSYNC | 25 |
| HREF | 23 |
| SIOD (SCCB SDA) | 26 |
| SIOC (SCCB SCL) | 27 |
| PWDN | 32 |
| RESET | not used (−1) |

### Other on-board items used by the sketch

| Item | GPIO | Notes |
|---|---|---|
| Flash LED | 4 | flash on during capture |
| Serial to main ESP32 | U0T (1) and U0R (3) | 115200 baud |

### UART link to main ESP32

| ESP32-CAM | Main ESP32 | Notes |
|---|---|---|
| U0T (GPIO 1) | GPIO 16 (RX2) | camera → main |
| U0R (GPIO 3) | GPIO 17 (TX2) | main → camera |
| GND | GND | required |

**Flashing the CAM:** use the ESP32-CAM-MB USB programmer. Unplug the two UART
wires (GPIO 1 and GPIO 3) before uploading, then plug them back in. The CAM uses
the same pins for upload and for the link.

---

## 4. Full signal path for one item

1. User taps RC522 card → main ESP32 checks Firebase `/users`.
2. Valid card → relay on GPIO 26 → solenoid unlocks for 5 s.
3. User drops waste on the flap.
4. Main ESP32 sends `CAPTURE` on GPIO 17 → CAM receives on GPIO 1.
5. CAM flashes the LED, takes a photo, runs the model, and replies on GPIO 3 →
   main receives on GPIO 16 with `RESULT:WET:0.93`, `RESULT:DRY:0.88` or
   `RESULT:NONE:0.97`.
6. Main ESP32 sorts it: servo on GPIO 13 tilts the flap to 30° (WET) or
   150° (DRY), or stays centered for `NONE`.
7. Main ESP32 awards points if confidence ≥ `MIN_CONFIDENCE` (0.60) and writes
   to Firebase.
8. Ultrasonic sensors on GPIO 32/33 and 25/14 measure fill level; the LCD shows
   it and an alert fires at 90 %.

---

## 5. Checklist before first power-on

- [ ] LM2596 output set to **5.0 V** with nothing else connected.
- [ ] RC522 is on **3V3**, not 5 V.
- [ ] Both HC-SR04 ECHO lines go through the 1 kΩ / 2 kΩ divider.
- [ ] Solenoid goes only through the relay, with the 1N4007 across it (stripe on +).
- [ ] Relay module jumper set to **H** (high-level trigger).
- [ ] All GNDs are common.
- [ ] CAM UART wires are **unplugged** while flashing the CAM.
- [ ] Edge Impulse library `#include` in `EcoStation_Cam.ino` matches the library name.

---

## 6. Build status (arduino-cli 1.5.1, esp32 core 3.3.12)

| Sketch | Board | Result |
|---|---|---|
| `EcoStation_Main` | `esp32:esp32:esp32` | compiles (83 % flash) |
| `EcoStation_Cam_Server` | `esp32:esp32:esp32cam` | compiles (35 % flash) |
| `EcoStation_Cam` | `esp32:esp32:esp32cam` | fails: `Wet_Dry_Waste_inferencing.h` not found. Needs your Edge Impulse library. |

## 7. Known gaps (from code review)

- **Option A has no `NONE` class.** `EcoStation_Cam.ino` only sends WET or DRY, so
  an empty flap can still earn points. Add an `empty` label to the Edge Impulse
  project and emit `RESULT:NONE` from the CAM sketch.
- **Relay trigger polarity:** `SOLENOID_ON` is `HIGH`. If the relay is
  active-low, change it in `EcoStation_Main.ino`.
- **Camera model is RGB only.** `getData()` packs three bytes per pixel. Keep the
  Edge Impulse impulse on RGB.
