const fs = require('fs');
const path = require('path');

// Minimal GLB parser to extract node/mesh names
function inspectGlb(filePath) {
  const data = fs.readFileSync(filePath);
  const magic = data.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    console.error('Invalid GLB file');
    return;
  }
  const version = data.readUInt32LE(4);
  const length = data.readUInt32LE(8);
  
  console.log(`GLB Version: ${version}, Length: ${length} bytes`);
  
  // Read chunks
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
  
  if (!jsonChunk) {
    console.error('No JSON chunk found');
    return;
  }
  
  console.log('Nodes in GLB:');
  if (jsonChunk.nodes) {
    jsonChunk.nodes.forEach((node, index) => {
      if (node.name) {
        console.log(`- Node ${index}: "${node.name}" (mesh: ${node.mesh !== undefined})`);
      }
    });
  }
  
  console.log('\nMeshes in GLB:');
  if (jsonChunk.meshes) {
    jsonChunk.meshes.forEach((mesh, index) => {
      console.log(`- Mesh ${index}: "${mesh.name}"`);
    });
  }
}

inspectGlb(path.join(__dirname, '../public/anatomy.glb'));
