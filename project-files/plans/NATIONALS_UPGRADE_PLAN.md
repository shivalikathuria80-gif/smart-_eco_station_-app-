# Smart Eco Station: Nationals Upgrade Plan

Plan only, no code yet. Three new features:

1. **Weather sensors:** DHT22 (temperature + humidity), raindrop sensor, MQ-135 (air quality)
2. **2nd LCD** that shows only the weather readings
3. **Live dashboard:** the readings go to Firebase, and the authority page shows them per station
4. **Solar panel:** display and explanation only (no light at the venue, so it does not power anything)

Nothing in the existing wiring moves. The ESP32 stays off the breadboard on its female
jumpers, and the RFID keeps the 3V3 pin and the 2nd GND pin.

---

## 1. Parts to get

| Qty | Part | Notes |
|---|---|---|
| 1 | DHT22 module (3-pin, on a small board) | The 3-pin board already has the pull-up resistor. If you get the bare 4-pin one, also get one 10 kΩ resistor. |
| 1 | Raindrop sensor kit (rain plate + small control board, "FC-37" / "YL-83") | Comes with a 2-wire lead from plate to board |
| 1 | MQ-135 gas sensor module | 4 pins: VCC, GND, DO, AO |
| 1 | 16×2 I2C LCD (with the blue I2C backpack on the back) | Same type as the one you have |
| 1 + 1 | 1 kΩ resistor and 2.2 kΩ resistor | For the MQ-135 output (same divider as the ultrasonics) |
| ~12 | Female-to-male jumper wires | For the new modules into the breadboard |
| ~6 | Male-to-male jumper wires | For the breadboard junction rows |
| 1 | Small solar panel (6 V, 1–5 W) | Display only |
| 1 | TP4056 charging board + 1 × 18650 holder (optional, display only) | To show the "charge path" on the model |
| 1 | 5 V 2 A phone charger or power bank | Strongly recommended for nationals (see section 3) |

---

## 2. Pins (no clashes with the current build)

Pins already in use today: **4, 5, 13, 14, 16, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35**.

New pins:

| Module | Module pin | Goes to | Why this pin |
|---|---|---|---|
| DHT22 | DATA (OUT) | **GPIO 17** | Free, plain digital pin |
| DHT22 | VCC (+) | **GPIO 15** | Gives it 3.3 V. The 3V3 pin is taken by the RFID. The DHT22 uses under 2 mA, so a pin can power it. The code keeps it on all the time. |
| DHT22 | GND (−) | GND rail (blue) | |
| Rain sensor board | AO | **GPIO 39** (labelled **VN**) | Analog pin that still works with Wi-Fi on |
| Rain sensor board | VCC | **GPIO 2** | Switched on only while reading, like the moisture sensor, so the rain plate corrodes slower |
| Rain sensor board | GND | GND rail | |
| Rain sensor board | DO | not connected | |
| MQ-135 | AO | **1 kΩ / 2.2 kΩ divider → GPIO 36** (labelled **VP**) | Analog, Wi-Fi safe. The divider is needed because the MQ-135 runs on 5 V. |
| MQ-135 | VCC | 5 V rail (red) | Its heater needs 5 V |
| MQ-135 | GND | GND rail | |
| MQ-135 | DO | not connected | |
| LCD #2 | SDA | **GPIO 21** (shared with LCD #1) | Same I2C wires, different address |
| LCD #2 | SCL | **GPIO 22** (shared with LCD #1) | |
| LCD #2 | VCC / GND | 5 V rail / GND rail | Also put the backlight jumper on, like LCD #1 |

MQ-135 divider (same as the ultrasonic ECHO ones):

```
MQ-135 AO ──[ 1 kΩ ]──┬── GPIO 36 (VP)
                       │
                   [ 2.2 kΩ ]
                       │
                      GND
```

Notes:
- **GPIO 36 and 39 are input-only.** That's fine: both only read.
- GPIO 2 and 15 are boot pins, but these hook-ups are safe for them. If an upload
  ever says "Failed to connect", unplug the rain sensor's VCC jumper from GPIO 2,
  upload, then plug it back.
- **Later:** if you decide to drop the 2 bin ultrasonics, that frees GPIO 32, 33, 25
  and 14. Nothing in this plan needs them, so you can decide that separately.

### Sharing SDA / SCL between the two LCDs (no cutting)

1. Pick two empty breadboard rows. Call them the **SDA row** and the **SCL row**.
2. Unplug LCD #1's SDA wire **at the LCD end only** and push its other end
   (or a male-to-male jumper joined to it) into the SDA row. Same for SCL into the SCL row.
   The ESP32 end stays exactly where it is.
