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
  let binaryChunk = null;
  while (offset < length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.readUInt32LE(offset + 4);
    if (chunkType === 0x4E4F534A) { // JSON
      const jsonBuffer = data.slice(offset + 8, offset + 8 + chunkLength);
      jsonChunk = JSON.parse(jsonBuffer.toString('utf8'));
    } else if (chunkType === 0x004E4942) { // BIN
      binaryChunk = data.slice(offset + 8, offset + 8 + chunkLength);
    }
    offset += 8 + chunkLength;
  }
  return { json: jsonChunk, bin: binaryChunk };
}

const { json, bin } = parseGlb('public/asset-01/myology.glb');
const accessors = json.accessors || [];
const bufferViews = json.bufferViews || [];

// Let's find the first mesh and print some vertices
const mesh = json.meshes[0];
console.log('Mesh name:', mesh.name);
const prim = mesh.primitives[0];
const posAccessorIdx = prim.attributes.POSITION;
const acc = accessors[posAccessorIdx];
console.log('Accessor bounds:', acc.min, acc.max);

const bv = bufferViews[acc.bufferView];
const start = bv.byteOffset + (acc.byteOffset || 0);
const stride = bv.byteStride || 12; // float32 * 3

console.log('First 5 vertices of mesh 0:');
for (let i = 0; i < 5; i++) {
  const o = start + i * stride;
  const x = bin.readFloatLE(o);
  const y = bin.readFloatLE(o + 4);
  const z = bin.readFloatLE(o + 8);
  console.log(`v ${i}: [${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}]`);
}
