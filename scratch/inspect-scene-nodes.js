const fs = require('fs');
const path = require('path');

const filePath = path.resolve('public/asset-01/scene.gltf');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Nodes count:', data.nodes ? data.nodes.length : 0);

if (data.nodes) {
  data.nodes.forEach((node, index) => {
    if (node.name && (node.name.toLowerCase().includes('nerve') || node.name.toLowerCase().includes('nervous') || node.name.toLowerCase().includes('brain') || node.name.toLowerCase().includes('spinal'))) {
      console.log(`Node ${index}: name="${node.name}", translation=${JSON.stringify(node.translation)}, rotation=${JSON.stringify(node.rotation)}, scale=${JSON.stringify(node.scale)}`);
    }
  });
}
