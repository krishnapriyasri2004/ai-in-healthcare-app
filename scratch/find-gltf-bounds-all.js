const fs = require('fs');
const path = require('path');

function parseGlb(filePath) {
  const data = fs.readFileSync(filePath);
  const magic = data.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    throw new Error('Invalid GLB file');
  }
  const length = data.readUInt32LE(8);
  let offset = 12;
  let jsonChunk = null;
  while (offset < length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.readUInt32LE(offset + 4);
    if (chunkType === 0x4E4F534A) { // JSON
      const jsonBuffer = data.slice(offset + 8, offset + 8 + chunkLength);
      jsonChunk = JSON.parse(jsonBuffer.toString('utf8'));
      break;
    }
    offset += 8 + chunkLength;
  }
  return jsonChunk;
}

function getBounds(gltfData) {
  const accessors = gltfData.accessors || [];
  const meshes = gltfData.meshes || [];
  const nodes = gltfData.nodes || [];
  
  let overallMin = [Infinity, Infinity, Infinity];
  let overallMax = [-Infinity, -Infinity, -Infinity];
  let hasValidAccessor = false;
  
  meshes.forEach((mesh) => {
    if (!mesh.primitives) return;
    mesh.primitives.forEach((prim) => {
      if (prim.attributes && prim.attributes.POSITION !== undefined) {
        const acc = accessors[prim.attributes.POSITION];
        if (acc && acc.min && acc.max) {
          hasValidAccessor = true;
          for (let i = 0; i < 3; i++) {
            overallMin[i] = Math.min(overallMin[i], acc.min[i]);
            overallMax[i] = Math.max(overallMax[i], acc.max[i]);
          }
        }
      }
    });
  });
  
  if (!hasValidAccessor) return null;
  return { min: overallMin, max: overallMax };
}

const assetDir = 'public/asset-01';
const files = ['scene.gltf', 'splanchnology.glb', 'myology.glb'];

files.forEach(f => {
  const filePath = path.join(assetDir, f);
  try {
    let data;
    if (f.endsWith('.gltf')) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      data = parseGlb(filePath);
    }
    const bounds = getBounds(data);
    if (bounds) {
      const size = [
        bounds.max[0] - bounds.min[0],
        bounds.max[1] - bounds.min[1],
        bounds.max[2] - bounds.min[2]
      ];
      console.log(`File: ${f}`);
      console.log(`  Size: [${size.map(x=>x.toFixed(3)).join(', ')}]`);
      console.log(`  Min:  [${bounds.min.map(x=>x.toFixed(3)).join(', ')}]`);
      console.log(`  Max:  [${bounds.max.map(x=>x.toFixed(3)).join(', ')}]`);
    } else {
      console.log(`File: ${f} has no bounds`);
    }
  } catch (e) {
    console.error(`Error processing ${f}: ${e.message}`);
  }
});
