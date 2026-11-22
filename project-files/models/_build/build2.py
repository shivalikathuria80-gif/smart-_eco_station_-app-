import sys
name,title,scene,out=sys.argv[1:5]
s=open('template.html').read().replace('__TITLE__',title)
P='package/examples/js/'
src=s.replace('/*LIB*/',open('lib.js').read()).replace('/*SCENE*/',open(scene).read())
open(out.replace('.html','_source.html'),'w').write(src.replace('<script>/*THREE*/</script>','<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"></script>').replace('<script>/*ORBIT*/</script>','<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js"></script>').replace('<script>/*STL*/</script>','<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/exporters/STLExporter.js"></script>').replace('<script>/*GLTF*/</script>','<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/exporters/GLTFExporter.js"></script>'))
for tag,f in [('/*THREE*/','package/build/three.min.js'),('/*ORBIT*/',P+'controls/OrbitControls.js'),('/*STL*/',P+'exporters/STLExporter.js'),('/*GLTF*/',P+'exporters/GLTFExporter.js')]:
    src=src.replace(tag,open(f).read().replace('</script>','<\\/script>'))
open(out,'w').write(src)
