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

function printHierarchy(gltf, name) {
  console.log(`\n================ HIERARCHY FOR ${name} ================`);
  const nodes = gltf.nodes || [];
  const scenes = gltf.scenes || [];
  const defaultScene = gltf.scene !== undefined ? scenes[gltf.scene] : null;
  const rootNodeIdxs = defaultScene ? defaultScene.nodes : [];
  
  function printNode(nodeIdx, indent = '') {
    const node = nodes[nodeIdx];
    if (!node) return;
    const meshInfo = node.mesh !== undefined ? ` (mesh: ${node.mesh})` : '';
    const rotationInfo = node.rotation ? ` (rot: [${node.rotation.map(x=>x.toFixed(2)).join(',')}])` : '';
    const translationInfo = node.translation ? ` (trans: [${node.translation.map(x=>x.toFixed(2)).join(',')}])` : '';
    const scaleInfo = node.scale ? ` (scale: [${node.scale.map(x=>x.toFixed(2)).join(',')}])` : '';
    console.log(`${indent}- Node ${nodeIdx}: "${node.name}"${meshInfo}${rotationInfo}${translationInfo}${scaleInfo}`);
    if (node.children) {
      node.children.forEach(childIdx => printNode(childIdx, indent + '  '));
    }
  }
  
  if (rootNodeIdxs) {
    rootNodeIdxs.forEach(idx => printNode(idx));
  } else {
    // If no scene, print all nodes without parents
    const childSet = new Set();
    nodes.forEach(n => {
      if (n.children) n.children.forEach(c => childSet.add(c));
    });
    nodes.forEach((n, idx) => {
      if (!childSet.has(idx)) printNode(idx);
    });
  }
}

const dir = 'public/asset-01';
printHierarchy(JSON.parse(fs.readFileSync(path.join(dir, 'scene.gltf'), 'utf8')), 'scene.gltf');
printHierarchy(parseGlb(path.join(dir, 'splanchnology.glb')), 'splanchnology.glb');
printHierarchy(parseGlb(path.join(dir, 'myology.glb')), 'myology.glb');
