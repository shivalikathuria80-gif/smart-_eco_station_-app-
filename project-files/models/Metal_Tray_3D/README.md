# Smart Eco Station: metal tray + drop check (3D model)

Open `metal_viewer.html` in any browser (works offline). Drag to rotate, scroll to zoom.
"Walls: Hidden" shows the flap and sensors. Same cabinet as Counting_System_3D; WET/DRY flap and compactors are unchanged.

## The 26-second animation
1. Tap the RFID card.
2. A can goes on the painted metal spot on the flap.
3. Inductive sensor says METAL (orange glow). The flap stays locked level.
4. LCD: "METAL: put it in side tray" + 10 s countdown. The IR beam is now ARMED (bright red).
5. The user moves the can to the side tray. It breaks the beam inside the timer (beam flashes green).
6. +15 points, only after the drop check.
7. Cheat test: a paper ball thrown straight into the side tray breaks the beam, but the beam was NOT armed (yellow flash): 0 points.
8. Timeout test: a second can is detected, the user takes it away, 10 s pass with no drop: no points.
9. Tap again to finish: 15 points saved once.

## What is in the model (mm)
- Cabinet 660 x 400 x 800, lid 6 mm plywood (carries only the camera + LED ring).
- Flap 200 x 160 with an 18 mm hole at x = +55 mm. An LJ18A3-8-Z/BX **5V** inductive sensor sits in it with its face flush with the tray top, held by 2 nuts on a printed clamp under the ribs. A painted ring marks the "metal check spot".
- METAL side tray 180 x 240 x 560, standing on the floor right of the cabinet, bolted to the cabinet wall with 2 steel L-brackets (M4). No compactor.
- IR break-beam pair (5 mm emitter + receiver) across the mouth, 30 mm below the rim, running front to back.

## Build notes
- Buy the **5V** version of the inductive sensor. The normal LJ12A3/LJ18A3 needs 6-36 V and the station has no 12 V.
- Aluminium cans are sensed at only about a third of the rated range, so the sensor face must be flush with the tray (no plastic over it). The 8 mm LJ18A3 is safer than the 4 mm LJ12A3 for this.
- Both sensors have open-collector outputs: use INPUT_PULLUP on the ESP32 (3.3 V), no extra resistor needed.
- Beam rule in code: count a break only within 10 s after the inductive sensor saw metal; then disarm.

## Files
- `metal_viewer.html`: animated, labelled viewer (offline)
- `metal_viewer_source.html`: same, loads three.js from a CDN
- `metal_tray.glb`: whole model with named parts
- `stl/`: full model, metal side tray, flap with the metal spot
- `previews/`: 7 pictures
- Build script: models/_build/metal.js (run build2.py, then shoot3.js)
