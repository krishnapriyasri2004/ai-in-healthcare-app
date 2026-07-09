import bpy
import bmesh
import numpy as np
import mathutils

def clamp(val, min_v, max_v):
    return max(min_v, min(val, max_v))

# 1. Clear existing objects and reload anatomy.glb
print("Clearing scene...")
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

filepath = r"C:\Users\Nepula\Downloads\3-d-anatomy-visualization\public\anatomy.glb"
print(f"Importing GLB from {filepath}...")
bpy.ops.import_scene.gltf(filepath=filepath)

obj = bpy.data.objects.get('geometry_0')
img = bpy.data.images.get('Image_0')

# Remove duplicate if exists
if 'geometry_0.001' in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects['geometry_0.001'], do_unlink=True)

if not obj:
    raise Exception("geometry_0 not found!")

# 2. Extract loose parts and classify them using BMESH in memory
print("Analyzing mesh in memory...")
bm = bmesh.new()
bm.from_mesh(obj.data)
uv_layer = bm.loops.layers.uv.active

# Load image pixels for sampling
if img:
    width, height = img.size
    pixels = np.array(img.pixels).reshape((height, width, 4))
else:
    pixels = None

print("Finding connected face components (islands)...")
visited_faces = set()
islands = []

for face in bm.faces:
    if face not in visited_faces:
        island_faces = []
        queue = [face]
        visited_faces.add(face)
        while queue:
            curr = queue.pop()
            island_faces.append(curr)
            for edge in curr.edges:
                for other_face in edge.link_faces:
                    if other_face not in visited_faces:
                        visited_faces.add(other_face)
                        queue.append(other_face)
        islands.append(island_faces)

print(f"Total face islands found: {len(islands)}")

# Classifications mapping: category name -> list of face islands
categories = {
    "Skeletal_Bones": [],
    "Skeletal_Ribcage": [],
    "Skeletal_Skull": [],
    "Muscular_Muscles": [],
    "Nervous_Brain": [],
    "Nervous_Nerves": [],
    "Cardio_Heart": [],
    "Cardio_Arteries": [],
    "Cardio_Veins": [],
    "Resp_Lungs_Left": [],
    "Resp_Lungs_Right": [],
    "Resp_Trachea": [],
    "Digestive_Stomach": [],
    "Digestive_Liver": [],
    "Digestive_Intestines": [],
    "Urinary_Kidney_Left": [],
    "Urinary_Kidney_Right": [],
    "Urinary_Bladder": []
}

