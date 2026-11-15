# Smart Eco Station: Wiring (moisture-sensor build)

Every pin below comes from `EcoStation_Main/EcoStation_Main.ino`. This build has
**one ESP32 DevKit and no camera**. A third ultrasonic sensor above the flap sees
when an item is put down, and a moisture sensor on the flap decides wet or dry.

The camera build is kept as a backup: `EcoStation_Main_Camera` + `EcoStation_Cam`,
wired as in [WIRING_CAMERA.md](WIRING_CAMERA.md).

---

## 1. Power

```
12V 2A adapter ────► LM2596 IN+ ─────────────► LM2596 OUT+ (5V)
                                                     │
                                                     ├──► ESP32 DevKit VIN
                                                     ├──► Servo SG90 red (5V)
                                                     ├──► HC-SR04 WET bin VCC
                                                     ├──► HC-SR04 DRY bin VCC
                                                     ├──► HC-SR04 ITEM (flap) VCC
                                                     └──► LCD VCC
GND of every module ────► common ground (all GNDs tied together)
```

| From | To | Notes |
|---|---|---|
| 12V adapter + | LM2596 IN+ | |
| 12V adapter − | LM2596 IN−, common GND | |
| LM2596 OUT+ | ESP32 VIN, servo red, all three HC-SR04 VCC, LCD VCC | set to **5.0 V** before connecting anything |
| 1000 µF 16V capacitor | servo red / servo GND | stops brown-outs when the servo moves (long leg to 5V) |

The moisture sensor is **not** on the 5 V rail. It takes power from GPIO 16 (see section 2).

**Before powering up:** turn the LM2596 trim screw until the output reads 5.0 V,
with nothing connected to OUT+ yet.

### 1a. The four LM2596 terminals

| LM2596 pad | Connect to | What it is |
|---|---|---|
| **IN+** | 12 V adapter + (centre pin of the barrel plug) | 12 V in |
| **IN−** | 12 V adapter − (outer sleeve of the barrel plug) | 0 V in |
| **OUT+** | the 5 V rail: ESP32 VIN, servo red, all three HC-SR04 VCC, LCD VCC | 5 V out |
| **OUT−** | the common GND bus: GND of every module | 0 V out |

A breadboard's two power rails work well as the 5 V rail and GND bus: OUT+ to the
red rail, OUT− to the blue rail, and every module's VCC/GND taken from there.

### 1b. Getting the adapter into the LM2596

- **Easiest:** a female DC barrel jack with screw terminals (5.5 × 2.1 mm). Run a
  wire from the jack's **+** screw to IN+ and from its **−** screw to IN−.
- **Alternative:** cut the plug off and strip the two wires. Confirm which is +
  with a multimeter before connecting.

The LM2596 has **no reverse-polarity protection**. Check with a multimeter that
the wire going to IN+ reads +12 V against the one going to IN−.

---

## 2. Main ESP32 (ESP32 DevKit V1)

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
| Servo SG90 | Signal (orange) | GPIO 13 | `SERVO_PIN` |
| Servo SG90 | Red / Brown | 5 V rail / GND | |
| Buzzer | + | GPIO 4 | `BUZZER_PIN` |
| HC-SR04 WET bin | TRIG | GPIO 32 | `WET_TRIG_PIN` |
| HC-SR04 WET bin | ECHO | GPIO 33 via 1 kΩ / 2.2 kΩ divider | `WET_ECHO_PIN` |
| HC-SR04 DRY bin | TRIG | GPIO 25 | `DRY_TRIG_PIN` |
| HC-SR04 DRY bin | ECHO | GPIO 14 via 1 kΩ / 2.2 kΩ divider | `DRY_ECHO_PIN` |
| **HC-SR04 ITEM (above flap)** | TRIG | **GPIO 26** | `ITEM_TRIG_PIN` |
| **HC-SR04 ITEM (above flap)** | ECHO | **GPIO 35** via 1 kΩ / 2.2 kΩ divider | `ITEM_ECHO_PIN` |
| **Moisture sensor** | AO (analog out) | **GPIO 34** | `MOISTURE_PIN` |
| **Moisture sensor** | VCC | **GPIO 16** | `MOISTURE_PWR` |
| **Moisture sensor** | GND | GND | |
| **Moisture sensor** | DO (digital out) | not connected | |
| Everything | GND | any GND pin | common ground |

Notes on the new pins:
- **GPIO 34 and 35 are input-only.** That's fine: one only reads ECHO, the other
  only reads AO.
- The moisture AO must be on **GPIO 32–39 (ADC1)**. The other analog pins (ADC2)
  stop working while Wi-Fi is on. GPIO 34 is used.
- **Moisture VCC goes to GPIO 16, not 3V3.** The code switches the sensor on for a
  tenth of a second only while it reads, so the probe forks corrode much more
  slowly. It also keeps AO at 3.3 V or less, which is safe for the ESP32. (Wiring
  VCC to 3V3 also works, but the probes wear out faster.)
