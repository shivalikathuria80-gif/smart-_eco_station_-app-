import manifold3d as m, numpy as np, trimesh, os
M=m.Manifold
m.set_circular_segments(64) if hasattr(m,'set_circular_segments') else None
def box(x0,x1,y0,y1,z0,z1): return M.cube([x1-x0,y1-y0,z1-z0]).translate([x0,y0,z0])
def cylz(r,z0,z1,x=0,y=0,n=64): return M.cylinder(z1-z0,r,r,n).translate([x,y,z0])
def cylx(r,x0,x1,y=0,z=0,n=48): return M.cylinder(x1-x0,r,r,n).rotate([0,90,0]).translate([x0,y,z])
def cyly(r,y0,y1,x=0,z=0,n=48): return M.cylinder(y1-y0,r,r,n).rotate([-90,0,0]).translate([x,y0,z])
def hexz(af,z0,z1,x=0,y=0): return M.cylinder(z1-z0,af/np.sqrt(3),af/np.sqrt(3),6).translate([x,y,z0])
def save(p,name):
    me=p.to_mesh(); t=trimesh.Trimesh(me.vert_properties[:,:3],me.tri_verts)
    assert t.is_watertight, name
    t.export(f'out/{name}'); b=t.bounds; print(name, np.round(b[1]-b[0],1), 'vol cm3',round(t.volume/1000,1))
os.makedirs('out',exist_ok=True)

# 1. Bearing block (x4). Print flat (Z up). X along bar, +Y = frame side, Z = rod axis.
L,H=116,12; Y0,Y1=-14,15
b=box(-L/2,L/2,Y0,Y1,0,H)
b=b-cylz(11.1,H-7.3,H+1)          # 608ZZ pocket 22.2 x 7.3 (press fit)
b=b-cylz(5.0,-1,H+1)               # M8 rod clearance 10 mm
for px in (-50,50): b=b-cylz(4.1,-1,H+1,x=px)   # 8 mm guide rods, 8.2 holes
b=b-cylx(1.3,53,L/2+1,z=H/2); b=b-cylx(1.3,-L/2-1,-53,z=H/2)   # M3 self-tap grub into each rod hole
for px in (-27,27):                # 2 x M4 screws into the frame bar (along Y), counterbored at the back
    b=b-cyly(2.2,Y0-1,Y1+1,x=px,z=H/2)
    b=b-cyly(4.3,Y0-1,Y0+4,x=px,z=H/2)
for dx in (-4.75,4.75):            # KW10 micro switch, 2 x M2 self-tap holes under the block
    b=b-cylz(0.9,-1,7,x=36+dx,y=8)
save(b,'T1_bearing_block_x4.stl')

# 2. Carriage (x2). Print on its back face (Z up). X across, Y = rod axis (up in use), Z toward the bin.
D=22; ZA=D/2
c=box(-60,60,-5,25,0,D)
for sx in (-1,1): c=c-box(min(sx*15,sx*37),max(sx*15,sx*37),0,20,-1,D+1)   # lightening windows
c=c-cyly(5.0,-6,26,z=ZA)                         # M8 rod clearance
c=c-M.cylinder(7,13.3/np.sqrt(3),13.3/np.sqrt(3),6).rotate([-90,0,0]).translate([0,25-6.8,ZA]) # M8 nut trap, open at the top
for px in (-50,50):
    c=c-cyly(7.6,-6,19.5,x=px,z=ZA)              # LM8UU bore 15.2 x 24.5 from the bottom
    c=c-cyly(4.75,-6,26,x=px,z=ZA)               # 9.5 rod clearance above it
    s_=1 if px>0 else -1
    x0,x1=sorted((px+s_*7,s_*61))
    c=c-cylx(1.3,x0,x1,y=7,z=ZA)                 # M3 self-tap grub into the LM8UU bore
c=c+box(-6,6,-15,25,D,D+30)                      # neck 12 wide, 30 long: goes through the 16 mm bin slot
for y in (-5,15): c=c-cylz(1.7,D+12,D+31,y=y)    # 2 x M4 self-tap into the neck end face
save(c,'T2_carriage_x2.stl')

# 3. Plate bracket (x2): L, vertical leg bolts to the neck end, horizontal leg sits on the press plate.
# Print on its side: profile in YZ, extruded 40 in X.
pb=box(-18,18,-15,30,0,5) + box(-18,18,25,30,0,50)
for y in (-5,15): pb=pb-cylz(2.2,-1,6,y=y)       # M4 clearance to neck
for x in (-10,10): pb=pb-cyly(2.2,24,31,x=x,z=32) # M4 bolts down through the plywood
save(pb,'T3_plate_bracket_x2.stl')

# 4. Motor mount (x2). In use Y is up. Print lying on the back wall (z=0 face down).
mm=box(-25,25,0,4,0,62)            # floor plate
mm=mm+box(-25,25,0,65,0,4)         # back wall
mm=mm+box(-25,25,60,65,0,44)       # top plate, motor axis at z=30
mm=mm+box(-25,-22,4,60,4,28)+box(22,25,4,60,4,28)   # side walls (stiffen the top plate)
for x in (-15,15): mm=mm-cyly(2.2,-1,5,x=x,z=53)    # 2 x M4 into the floor (in front of the top plate)
for x in (-14,14): mm=mm-cylz(2.2,-1,5,x=x,y=36)    # 2 x M4 through the back wall
mm=mm-cyly(4.2,59,66,z=30)         # 8.4 hole for shaft + boss
for x in (-8.5,8.5):               # M3 slots, fit 17 or 18 mm hole spacing
    for dx in (-0.5,0,0.5): mm=mm-cyly(1.7,59,66,x=x+np.sign(x)*dx,z=30)
save(mm,'T4_motor_mount_x2.stl')

# 5. Coupler (x2): 4 mm D-shaft to M8 threaded rod. Print standing up.
cp=cylz(11,0,34)
cp=cp-(cylz(2.15,-1,15)-box(-3,3,1.65,3,-1,15))   # 4.3 D hole with flat at 3.8
cp=cp-cylz(4.15,17,35)                            # 8.3 bore for the M8 rod
cp=cp-hexz(13.3,27,35)                            # M8 nut trap at the top end
cp=cp-cyly(1.3,0,12,z=7)                          # M3 grub onto the D flat
cp=cp-cylx(1.3,0,12,z=21)                          # M3 grub onto the rod
save(cp,'T5_coupler_4to8_x2.stl')