print("Classifying islands...")
for idx, island in enumerate(islands):
    # Get vertices of this island
    verts = set(v for f in island for v in f.verts)
    coords = np.array([obj.matrix_world @ mathutils.Vector(v.co) for v in verts])
    min_coords = np.min(coords, axis=0)
    max_coords = np.max(coords, axis=0)
    centroid = (min_coords + max_coords) / 2.0
    x, y, z = centroid
    dx, dy, dz = max_coords - min_coords
    
    # Get average color from texture
    r, g, b = 0.5, 0.5, 0.5 # default
    if pixels is not None and uv_layer:
        uvs = []
        for f in island[:5]: # sample up to 5 faces
            for loop in f.loops:
                uvs.append(loop[uv_layer].uv)
        if uvs:
            uvs = np.array(uvs)
            avg_u = np.mean(uvs[:, 0])
            avg_v = np.mean(uvs[:, 1])
            px = int(clamp(avg_u, 0, 0.999) * width)
            py = int(clamp(avg_v, 0, 0.999) * height)
            r, g, b = pixels[py, px][:3]

    # Heuristics based on texture colors
    is_skeleton = (r > 0.6 and g > 0.6 and b > 0.6) or (r > 0.55 and g > 0.55 and b > 0.55 and abs(r-g) < 0.05 and abs(g-b) < 0.05)
    is_nervous = (r > 0.5 and g > 0.5 and b < 0.4)
    is_artery = (r > 0.5 and g < 0.35 and b < 0.35)
    is_vein = (b > 0.5 and r < 0.35 and g < 0.4)
    is_muscle = (r > 0.35 and g < 0.35 and b < 0.35) and not is_artery
    
    if is_skeleton:
        if z > 0.38:
            categories["Skeletal_Skull"].append(island)
        elif 0.1 < z < 0.35 and y > -0.04 and dx > 0.15:
            categories["Skeletal_Ribcage"].append(island)
        else:
            categories["Skeletal_Bones"].append(island)
    elif is_nervous:
        if z > 0.38:
            categories["Nervous_Brain"].append(island)
        else:
            categories["Nervous_Nerves"].append(island)
    elif is_artery:
        categories["Cardio_Arteries"].append(island)
    elif is_vein:
        categories["Cardio_Veins"].append(island)
    elif is_muscle:
        categories["Muscular_Muscles"].append(island)
    else:
        # Organs
        if z > 0.38:
            categories["Nervous_Brain"].append(island)
        elif 0.2 < z < 0.35:
            if x < -0.05:
                categories["Resp_Lungs_Left"].append(island)
            elif x > 0.05:
                categories["Resp_Lungs_Right"].append(island)
            elif -0.05 <= x <= 0.05 and y > 0.01:
                categories["Cardio_Heart"].append(island)
            else:
                categories["Resp_Trachea"].append(island)
        elif 0.1 < z <= 0.22:
            if x < -0.03:
                if y < -0.01:
                    categories["Urinary_Kidney_Left"].append(island)
                else:
                    categories["Digestive_Stomach"].append(island)
            elif x > 0.03:
                if y < -0.01:
                    categories["Urinary_Kidney_Right"].append(island)
                else:
                    categories["Digestive_Liver"].append(island)
            else:
                categories["Digestive_Intestines"].append(island)
        elif -0.05 < z <= 0.12:
            categories["Digestive_Intestines"].append(island)
        elif -0.15 < z <= -0.05:
            categories["Urinary_Bladder"].append(island)
        else:
            categories["Muscular_Muscles"].append(island)

# Create final objects from classified islands
final_objects = {}
for cat_name, islands_list in categories.items():
    if not islands_list:
        continue
        
    print(f"Generating mesh for {cat_name} ({len(islands_list)} islands)...")
    
    # Create new mesh and object
    new_mesh = bpy.data.meshes.new(name=cat_name)
    new_obj = bpy.data.objects.new(name=cat_name, object_data=new_mesh)
    bpy.context.scene.collection.objects.link(new_obj)
    
    # Fill new bmesh
    bm_new = bmesh.new()
    vert_map = {}
    
    for island in islands_list:
        for face in island:
            new_verts = []
            for v in face.verts:
                if v.index not in vert_map:
                    # Convert to object local coordinates
                    # (since we are creating a new object at origin with no transform,
                    # we should use the world coordinates of the vertices)
                    world_co = obj.matrix_world @ v.co
                    new_v = bm_new.verts.new(world_co)
                    vert_map[v.index] = new_v
                new_verts.append(vert_map[v.index])
            
            try:
                bm_new.faces.new(new_verts)
            except Exception:
                pass
                
    # Update mesh
    bm_new.to_mesh(new_mesh)
    bm_new.free()
    new_mesh.update()
    
    # Rename objects based on rules
    if cat_name.startswith("Skeletal_"):
        new_obj.name = f"System_Skeletal_{cat_name.split('_')[1]}"
    elif cat_name.startswith("Muscular_"):
        new_obj.name = "System_Muscular_Muscles"
    elif cat_name.startswith("Nervous_"):
        if "Brain" in cat_name:
            new_obj.name = "Organ_Brain"
        else:
            new_obj.name = "System_Nervous_Nerves"
    elif cat_name.startswith("Cardio_"):
        if "Heart" in cat_name:
            new_obj.name = "Organ_Heart"
        elif "Arteries" in cat_name:
            new_obj.name = "System_Cardio_Arteries"
        else:
            new_obj.name = "System_Cardio_Veins"
    elif cat_name.startswith("Resp_"):
        new_obj.name = f"Organ_{cat_name.split('Resp_')[1]}"
    elif cat_name.startswith("Digestive_"):
        new_obj.name = f"Organ_{cat_name.split('Digestive_')[1]}"
    elif cat_name.startswith("Urinary_"):
        new_obj.name = f"Organ_{cat_name.split('Urinary_')[1]}"
        
    final_objects[new_obj.name] = new_obj

