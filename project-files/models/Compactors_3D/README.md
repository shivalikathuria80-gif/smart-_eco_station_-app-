# Bin compactors 3D model

Open `compactors_viewer.html` in any browser (works offline). Drag to rotate, scroll to zoom.

## How it works
- Each bin (WET and DRY) has its own compactor: a FIXED TOP PLATE bolted to the bin frame and a PRESS PLATE, joined by a 3-stage scissor (arms 125 mm).
- An HC-SR04 fill sensor on the top plate looks down through a window in the press plate.
- When a bin reaches 70% (red line), the ESP32 turns the SG90, which opens the scissor and pushes the press plate down about 270 mm.
- The waste is squeezed from 70% to about 46%, then the plate goes back up.

## Size (mm)
Bin 260 x 340 x 520. Top plate 600 mm above the floor. Scissor angle 12 deg (up) to 70 deg (down).

## Files
- `compactors_viewer.html`: animated, labelled viewer
- `compactors.glb`: whole model with named parts (Blender, Fusion, Windows 3D Viewer)
- `stl/`: full model + press plate, top plate, one scissor arm
- `previews/`: 4 pictures
- `compactors_viewer_source.html`: editable source (loads three.js from the internet)

Note: an SG90 is fine to show the movement. To really squash waste, it needs a stronger servo or a lead screw.
