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

const gltf = parseGlb('public/asset-01/myology.glb');
const nodes = gltf.nodes || [];

console.log('Nodes count:', nodes.length);
nodes.forEach((node, idx) => {
  if (node.children || node.translation || node.rotation || node.scale) {
    console.log(`Node ${idx}: "${node.name}", children=${JSON.stringify(node.children)}, trans=${JSON.stringify(node.translation)}, rot=${JSON.stringify(node.rotation)}, scale=${JSON.stringify(node.scale)}`);
  }
});
