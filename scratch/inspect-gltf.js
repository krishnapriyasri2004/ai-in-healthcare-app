const fs = require('fs');
const path = require('path');

const filePath = path.resolve('public/asset-01/scene.gltf');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Nodes count:', data.nodes ? data.nodes.length : 0);
console.log('Meshes count:', data.meshes ? data.meshes.length : 0);

if (data.nodes) {
  console.log('Nodes:');
  data.nodes.forEach((node, index) => {
    if (node.name) {
      console.log(`- Node ${index}: "${node.name}" (mesh: ${node.mesh !== undefined})`);
    }
  });
}

if (data.meshes) {
  console.log('\nMeshes:');
  data.meshes.forEach((mesh, index) => {
    console.log(`- Mesh ${index}: "${mesh.name}"`);
  });
}
