# Smart Eco Station: Wiring

Every pin below comes from `EcoStation_Main/EcoStation_Main.ino`.

**The stack:**

| Part | Job |
|---|---|
| ESP32 DevKit | The brain |
| Computer USB | Power (through the ESP32's USB cable) |
| RC522 RFID | Reads the user's card |
| 16×2 I2C LCD | Shows messages and fill levels |
| SG90 servo | Tilts the flap into the WET or DRY bin |
| 2 × HC-SR04 (bin ultrasonics) | Fill level of the WET bin and the DRY bin |
| 1 × HC-SR04 ("eyes") | Above the flap: sees when waste is put down |
| Moisture sensor | On the flap: decides wet or dry |

---

## 1. Power from the computer's USB

The USB cable that you upload with also powers the whole station.

```
Computer USB ──► ESP32 micro-USB port
                     │
                     ├── VIN pin (≈5 V from USB) ──► 5 V rail on the breadboard (red line)
                     │                                  ├──► Servo SG90 red
                     │                                  ├──► HC-SR04 WET bin VCC
                     │                                  ├──► HC-SR04 DRY bin VCC
                     │                                  ├──► HC-SR04 EYES VCC
                     │                                  └──► LCD VCC
                     │
                     ├── 3V3 pin ──► RC522 3.3V   (NOT 5 V)
                     │
                     └── GND pin ──► GND rail (blue line) ──► GND of every module
```

| From (ESP32) | To | Notes |
|---|---|---|
| **VIN** | breadboard red rail (5 V) | some boards label this pin **5V** |
| **GND** | breadboard blue rail (GND) | every module's GND goes here |
| red rail | servo red, all three HC-SR04 VCC, LCD VCC | |
| **3V3** | RC522 3.3V | the RC522 is damaged by 5 V |
| **1000 µF capacitor** | across the red and blue rails, right next to the servo plug | **long leg to 5 V**, short leg (stripe side) to GND |

The moisture sensor is **not** on the 5 V rail. It takes power from GPIO 16 (see section 2).

### 1a. The servo and USB power

A computer USB port only gives about **0.5 A** (USB 2) or **0.9 A** (USB 3). The
SG90 pulls short bursts of current when it starts moving. If the ESP32 can't get
enough at that moment, it **restarts** (a "brown-out"). You'll see:

- the LCD going back to "Smart Eco Station booting" right when the flap moves, or
- `Brownout detector was triggered` in the Serial Monitor.

What stops it (already done or easy to do):

1. **The 1000 µF capacitor across the servo's 5 V and GND.** It acts as a small
   reserve tank for the servo's bursts. This is the main fix; don't skip it.
2. **The code already moves the flap slowly** (1° every 8 ms, `SERVO_STEP_MS`), which
   keeps the bursts small. If it still resets, make it 12 or 15.
3. **Use a short, thick USB cable** and plug straight into the laptop (a **blue USB 3**
   port if it has one), not into a hub or a long extension.
4. **Keep the flap light** (thin plastic or card). A heavy flap makes the servo pull more.
5. Still resetting? Plug the same USB cable into a **5 V 2 A phone charger** or a
   **power bank** instead of the laptop. Nothing else changes.

---

## 2. ESP32 DevKit pins

| Module | Module pin | ESP32 pin | Code reference |
|---|---|---|---|
| RC522 RFID | SDA (SS) | GPIO 5 | `RFID_SS_PIN` |
| RC522 RFID | SCK | GPIO 18 | SPI (hardware) |
| RC522 RFID | MOSI | GPIO 23 | SPI (hardware) |
| RC522 RFID | MISO | GPIO 19 | SPI (hardware) |
| RC522 RFID | RST | GPIO 27 | `RFID_RST_PIN` |
| RC522 RFID | 3.3V | **3V3** (not 5 V) | |
| LCD 16×2 I2C | SDA | GPIO 21 | I2C, address `0x27` |
| LCD 16×2 I2C | SCL | GPIO 22 | I2C |
| LCD 16×2 I2C | VCC / GND | 5 V rail / GND | |
| Servo SG90 | Signal (orange) | GPIO 13 | `SERVO_PIN` |
| Servo SG90 | Red / Brown | 5 V rail / GND | |
| HC-SR04 WET bin | TRIG | GPIO 32 | `WET_TRIG_PIN` |
| HC-SR04 WET bin | ECHO | GPIO 33 via 1 kΩ / 2.2 kΩ divider | `WET_ECHO_PIN` |
| HC-SR04 DRY bin | TRIG | GPIO 25 | `DRY_TRIG_PIN` |
| HC-SR04 DRY bin | ECHO | GPIO 14 via 1 kΩ / 2.2 kΩ divider | `DRY_ECHO_PIN` |
| HC-SR04 EYES (above flap) | TRIG | GPIO 26 | `ITEM_TRIG_PIN` |
| HC-SR04 EYES (above flap) | ECHO | GPIO 35 via 1 kΩ / 2.2 kΩ divider | `ITEM_ECHO_PIN` |
| Moisture sensor | AO (analog out) | GPIO 34 | `MOISTURE_PIN` |
| Moisture sensor | VCC | GPIO 16 | `MOISTURE_PWR` |
| Moisture sensor | GND | GND | |
| Moisture sensor | DO (digital out) | not connected | |
| Buzzer (optional) | + / − | GPIO 4 / GND | `BUZZER_PIN` |

Notes:
- **GPIO 34 and 35 are input-only.** That's fine: one only reads ECHO, the other
  only reads AO.
- The moisture AO must be on **GPIO 32–39**. Other analog pins stop working while
  Wi-Fi is on. GPIO 34 is used.
- **Moisture VCC goes to GPIO 16, not 3V3.** The code switches the sensor on only
  while it reads, so the probe forks corrode much more slowly. It also keeps AO at
  3.3 V or less, which is safe for the ESP32.
- **Buzzer:** not part of the stack, so it's optional. If you leave it out, the code
  still works; you just won't hear beeps.

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

## 3. Where the "eyes" and the moisture sensor go

```
          HC-SR04 EYES  (facing straight DOWN, 10-20 cm above the flap)
               ||
               \/
   ┌──────────────────────────┐
   │   waste lands here        │  <- flap (on the SG90)
   │   ═══ moisture probe ═══  │     probe forks lie flat on the flap,
   └────────────┬─────────────┘     facing up, where the waste lands
             SG90 pivot
     WET bin  ◄──   ──►  DRY bin
```

- **Eyes ultrasonic:** mount it above the middle of the flap, pointing straight
  down at it, at least 10 cm away (the HC-SR04 can't measure closer than about
  3 cm). Nothing else should be in its path. When waste lands, the distance gets
  shorter, and that's how the station knows something was put down.
- **Moisture probe:** glue or tape the probe board flat on the flap, forks facing
  up, in the spot where people put the waste. The waste has to touch the forks.
  Keep the wires loose enough for the flap to tilt both ways.
- **Bin ultrasonics:** one at the top of each bin, pointing straight down into it.
- Keep the flap light (thin plastic or card). The SG90 is a small servo.

---

## 4. Calibrating the moisture sensor (2 minutes)

At power-on the station reads the **empty, dry flap**. An item counts as **WET**
when the reading drops more than `MOISTURE_DROP` (400) below that dry value.

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
6. Also check `flap=` (that's the eyes). It should drop by at least 1.5 cm when an
   item is on the flap. If small items aren't noticed, lower `ITEM_MIN_HEIGHT_CM`.

When you're done, you can set `MOISTURE_DEBUG = false` to stop the prints.

**Wipe the probe** after a very wet item. A wet probe makes the next item read wet too.

---

## 5. How it runs

1. User taps a card. The station checks Firebase `/users` (card registration is in
   [README.md](README.md)).
2. Registered: LCD shows "Hi <name>, Put waste in", then counts down **10 s**
   (`DEPOSIT_TIME`): "Put waste on the flap...".
3. **The eyes** (ultrasonic above the flap) see the item land. After 1.5 s
   (`ITEM_SETTLE_TIME`) the station checks the item is still there.
4. **The moisture sensor** then decides: WET or DRY.
5. The SG90 sweeps the flap to 30° (WET) or 150° (DRY) and back to 90°. If it tilts
   the wrong way, swap `SERVO_WET` and `SERVO_DRY`.
6. +10 points to the user in Firebase. The LCD shows the new total.
7. Nothing put down within 10 s: "No waste seen / No points given".
8. The two bin ultrasonics report fill levels to the LCD and the Authority Portal
   every 15 s and after every item.

---

## 6. Checklist before plugging in the USB

- [ ] RC522 on **3V3**, not 5 V.
- [ ] Servo, LCD and all three HC-SR04 VCC on the **VIN / 5 V rail**.
- [ ] All three HC-SR04 ECHO wires go through their 1 kΩ / 2.2 kΩ dividers.
- [ ] Moisture AO on **GPIO 34**, VCC on **GPIO 16**, GND on GND. DO left empty.
- [ ] 1000 µF capacitor across the servo's 5 V and GND (long leg to 5 V).
- [ ] Every GND is connected together.
- [ ] **The flap is empty and dry when you plug in.**

---

The old camera build (ESP32-CAM, 12 V adapter, LM2596) is kept only as a backup in
[Backup_Camera/](Backup_Camera/README.md). You don't need it.
