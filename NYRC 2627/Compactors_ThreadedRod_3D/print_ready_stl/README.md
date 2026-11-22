# Threaded-rod compactor: print-ready parts (22 Nov 2026)

These replace the old servo-compactor prints. Ordered on Robu's 3D print service: 0.2 mm, PLA black, 40% infill.

| File | Qty | What it does | Hardware it takes |
|---|---|---|---|
| T1_bearing_block_x4.stl | 4 | Top + bottom block on each drive column. Holds the 608ZZ bearing and both 8 mm guide rods | 1 x 608ZZ (press in), 2 x M3 grub/self-tap screws on the rods, 2 x M4 screws into the frame bar. 2 small M2 holes under it for the micro switch |
| T2_carriage_x2.stl | 2 | Rides up and down. M8 nut in the top, one LM8UU per guide rod, neck goes through the 16 mm bin slot | 1 x M8 nut, 2 x LM8UU, M3 self-tap screws as grub screws |
| T3_plate_bracket_x2.stl | 2 | L-bracket: bolts to the end of the neck and on top of the plywood press plate | 2 x M4 self-tap into the neck, 2 x M4 bolt + nut through the plate |
| T4_motor_mount_x2.stl | 2 | Stands on the cabinet floor; 25GA-370 hangs under its top plate, shaft up | 2 x M3 into the gearbox face (slots fit 17 or 18 mm spacing), 2-4 x M4 wood screws |
| T5_coupler_4to8_x2.stl | 2 | Rigid coupler: 4 mm D-shaft to M8 threaded rod | 1 x M8 nut in the hex pocket, 2 x M3 grub screws |

Notes
- The coupler is rigid, so line the motor up under the rod before tightening the mount screws.
- Holes are sized for PLA: 608 pocket 22.2 mm, LM8UU bore 15.2 mm, rod holes 8.2 mm.
- Source: make_parts.py (Python, manifold3d).
