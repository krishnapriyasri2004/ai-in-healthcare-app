const fs = require('fs');
const path = require('path');

const filePath = path.resolve('public/asset-01/scene.gltf');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Nodes 0 to 60:');
if (data.nodes) {
  data.nodes.slice(0, 60).forEach((node, index) => {
    console.log(`Node ${index}: name="${node.name}", mesh=${node.mesh}, translation=${JSON.stringify(node.translation)}, rotation=${JSON.stringify(node.rotation)}, scale=${JSON.stringify(node.scale)}, children=${JSON.stringify(node.children)}`);
  });
}
