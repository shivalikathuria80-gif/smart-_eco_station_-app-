# Bag splitter 3D model

Open `bag_splitter_viewer.html` in any browser (works offline). Drag to rotate, scroll to zoom.
The animation plays the full cycle; "Waste: WET/DRY" switches which bin the flap tips to.

## How it works
1. Sealed bag drops through the top slot onto the blade bed.
2. ESP32-CAM sees a closed bag and starts the press.
3. SG90 servo turns a 2:1 gear pair, so the hinged press plate swings down 88 degrees and pushes the bag onto 6 rows of saw blades.
4. Bag splits; plate lifts; contents fall between the blade rows into the funnel.
5. Funnel drops them on the moisture sensor sitting on the sorting flap.
6. Flap tips left (WET) or right (DRY).

## Size (mm)
Box 180 wide x 170 deep x 330 tall. Blade teeth 20 tall, 18 mm gaps. Press plate 150 x 128.
Gears: 16 mm and 8 mm radius (2:1). SG90 servos and gears sit OUTSIDE the right/back walls so the blades stay enclosed.

## Files
- `bag_splitter_viewer.html`: interactive 3D viewer with labels and animation
- `bag_splitter.glb`: whole model with named parts (opens in Blender, Fusion, Windows 3D Viewer)
- `stl/`: full assembly + separate parts (press plate, blade bed, funnel, sorting flap, gears)
- `previews/`: 4 rendered pictures (overview, pressing, falling, sorting)
- `viewer_source.html`: editable source (three.js not inlined)

Note: the funnel STL is a thin surface for display; give it wall thickness in Fusion/Tinkercad before 3D printing.
