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

const gltf = parseGlb('public/asset-01/splanchnology.glb');
const nodes = gltf.nodes || [];

nodes.forEach((node, idx) => {
  console.log(`Node ${idx}: "${node.name}", mesh=${node.mesh}, children=${JSON.stringify(node.children)}`);
});
