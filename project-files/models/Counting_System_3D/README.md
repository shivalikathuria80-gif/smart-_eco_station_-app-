# Smart Eco Station: AI counting + load cell (3D model)

Open `counting_viewer.html` in any browser (works offline). Drag to rotate, scroll to zoom.
"Walls: Hidden" shows everything inside. "Bin doors: Open" swings both bin doors open. Matches the v2 plan in plans/Smart_Eco_Station_Item_Counting_and_Queue_Reviewed.docx.

## The 28-second animation
1. Tap the RFID card. LCD: spread up to 5 items.
2. Four dry items go on the matte green tray, apart.
3. The 1 kg load cell waits for a steady weight (45 g, inside 3-300 g).
4. The ESP32-CAM runs the FOMO model: 4 items, all DRY. Green boxes mark each item.
5. Count check: lowest of camera 4, weight 45 / 3 = 15, limit 5 = 4 items.
6. All dry, so the SG90 tips the whole batch right into the DRY bin.
7. Weight back to 0 g = verified: +40.
8. Second batch: 2 dry + 1 wet. The camera marks the wet one red.
9. Mixed, so the flap stays level (reject path). The user takes the wet item out.
10. Scan again: 2 dry, tip DRY, +20.
11. The wet item goes in on its own: camera WET + moisture WET, tip left into WET, +10.
12. Tap again to finish: 70 points saved to Firebase once.

## What is in the model (mm)
Cabinet 660 x 400 x 800. Solid white front panel with a 300 x 170 hand opening; RFID and LCD 1 sit on the outside of it. Below the shelf, two hinged bin doors (with clear windows) open so each bin slides out to be emptied. Shelf at 420 with a 240 x 200 hole.
Load cell stack on the shelf: fixed block, 1 kg bar load cell (80 long), spacer, narrow platform 60 x 200.
Two posts on the platform hold the flap axle. Sorting flap 200 x 160: 3D printed (2 mm PETG/PLA plate + 3 mm ribs, about 70 g), matte green, flat moisture sensor flush in the middle. Batch limit 150 g so the SG90 never stalls.
ESP32-CAM + white LED ring hang from the lid, about 200 mm above the tray.
Ultrasonic "eyes" on the back wall. ESP32 + HX711 on the shelf. LCD 1 + RFID on the front right.
WET bin left, DRY bin right, each with a chute.

## Files
- `counting_viewer.html`: animated, labelled viewer (offline)
- `counting_viewer_source.html`: same, loads three.js from a CDN (easier to edit)
- `counting_system.glb`: whole model with named parts
- `stl/`: full model, flap tray, load cell platform (with bracket and flap), servo bracket, camera lid mount
- `previews/`: 7 pictures (incl. bin doors open and RFID tap)
- Build script: models/_build/counting.js (run build2.py, then shoot2.js)