# Clean up bmesh
bm.free()

# Delete original object
bpy.data.objects.remove(obj, do_unlink=True)

# 4. Generate outer skin boundary (Integumentary System)
print("Generating outer skin boundary mesh...")
bpy.ops.object.select_all(action='DESELECT')
for name in ["System_Skeletal_Bones", "System_Skeletal_Ribcage", "System_Skeletal_Skull", "System_Muscular_Muscles"]:
    if name in final_objects:
        final_objects[name].select_set(True)

active_name = None
for name in ["System_Muscular_Muscles", "System_Skeletal_Bones"]:
    if name in final_objects:
        active_name = name
        break

if active_name:
    bpy.context.view_layer.objects.active = final_objects[active_name]
    bpy.ops.object.duplicate()
    bpy.ops.object.join()
    skin_obj = bpy.context.active_object
    skin_obj.name = "System_Integumentary_Skin"
    
    # Add Remesh modifier to merge them into a single closed volume
    remesh_mod = skin_obj.modifiers.new(name="Remesh", type='REMESH')
    remesh_mod.mode = 'VOXEL'
    remesh_mod.voxel_size = 0.015
    remesh_mod.adaptivity = 0.0
    
    # Add Smooth modifier
    smooth_mod = skin_obj.modifiers.new(name="Smooth", type='SMOOTH')
    smooth_mod.factor = 1.0
    smooth_mod.iterations = 15
    
    # Add Displace modifier to inflate it slightly
    displace_mod = skin_obj.modifiers.new(name="Displace", type='DISPLACE')
    displace_mod.strength = 0.008
    
    # Apply all modifiers
    bpy.ops.object.modifier_apply(modifier="Remesh")
    bpy.ops.object.modifier_apply(modifier="Smooth")
    bpy.ops.object.modifier_apply(modifier="Displace")
    
    # Clean up mesh (decimate to keep it lightweight)
    decimate_mod = skin_obj.modifiers.new(name="Decimate", type='DECIMATE')
    decimate_mod.ratio = 0.15
    bpy.ops.object.modifier_apply(modifier="Decimate")
    
    final_objects[skin_obj.name] = skin_obj
    print(f"Generated skin mesh: {skin_obj.name} with {len(skin_obj.data.vertices)} vertices")
else:
    print("Could not generate skin mesh (no active object found)")

