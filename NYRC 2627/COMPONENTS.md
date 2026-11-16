# Smart Eco Station: Components List & Wiring

Final stack: ESP32 DevKit, powered from the computer USB, RFID, LCD, SG90 servo, 2 bin ultrasonics, 1 ultrasonic "eyes" above the flap, moisture sensor. The old camera build (ESP32-CAM, 12 V adapter, LM2596) is kept only as a backup in [Backup_Camera/](Backup_Camera/README.md).

## 1. Components

### Electronics
| # | Component | Qty | Purpose |
|---|---|---|---|
| 1 | ESP32 DevKit V1 (30/38-pin) | 1 | Main controller + Wi-Fi |
| 4 | RC522 RFID reader module | 1 | Reads user cards |
| 5 | RFID cards / key tags (13.56 MHz) | 5+ | One per user |
| 9 | SG90 micro servo (plastic gear) | 1 | Tilts the flap to wet/dry bin (keep the flap light) |
| 10 | HC-SR04 ultrasonic sensor | 3 | 2 for bin fill levels + 1 "eyes" above the flap |
| 10a | Soil moisture sensor (resistive or capacitive, with AO pin) | 1 | On the flap: decides wet or dry |
| 11 | 16×2 LCD with I2C module (PCF8574) | 1 | Shows messages and fill levels |
| 12 | Active buzzer (5V) | (1) | Optional: beeps for success / error |
| 13 | Resistors 1 kΩ | 3 | Voltage divider for ECHO pins |
| 14 | Resistors 2.2 kΩ | 3 | Voltage divider for ECHO pins |
| 15 | Capacitor 1000 µF / 16V | 1 | Across servo 5V/GND, stops resets on USB power |

### Power
| # | Component | Qty | Purpose |
|---|---|---|---|
| 16 | USB cable (micro-USB or USB-C, to match your ESP32) | 1 | Power and uploading, from the computer |

### Wiring & build
| # | Component | Qty |
|---|---|---|
| 18 | Breadboard or dotted PCB | 1 |
| 19 | Jumper wires (M-M, M-F, F-F) | 40+ |
| 20 | Two dustbins (label: WET / DRY) | 2 |
| 21 | Flap / platform (cardboard, acrylic or MDF) | 1 |
| 22 | Enclosure / station body with lid | 1 |

### Other
| # | Item | Purpose |
|---|---|---|
| 23 | Laptop | Powers the station over USB and shows the website |
| 24 | Wi-Fi router or phone hotspot | Connects the ESP32 and the laptop |

## 2. Pin connections

### Main ESP32
| Module | Module pin | ESP32 pin |
|---|---|---|
| RC522 | SDA (SS) | GPIO 5 |
| RC522 | SCK | GPIO 18 |
| RC522 | MOSI | GPIO 23 |
| RC522 | MISO | GPIO 19 |
| RC522 | RST | GPIO 27 |
| RC522 | 3.3V | **3V3** (not 5V!) |
| LCD I2C | SDA | GPIO 21 |
| LCD I2C | SCL | GPIO 22 |
| HC-SR04 WET | TRIG | GPIO 32 |
| HC-SR04 WET | ECHO | GPIO 33 (through 1k/2.2k divider) |
| HC-SR04 DRY | TRIG | GPIO 25 |
| HC-SR04 DRY | ECHO | GPIO 14 (through 1k/2.2k divider) |
| Servo | Signal (orange) | GPIO 13 |
| HC-SR04 EYES (above flap) | TRIG | GPIO 26 |
| HC-SR04 EYES (above flap) | ECHO | GPIO 35 (through 1k/2.2k divider) |
| Moisture sensor | AO | GPIO 34 |
| Moisture sensor | VCC | GPIO 16 (switched on only while reading) |
| Buzzer (optional) | + | GPIO 4 |

### Power
| From | To |
|---|---|
| Computer USB | ESP32 USB port |
| ESP32 VIN (5V from USB) | Servo red, all three HC-SR04 VCC, LCD VCC |
| ESP32 3V3 | RC522 3.3V |
| All GNDs | Connected together (common ground) |

## 3. ECHO voltage divider (for each HC-SR04)
The HC-SR04 ECHO pin outputs 5V, but ESP32 pins take 3.3V max.

```
ECHO ──[ 1kΩ ]──┬── ESP32 GPIO
                │
             [ 2.2kΩ ]
                │
               GND
```

## 4. Safety notes
- **Servo (SG90):** red to the 5V rail fed from the ESP32's VIN pin, brown to GND, orange to GPIO 13. Keep the 1000 µF capacitor across its 5V/GND (long leg to 5V): a computer USB port gives little current, and without it the ESP32 can restart when the flap moves. More fixes in WIRING.md section 1a. The SG90 has plastic gears and lifts only about 1.8 kg·cm, so use a light flap (thin cardboard or plastic), pivot it near its middle, and never force the horn by hand while it is powered.

## 5. Where to buy: Robu.in (single source)

