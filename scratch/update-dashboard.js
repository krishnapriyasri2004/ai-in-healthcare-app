const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n
content = content.replace(/\r\n/g, '\n');

const targetStart = '  return (\n    <div className="w-full h-full p-6 bg-[#020617]';
const startIndex = content.indexOf(targetStart);

if (startIndex === -1) {
  console.error("Could not find the start of the return statement!");
  process.exit(1);
}

const beforeReturn = content.substring(0, startIndex);
let newReturn = fs.readFileSync(path.join(__dirname, 'new-ui.txt'), 'utf8');
newReturn = newReturn.replace(/\r\n/g, '\n');

const updatedContent = beforeReturn + newReturn + '\n}';
// Write back with normalized endings or write back directly
fs.writeFileSync(filePath, updatedContent.replace(/\n/g, '\r\n'), 'utf8');
console.log("Successfully updated dashboard.tsx with the new clean UI return statement!");
