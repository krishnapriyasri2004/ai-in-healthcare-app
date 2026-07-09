const fs = require('fs');
const path = require('path');

const filePath = path.resolve('public/asset-01/scene.gltf');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const accessors = data.accessors || [];
const meshes = data.meshes || [];
const nodes = data.nodes || [];

console.log('Total accessors:', accessors.length);
console.log('Total meshes:', meshes.length);
console.log('Total nodes:', nodes.length);

// Helper to get bounding box for a mesh index
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

// Print bounds of all nodes/meshes
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

// Sort by size or print all
console.log('\nNodes with meshes and their sizes:');
nodeBounds.forEach((nb) => {
  // Let's print if it's horizontal (e.g. depth or width is much larger than height, or size is very large)
  console.log(`Node ${nb.nodeIdx} ("${nb.name}"): size=[${nb.size.map(x=>x.toFixed(3)).join(', ')}], bounds_min=[${nb.min.map(x=>x.toFixed(3)).join(', ')}], bounds_max=[${nb.max.map(x=>x.toFixed(3)).join(', ')}]`);
});