- GPIO 16 and 17 were the camera link. They are free in this build.

**ECHO voltage divider (all three HC-SR04s):** ECHO outputs 5 V, but ESP32 pins
take 3.3 V. Use one 1 kΩ + one 2.2 kΩ per sensor (3 × 1 kΩ and 3 × 2.2 kΩ in total).

```
HC-SR04 ECHO ──[ 1 kΩ ]──┬── ESP32 GPIO (33, 14 or 35)
                          │
                      [ 2.2 kΩ ]
                          │
                         GND
```

- The **1 kΩ** goes between ECHO and the ESP32 pin. The **2.2 kΩ** goes from the
  ESP32 pin to GND. Don't swap them.
- Colour bands: 1 kΩ is **brown-black-red**, 2.2 kΩ is **red-red-red**.

---

## 3. Where the two new sensors go

```
          HC-SR04 ITEM  (facing straight DOWN, 10-20 cm above the flap)
               ||
               \/
   ┌──────────────────────────┐
   │   waste lands here        │  <- flap (on the SG90)
   │   ═══ moisture probe ═══  │     probe forks lie flat on the flap,
   └────────────┬─────────────┘     facing up, where the waste lands
             SG90 pivot
     WET bin  ◄──   ──►  DRY bin
```

- **ITEM ultrasonic:** mount it above the middle of the flap, pointing straight
  down at it, at least 10 cm away (the HC-SR04 can't measure closer than about
  3 cm). Nothing else should be in its path.
- **Moisture probe:** glue or tape the probe board flat on the flap, forks facing
  up, in the spot where people put the waste. The waste has to touch the forks.
  Keep the wires loose enough for the flap to tilt both ways.
- Keep the flap light (thin plastic or card). The SG90 is a small servo.

---

## 4. Calibrating the moisture sensor (2 minutes)

At power-on the station reads the **empty, dry flap**. An item counts as **WET**
when the reading drops more than `MOISTURE_DROP` (400) below that dry value. Both
the resistive (two-fork) and capacitive sensors read lower when wet.

1. **Switch on with the flap empty and dry.** The LCD shows "Keep flap empty /
   Calibrating...".
2. Open **Tools > Serial Monitor** at **115200** baud. Every 2 s it prints a line
   like:
   `[Moisture] now=4095 dry-flap=4095 (WET below 3695)  flap=15.2 cm`
3. Put a **dry** item (paper, plastic) on the probe. Note `now`.
4. Put a **wet** item (fruit peel, wet tissue) on the probe. Note `now`.
5. You want the "WET below" number to sit between those two values.
   - Wet items show as DRY? Make `MOISTURE_DROP` **smaller** (e.g. 200).
   - Dry items show as WET? Make `MOISTURE_DROP` **bigger** (e.g. 800).
   Change it near the top of the sketch and upload again.
6. Also check `flap=`. It should drop by at least 1.5 cm when an item is on the
   flap. If small items aren't noticed, lower `ITEM_MIN_HEIGHT_CM`.

When you're done, you can set `MOISTURE_DEBUG = false` to stop the prints.

**Wipe the probe** after a very wet item. A wet probe makes the next item read wet too.

---

## 5. How it runs

1. User taps a card. The station checks Firebase `/users` (section on card
   registration in [README.md](README.md)).
2. Registered: LCD shows "Hi <name>, Put waste in", then counts down **10 s**
   (`DEPOSIT_TIME`): "Put waste on the flap...".
3. The ITEM ultrasonic sees the item land. After 1.5 s (`ITEM_SETTLE_TIME`) the
   station checks that the item is still there and reads the moisture sensor.
4. Wet or dry: the SG90 sweeps the flap to 30° (WET) or 150° (DRY) and back to
   90°. If it tilts the wrong way, swap `SERVO_WET` and `SERVO_DRY`.
5. +10 points to the user in Firebase. The LCD shows the new total.
6. Nothing put down within 10 s: "No waste seen / No points given".
7. The bin ultrasonics (GPIO 32/33 and 25/14) report fill levels to the LCD and
   the Authority Portal every 15 s and after every item.

---

## 6. Checklist before switching on

- [ ] LM2596 output set to 5.0 V with nothing connected.
- [ ] RC522 on **3V3**, not 5 V.
- [ ] All three HC-SR04 ECHO wires go through their 1 kΩ / 2.2 kΩ dividers.
- [ ] Moisture AO on **GPIO 34**, VCC on **GPIO 16**, GND on GND. DO left empty.
- [ ] 1000 µF capacitor across the servo's 5 V and GND (long leg to 5 V).
- [ ] Every GND is connected together.
- [ ] **The flap is empty and dry when you switch on.**
