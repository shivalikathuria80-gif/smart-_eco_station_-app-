# Threaded-rod compactors (3D model + build notes)

Open `threaded_compactors_viewer.html` in any browser (works offline). Drag to rotate, scroll to zoom. "Walls: Hidden" shows the drive column clearly.

This replaces the servo compactor. One compactor per bin (WET and DRY). Everything bolts to the **bin frame**. Nothing is fixed to the 6 mm plywood shelf or lid.

## How it works
1. A 5 V geared DC motor stands **under** the threaded rod, behind the bin, shaft pointing up.
2. A flexible coupler joins the motor shaft (4 mm) to an **M8 threaded rod** (330 mm).
3. The rod turns in two 608 bearings (top and bottom blocks). Two lock nuts squeeze the **top** bearing, so all the pressing force goes into the frame, never into the motor's gearbox.
4. A **carriage** holds an M8 nut and two LM8UU bearings that slide on **two 8 mm guide rods**. Every turn of the rod moves the carriage 1.25 mm.
5. A short **neck** on the carriage goes through a 16 mm slot in the back of the bin and holds the **press plate** (236 x 300, 6 mm plywood).
6. An M8 rod is **self-locking**: when the motor stops, the plate stays where it is, even under load.

## When it stops
- **Top (home):** a micro switch under the top block. The carriage clicks it when the plate is parked just above the bin rim.
- **Bottom:** no switch. The bin's fill ultrasonic (kept) looks down through a 60 mm hole in the plate. The ESP32 stops pressing when:
  - the reading hasn't changed for 2 s (waste is fully squeezed), or
  - the bin reads 40% (plate never hits the floor), or
  - 150 s have passed (safety timeout).
- Then it reverses until the top switch clicks (timeout 150 s, "COMPACTOR ERROR" on the LCD if it never clicks).

## Numbers
- Motor: 25GA-370, 6 V, 130 RPM. On 5 V through the DRV8833 it gets about 4.7 V, so about 100 RPM.
- Speed: 100 RPM x 1.25 mm = about 125 mm per minute. A full cycle (down, press, up) takes about 3.5 minutes. It only runs when a bin reaches 70%.
- Force: at about 1.5 kg-cm on the rod (M8, greased, about 20% efficient) the plate pushes about 150 N (15 kg). Near stall it is well over 300 N. The servo design could not get close to this.
- Plate travel: 386 mm (parked) down to 160 mm (lowest). The bin goes from 70% to about 46%.
- Fits under the 420 mm shelf: the top block ends at 416 mm.

## Why DRV8833 and not L298N
The L298N loses about 2 V inside itself. On a 5 V supply the motor would get only about 3 V: about 35% slower, about 35% weaker, and the L298N gets hot. The DRV8833 loses about 0.3 V, takes 3.3 V logic, drives **both** motors from one board, and costs ₹79 on Robu (the L298N is ₹131).

## Wiring (no new ESP32 pins)
The ESP32 is out of free pins, so a **PCF8574 I2C board** (₹79) shares the LCD's wires and gives 8 extra pins.

| From | To |
|---|---|
| PCF8574 VCC / GND | 5 V rail / GND |
| PCF8574 SDA / SCL | GPIO 21 / GPIO 22 (same wires as the LCD) |
| PCF8574 address jumpers A0, A1, A2 | all to GND, address 0x20 (LCD stays 0x27) |
| PCF8574 P0 / P1 | DRV8833 IN1 / IN2 (WET motor) |
| PCF8574 P2 / P3 | DRV8833 IN3 / IN4 (DRY motor) |
| PCF8574 P4 | WET top switch NO (switch COM to GND) |
| PCF8574 P5 | DRY top switch NO (switch COM to GND) |
| DRV8833 VCC (VM) / GND | 5 V adapter rail / GND (common GND with the ESP32) |
| DRV8833 SLP or EEP pin (if your board has one) | 5 V |
| DRV8833 OUT1 / OUT2 | WET motor |
| DRV8833 OUT3 / OUT4 | DRY motor |

Rules: only one compactor runs at a time, and never while the flap servo moves. If a plate goes up when it should go down, swap that motor's two wires.

## Changes to the bins
- **Back slot:** 16 mm wide, from the rim down to 150 mm, in the middle of the back wall. Stick a brush or rubber strip over it.
- **Side window:** 180 x 80 mm, high up in the inner side (290 to 370 mm). The chute ends here, so waste drops in **under** the parked plate.
- Bins still slide out of the front when the plate is parked.
- Needs about 60 mm free behind each bin for the drive column.

## Files
- `threaded_compactors_viewer.html`: animated, labelled viewer (offline)
- `threaded_compactors_viewer_source.html`: same, loads three.js from a CDN
- `threaded_compactors.glb`: whole model with named parts
- `stl/`: full model, carriage, bearing block, press plate, motor mount (shape reference, not print-ready yet)
- `previews/`: 6 pictures
- `PARTS_LIST.md`: what to buy, with Robu prices
- Build script: models/_build/threaded.js (run build2.py, then shoot3.js)