Prices and stock were checked on robu.in on 29 Sep 2026 (₹, incl. GST) and may have changed since. Parts marked ⚠️ were **out of stock** then. For the cheap passives, the link is a Robu search page, because there are hundreds of near-identical listings.

| # | Component | Qty | Price (each) | Link |
|---|---|---|---|---|
| 1 | SmartElex ESP32-WROOM-32D DevKit | 1 | ₹819 | https://robu.in/product/smartelex-esp-wroom-32-wifi-bluetooth-networking-development-board-1-pcs/ |
| 4 | RC522 RFID reader + card & key tag | 1 | ₹69 | https://robu.in/product/mifare-rfid-readerwriter-13-56mhz-rc522-spi-s50-fudan-card-and-keychain/ |
| 5 | Extra 13.56 MHz RFID cards | 4+ | – | https://robu.in/?s=13.56mhz+rfid+card&post_type=product |
| 9 | SG90 micro servo (180°) | 1 | — | (team switched from the MG996R in Nov 2026) |
| 10 | HC-SR04 ultrasonic sensor | 3 | ₹79 | https://robu.in/product/hc-sr04-ultrasonic-range-finder/ |
| 11 | LCD1602 with I2C interface | 1 | ₹189 | https://robu.in/product/lcd1602-parallel-lcd-display-with-iic-i2c-interface/ |
| 12 | 5V active buzzer (optional) | 1 | ₹18 | https://robu.in/product/5v-active-electromagnetic-buzzer-pack-of-5/ |
| 13 | 1 kΩ resistor (through-hole) | 3 | ₹2.45 | https://robu.in/?s=1k+ohm+0.25w+carbon+film+resistor&post_type=product |
| 14 | 2 kΩ / 2.2 kΩ resistor (through-hole) | 3 | – | https://robu.in/?s=2.2k+ohm+0.25w+resistor&post_type=product |
| 15 | 1000 µF 16V/25V electrolytic capacitor | 1 | – | https://robu.in/?s=1000uf+25v+capacitor&post_type=product |
| 19 | 830-point breadboard (transparent) | 1 | ₹159 | https://robu.in/product/transparent-830-points-solderless-breadboard/ |
| 20 | Jumper wires M-M 40 pcs | 1 | ₹49 | https://robu.in/product/male-to-male-jumper-wires-40-pcs-10cm/ |
| 21 | Jumper wires M-F 40 pcs | 1 | ₹49 | https://robu.in/product/male-to-female-jumper-wires-40pcs-20cm/ |
| 22 | Jumper wires F-F 40 pcs | 1 | ₹49 | https://robu.in/product/10cm-female-female-breadboard-jumper-dupont-2-54mm-1p-1p-cable-40-pcs/ |

**Approximate total (linked items with prices): about ₹1,650** (no camera, no 12V adapter, no LM2596: the computer USB powers it). Dustbins, flap and enclosure are extra; get these locally.

## 6. Where to buy: Amazon.in (all in stock, 29 Sep 2026)

All of these were in stock and added to the Amazon cart.

| # | Component | Qty | Price | Link |
|---|---|---|---|---|
| 1 | ESP32 DevKit V1 (30-pin, WROOM-32) | 1 | ₹559 | https://www.amazon.in/dp/B0HD7QC26L |
| 4 | RC522 RFID kit + card + key tag (ApTechDeals) | 1 | ₹157 | https://www.amazon.in/dp/B07Q1B6QZR |
| 5 | RFID cards 13.56 MHz, pack of 10 | 1 | ₹325 | https://www.amazon.in/dp/B0CL9YVX2V |
| 9 | SG90 micro servo | 1 | — | any SG90 / TowerPro SG90 |
| 10 | HC-SR04 ultrasonic sensor (Robocraze) | 3 | ₹170 | https://www.amazon.in/dp/B01I1ZTPJC |
| 11 | 16×2 LCD with pre-soldered I2C | 1 | ₹249 | https://www.amazon.in/dp/B0DQVF3HXG |
| 12 | 5V active buzzer (optional) | 1 | ₹55 | https://www.amazon.in/dp/B0H1X539R9 |
| 13 | Resistor kit, 500 pcs, 50 values | 1 | ₹189 | https://www.amazon.in/dp/B0DV93JVVK |
| 14 | 1000 µF 25V capacitors, pack of 10 | 1 | ₹134 | https://www.amazon.in/dp/B0H2WZBVCZ |
| 18 | 830-point breadboard (Themisto) | 1 | ₹157 | https://www.amazon.in/dp/B0CGJDY5HL |
| 19 | Jumper wire set (M-F + M-M + F-F) | 1 | ₹299 | https://www.amazon.in/dp/B0G3XYG92V |

**Total: about ₹2,650** (no camera, no 12V adapter, no LM2596).

**Notes**
- **Resistor kit:** it covers 1 Ω–2.2 MΩ in 50 values, but the listing doesn't list them. Make sure it includes 1 kΩ and 2 kΩ or 2.2 kΩ before you order.