3. From the SDA row, run one female-to-male jumper to LCD #1 SDA and one to LCD #2 SDA.
4. From the SCL row, the same to both SCLs.

### Giving LCD #2 its own address

Both LCDs can't be 0x27 at the same time.

1. Plug in **only LCD #2** (in place of LCD #1).
2. In Arduino IDE open **File > Examples > Wire > WireScan** and upload. The Serial
   Monitor prints the address.
3. If it says **0x3F**: done. LCD #1 stays 0x27, LCD #2 is 0x3F.
4. If it says **0x27** too: on LCD #2's backpack there are three pairs of pads
   marked **A0 A1 A2**. Put a small blob of solder across **A0** only. Scan again:
   it should now say **0x26**. (This is the only soldering in the plan, and it is
   only on the new LCD.)
5. Put LCD #1 back, wire both as above, scan once more: you should see two addresses.

---

## 3. Power

The station already runs on computer USB, and the servo is the reason for the
brown-out notes in WIRING.md 1a. The new parts add:

| Part | Current (approx.) |
|---|---|
| MQ-135 heater | **~150 mA, all the time** (the big one) |
| LCD #2 with backlight | ~25 mA |
| DHT22 | ~2 mA |
| Rain sensor | a few mA, only while reading |

A laptop USB 2 port gives about 500 mA, and the ESP32's Wi-Fi alone can take 250 mA in
bursts. With the MQ-135 on, that is too close.

**Decision for nationals:** run the station from a **5 V 2 A phone charger or power
bank**, using the same USB cable. Nothing else changes. Keep the laptop only for
uploading code. If you must use the laptop, use a **USB 3 (blue) port** and do the
power test in step 7 of the build order.

The MQ-135 also gets warm. That's normal. Mount it where nobody touches it and
not right next to the DHT22 (the heat would make the temperature read high):
keep them at least 10 cm apart.

---

## 4. What each sensor reports

| Reading | From | What we show | Honest note |
|---|---|---|---|
| Temperature | DHT22 | e.g. `28.4 °C` | Real value, good to about ±0.5 °C |
| Humidity | DHT22 | e.g. `61 %` | Real value |
| Rain | Rain plate | **DRY / DRIZZLE / RAINING** | Measured as how wet the plate is, not millimetres of rain |
| Air quality | MQ-135 | **GOOD / MODERATE / POOR** | A relative index from a clean-air baseline taken at power-on, not exact ppm. A cheap MQ-135 needs factory calibration for real ppm. Say "air quality index" to judges, not "CO₂ ppm". |

The MQ-135 needs about **2–3 minutes to warm up** after power-on before its baseline
means anything. The plan: LCD #2 shows "Air sensor warming up" for the first 3 minutes,
then takes the clean-air baseline. So **switch the station on at least 5 minutes
before judging**, in clean air.

