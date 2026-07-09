const fs = require('fs');
const path = require('path');

function inspectGlb(glbPath) {
  const filePath = path.resolve(glbPath);
  if (!fs.existsSync(filePath)) {
    console.log(`${glbPath} does not exist`);
    return;
  }
  const fileBuffer = fs.readFileSync(filePath);
  // Simple glb parsing to find strings
  const content = fileBuffer.toString('utf8');
  console.log(`\n=== String inspection in ${glbPath} ===`);
  const regex = /"name"\s*:\s*"([^"]+)"/g;
  const names = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.add(match[1]);
  }
  console.log('Unique names count:', names.size);
  const nameArray = Array.from(names);
  console.log('Sample names:', nameArray.slice(0, 50));
  // Check for nerve-related keywords
  const nerveNames = nameArray.filter(n => n.toLowerCase().includes('nerve') || n.toLowerCase().includes('nervous') || n.toLowerCase().includes('brain') || n.toLowerCase().includes('spinal'));
  console.log('Nerve-related names:', nerveNames);
}

inspectGlb('public/asset-01/splanchnology.glb');
inspectGlb('public/asset-01/myology.glb');
inspectGlb('public/anatomy.glb');
