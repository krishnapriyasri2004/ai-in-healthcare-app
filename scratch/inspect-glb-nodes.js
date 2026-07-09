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

function analyzeFile(fileName) {
  const filePath = path.resolve('public/asset-01', fileName);
  console.log(`\n=========================================`);
  console.log(`Analyzing: ${fileName}`);
  console.log(`=========================================`);
  
  const gltf = parseGlb(filePath);
  const accessors = gltf.accessors || [];
  const meshes = gltf.meshes || [];
  const nodes = gltf.nodes || [];
  
  function getMeshBounds(meshIndex) {
    const mesh = meshes[meshIndex];
    if (!mesh || !mesh.primitives) return null;
    let overallMin = [Infinity, Infinity, Infinity];
    let overallMax = [-Infinity, -Infinity, -Infinity];
    let hasValidAccessor = false;
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
    if (!hasValidAccessor) return null;
    return { min: overallMin, max: overallMax };
  }

  const nodeBounds = [];
  nodes.forEach((node, nodeIdx) => {
    if (node.mesh !== undefined) {
      const bounds = getMeshBounds(node.mesh);
      if (bounds) {
        const size = [
          bounds.max[0] - bounds.min[0],
          bounds.max[1] - bounds.min[1],
          bounds.max[2] - bounds.min[2]
        ];
        nodeBounds.push({
          nodeIdx,
          name: node.name,
          meshIdx: node.mesh,
          min: bounds.min,
          max: bounds.max,
          size
        });
      }
    }
  });

  // Print nodes that have meshes
  console.log(`Total nodes with meshes: ${nodeBounds.length}`);
  nodeBounds.forEach((nb) => {
    // Check if the size is very large or if it matches the "lying-down" profile
    const sizeStr = nb.size.map(x=>x.toFixed(3)).join(', ');
    const minStr = nb.min.map(x=>x.toFixed(3)).join(', ');
    const maxStr = nb.max.map(x=>x.toFixed(3)).join(', ');
    console.log(`Node ${nb.nodeIdx} ("${nb.name}"): size=[${sizeStr}], min=[${minStr}], max=[${maxStr}]`);
  });
}

analyzeFile('splanchnology.glb');
