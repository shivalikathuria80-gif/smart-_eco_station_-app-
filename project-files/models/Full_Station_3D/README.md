# Smart Eco Station: full 3D model

Open `station_viewer.html` in any browser (works offline). Drag to rotate, scroll to zoom.
"Waste: WET/DRY" picks which bin the waste goes to. "Walls: Hidden" shows everything inside.

## The 20-second animation
1. Tap your RFID card: LCD 1 says hi.
2. Drop the waste in through the slot.
3. ESP32-CAM sees a sealed bag, so the bag splitter presses it onto the blades.
4. Waste falls onto the flap; the ultrasonic "eyes" confirm it is there.
5. The moisture sensor decides WET or DRY; the SG90 flap tips; waste slides down the chute into the bin.
6. +10 points on LCD 1.
7. The bin passes 70%, so its scissor compactor squeezes it to about 46%.
8. LCD 2 (Arduino Uno weather box) keeps showing temperature, humidity, rain and air quality.

## What is in the model
Cabinet 660 x 400 x 640 with a clear front. Sorting head on top (same as Bag_Splitter_3D).
RFID RC522 + LCD 1 on the front-left panel. ESP32 DevKit + breadboard in a clear box, powered by computer USB.
WET bin (left) and DRY bin (right), each with a scissor compactor and an HC-SR04 fill sensor.
Arduino Uno weather box with LCD 2, DHT22, MQ-135 and a rain plate. Solar panel on a mast, for show only (not wired).

## Files
- `station_viewer.html`: animated, labelled viewer
- `smart_eco_station.glb`: whole station with named parts
- `stl/smart_eco_station_full.stl`: whole station as one STL (printable parts are in Bag_Splitter_3D and Compactors_3D)
- `previews/`: 5 pictures
- `station_viewer_source.html`: editable source
