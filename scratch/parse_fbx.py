import re

def find_specific_strings(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
        
    pattern = re.compile(b'[a-zA-Z0-9_\\-\\.\\: ]{4,100}')
    matches = pattern.findall(data)
    
    unique_matches = sorted(list(set(matches)))
    
    for m in unique_matches:
        s = m.decode('ascii', errors='ignore').lower()
        if any(x in s for x in ['table', 'cadaver', 'lying', 'platform', 'dissection']):
            print(f"Match: {m.decode('ascii', errors='ignore')}")

find_specific_strings("public/asset-01/SkeletalSystem100.fbx")
