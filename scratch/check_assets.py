import os

def check_file(filepath):
    print(f"Checking {filepath}...")
    try:
        with open(filepath, 'rb') as f:
            content = f.read(1000000) # Read first 1MB
            
        # Search for interesting strings
        keywords = [b'cadaver', b'lying', b'table', b'bed', b'floor', b'ground', b'platform', b'hologram', b'base', b'stand']
        for kw in keywords:
            if kw in content:
                print(f"  Found keyword: {kw}")
                
        # Search for ASCII object names (often starts with Model:: or Mesh:: or Node::)
        # Let's count occurrences of some common keywords
        for kw in [b'Model', b'Mesh', b'Node', b'Z-Anatomy']:
            count = content.count(kw)
            if count > 0:
                print(f"  Keyword '{kw}' count: {count}")
    except Exception as e:
        print(f"  Error: {e}")

check_file("public/asset-01/SkeletalSystem100.fbx")
check_file("public/asset-01/scene.gltf")
check_file("public/asset-01/splanchnology.glb")
check_file("public/asset-01/myology.glb")