How often: every 15 seconds, at the same time the bin levels already upload
(DHT22 can't be read faster than once every 2 s anyway).

---

## 5. LCD #2 (weather screen)

LCD #1 doesn't change: it keeps doing cards, waste and points.

LCD #2 flips between two screens every 4 seconds:

```
┌────────────────┐      ┌────────────────┐
│Temp 28.4C      │      │Air:  GOOD      │
│Humidity 61%    │      │Rain: DRY       │
└────────────────┘      └────────────────┘
```

If a sensor isn't plugged in or fails, that line shows `--` instead of freezing the
station. The waste sorting never waits for the weather sensors.

---

## 6. Data flow to Firebase and the website

```
DHT22 ─┐
Rain  ─┼─► ESP32 ──every 15 s──► Firebase /bins/STATION-01/env ──► Authority page (live)
MQ-135 ┘     │                                                  └► Public website (live)
             └──► LCD #2
```

The station already writes `/bins/STATION-01` every 15 s (zone, fill levels, time). The
weather readings go **inside the same record**, as a new `env` part:

```
/bins/STATION-01
    zone:    "School Block A"
    columns: { wet: 40, dry: 15 }        (already there)
    updated: "..."                        (already there)
    env:                                  (NEW)
        temp:     28.4
        humidity: 61
        rain:     "DRY"       rainRaw: 4012
        air:      "GOOD"      airRaw:  812
        updated:  "..."
```

Why inside `/bins`: both pages already listen to `/bins` live, so the new readings
arrive on the pages with no new database listener and no database rule changes.
Each station (STATION-01, STATION-02, ...) gets its own `env`, so "per station"
comes for free.

**Optional history** (only if you want a small chart): once every 5 minutes the station
also adds one entry to `/envLog/STATION-01`. Skip it if time is short; the live view
works without it.

**Alerts** (small, useful for judges): when rain changes to RAINING, or air changes
to POOR, the station adds one line to the existing `/logs` list, e.g.
"STATION-01: Rain detected, cover the bins". The authority page already shows `/logs`.

---

## 7. Website changes (in plain words)

**Authority page** (the PIN page), on each station's bin card:
- A new **weather strip** under the fill bars: thermometer icon + temperature,
  droplet icon + humidity, a coloured **Air** badge (green GOOD, amber MODERATE,
  red POOR) and a **Rain** badge (DRY / DRIZZLE / RAINING).
- "Last reading: 12 s ago". If no reading for over 1 minute, the strip greys out and
  says **Offline**, so stale numbers never look live.
- If a station has no `env` yet, the strip says "No weather sensors on this station".
- Optional: a small 1-hour line chart of temperature and air index (needs the history above).

**Public website:**
- On each station card, one line: "28 °C · 61 % · Air GOOD · Dry". Read-only,
  no PIN needed. Optional, but it shows the "smart city" side to visitors.

No changes to card registration, points, the PIN or the Vercel setup.

---

## 8. The solar panel (explanation only)

There's no light at the venue, so don't pretend it powers the station. Judges respect
honesty more than a fake demo. Present it as **"solar-ready design"**.

**On the model:**
- Mount the small panel on the station's roof, tilted, facing the judges.
- Run its two wires to a TP4056 board and an 18650 holder fixed next to it, with a
  label: **"Solar charge path: panel → charger → battery → 5 V → ESP32"**.
- **Do not connect it to the ESP32 or the breadboard.** The station stays on the
  USB charger. A small label: "Demo runs on USB; venue has no sunlight".

**On the poster / one slide** (simple diagram + numbers):

```
Solar panel ─► Charge controller ─► Battery ─► 5 V regulator ─► Station
   (day)          (stops over-          (night /
                   charging)             cloudy)
```

Numbers you can say out loud (rounded, from our own parts list):
- The station uses about **5 V × 0.4 A ≈ 2 W** when everything is on
  (MQ-135 heater alone is ~0.75 W).
- Always on, that's about **48 Wh per day**.
- A **20 W panel** in about 5 hours of good sun, after losses, gives roughly
  **60–70 Wh per day**, enough to run it and charge a battery for the night.
- A **12 V 7 Ah battery (≈ 84 Wh)** carries it through about 1.5 days of cloud.
- Power saving we'd add for a real street station: LCD backlights off when nobody is
  near, air sensor read every few minutes instead of always on.

**What to say (about 20 seconds):**
"In the field, the station runs on a 20-watt panel and a battery, so it can sit in a
park with no wall socket. The hall has no sunlight, so today it runs on USB, but
this is the exact charging path and the sizing we worked out."

---

## 9. Build order

Do one part at a time and check it before moving on.

1. **Address check for LCD #2** (section 2, "Giving LCD #2 its own address").
2. **Wire the DHT22** (GPIO 17 data, GPIO 15 power, GND). Don't move anything else.
3. **Wire the rain sensor** (GPIO 39 AO, GPIO 2 VCC, GND).
4. **Wire the MQ-135** with its divider (GPIO 36, 5 V, GND). Keep it 10 cm from the DHT22.
5. **Wire LCD #2** through the SDA/SCL junction rows.
6. **Ask Claude to update the sketch** (`EcoStation_Main`) for the new sensors and
   LCD #2, and to add a sensor self-test print in the Serial Monitor. Upload and check
   each reading moves:
   - DHT22: breathe on it → humidity goes up.
   - Rain: a few drops on the plate → DRIZZLE / RAINING.
   - MQ-135: after warm-up, hold hand sanitizer near it → air goes MODERATE / POOR.
7. **Power test:** on the phone charger (or USB 3), tap a card and sort **10 items in a
   row** with everything on. If the LCD ever shows "booting" mid-sort, it's a brown-out:
   see WIRING.md 1a.
8. **Ask Claude to update the authority page** (weather strip, offline state, alerts)
   and, if wanted, the public site line. Check the readings show live with the station
   running.
9. **Solar display:** mount panel + TP4056 + battery holder, add the labels, make the
   poster / slide.
10. **Full rehearsal:** power on 5 minutes early, card tap → sort → points → weather on
    LCD #2 → authority page → solar explanation.

---

## 10. Demo tricks for judges

| Show | How |
|---|---|
| Humidity rising | Breathe gently on the DHT22 |
| Rain alert | Spray bottle or wet fingers on the rain plate; the authority page shows RAINING and an alert line |
| Air getting worse | Hand sanitizer or a marker pen near the MQ-135 (not touching) |
| Per-station dashboard | Open the authority page on a phone next to the station |
