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

function checkTransforms(fileName) {
  const filePath = path.resolve('public/asset-01', fileName);
  console.log(`\n=== Transforms in ${fileName} ===`);
  const gltf = fileName.endsWith('.gltf') ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : parseGlb(filePath);
  const nodes = gltf.nodes || [];
  nodes.forEach((node, idx) => {
    if (node.translation || node.rotation || node.scale) {
      console.log(`Node ${idx} ("${node.name}"): trans=${JSON.stringify(node.translation)}, rot=${JSON.stringify(node.rotation)}, scale=${JSON.stringify(node.scale)}`);
    }
  });
}

checkTransforms('scene.gltf');
checkTransforms('splanchnology.glb');
checkTransforms('myology.glb');