# 5. Create Holographic materials and apply them
print("Applying holographic materials...")
def create_glow_material(name, color_hex, emission_strength=1.5, transmission=0.0, alpha=1.0):
    hex_color = color_hex.lstrip('#')
    rgb = [int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
    bsdf.inputs['Roughness'].default_value = 0.1
    bsdf.inputs['Emission Color'].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
    bsdf.inputs['Emission Strength'].default_value = emission_strength
    bsdf.inputs['Alpha'].default_value = alpha
    bsdf.inputs['Transmission Weight'].default_value = transmission
        
    output = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    mat.blend_method = 'BLEND'
    return mat

materials_map = {
    "Integumentary_Skin": create_glow_material("Skin_Mat", "#00D2FF", emission_strength=0.3, transmission=0.9, alpha=0.15),
    "Skeletal": create_glow_material("Skeletal_Mat", "#70FFFF", emission_strength=0.8, transmission=0.5, alpha=0.6),
    "Muscular": create_glow_material("Muscular_Mat", "#6B00FF", emission_strength=0.6, alpha=0.5),
    "Nervous": create_glow_material("Nervous_Mat", "#A0FF00", emission_strength=2.0, alpha=1.0),
    "Brain": create_glow_material("Brain_Mat", "#BB00FF", emission_strength=1.5, alpha=0.9),
    "Heart": create_glow_material("Heart_Mat", "#FF0055", emission_strength=2.0, alpha=1.0),
    "Arteries": create_glow_material("Arteries_Mat", "#FF0033", emission_strength=1.8, alpha=1.0),
    "Veins": create_glow_material("Veins_Mat", "#0055FF", emission_strength=1.8, alpha=1.0),
    "Lungs": create_glow_material("Lungs_Mat", "#00FFA0", emission_strength=0.8, transmission=0.8, alpha=0.5),
    "Trachea": create_glow_material("Trachea_Mat", "#00FFD2", emission_strength=1.0, alpha=0.8),
    "Digestive": create_glow_material("Digestive_Mat", "#7700FF", emission_strength=0.8, transmission=0.8, alpha=0.6),
    "Urinary": create_glow_material("Urinary_Mat", "#00AAFF", emission_strength=1.0, transmission=0.8, alpha=0.7)
}

# Assign materials to meshes
for name, obj in final_objects.items():
    obj.data.materials.clear()
    if "Skin" in name:
        obj.data.materials.append(materials_map["Integumentary_Skin"])
    elif "Skeletal" in name:
        obj.data.materials.append(materials_map["Skeletal"])
    elif "Muscular" in name:
        obj.data.materials.append(materials_map["Muscular"])
    elif "Brain" in name:
        obj.data.materials.append(materials_map["Brain"])
    elif "Nerves" in name:
        obj.data.materials.append(materials_map["Nervous"])
    elif "Heart" in name:
        obj.data.materials.append(materials_map["Heart"])
    elif "Arteries" in name:
        obj.data.materials.append(materials_map["Arteries"])
    elif "Veins" in name:
        obj.data.materials.append(materials_map["Veins"])
    elif "Lung" in name:
        obj.data.materials.append(materials_map["Lungs"])
    elif "Trachea" in name:
        obj.data.materials.append(materials_map["Trachea"])
    elif any(d in name for d in ["Stomach", "Liver", "Intestines"]):
        obj.data.materials.append(materials_map["Digestive"])
    elif any(u in name for u in ["Kidney", "Bladder"]):
        obj.data.materials.append(materials_map["Urinary"])

# 6. Set up hierarchy collections
print("Setting up hierarchy collections...")
scene_collection = bpy.context.scene.collection

# Create collections for systems
collections = {}
for system_name in ["Skeletal", "Muscular", "Nervous", "Cardiovascular", "Respiratory", "Digestive", "Urinary", "Integumentary"]:
    col = bpy.data.collections.new(system_name)
    scene_collection.children.link(col)
    collections[system_name] = col

# Link objects to respective collections and unlink from main collection
for name, obj in final_objects.items():
    system = "Integumentary"
    if "Skeletal" in name:
        system = "Skeletal"
    elif "Muscular" in name:
        system = "Muscular"
    elif "Nervous" in name or "Brain" in name:
        system = "Nervous"
    elif "Cardio" in name or "Heart" in name:
        system = "Cardiovascular"
    elif "Lung" in name or "Trachea" in name:
        system = "Respiratory"
    elif any(d in name for d in ["Stomach", "Liver", "Intestines"]):
        system = "Digestive"
    elif any(u in name for u in ["Kidney", "Bladder"]):
        system = "Urinary"
        
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    collections[system].objects.link(obj)

# 7. Parent all objects to the 'world' empty
world_empty = bpy.data.objects.get('world')
if not world_empty:
    world_empty = bpy.data.objects.new("world", None)
    scene_collection.objects.link(world_empty)

for obj in final_objects.values():
    obj.parent = world_empty

# 8. Export to GLB
print(f"Exporting to {filepath}...")
bpy.ops.export_scene.gltf(
    filepath=filepath,
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT'
)
print("Processing finished successfully!")
