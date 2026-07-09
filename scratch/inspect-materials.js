const fs = require('fs');
const path = require('path');

function inspectMaterials(gltfPath) {
  const filePath = path.resolve(gltfPath);
  if (!fs.existsSync(filePath)) {
    console.log(`${gltfPath} does not exist`);
    return;
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`\n=== Materials in ${gltfPath} ===`);
    if (data.materials) {
      data.materials.forEach((m, idx) => {
        console.log(`Material ${idx}: name="${m.name}"`);
      });
    } else {
      console.log('No materials found');
    }
  } catch(e) {
    console.log(`Failed to parse ${gltfPath} as JSON: ${e.message}`);
  }
}

inspectMaterials('public/asset-01/scene.gltf');
