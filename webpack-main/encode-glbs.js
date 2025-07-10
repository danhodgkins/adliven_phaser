// encode-glbs.js
const fs = require('fs');
const path = require('path');

const inputDir = path.resolve(__dirname, 'models');
const outputDir = path.resolve(__dirname, 'compiled');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const glbFiles = fs.readdirSync(inputDir).filter(file => file.endsWith('.glb'));

glbFiles.forEach(file => {
  const filePath = path.join(inputDir, file);
  const base64 = fs.readFileSync(filePath).toString('base64');
  const dataUri = `data:model/gltf-binary;base64,${base64}`;

  const exportName = path.basename(file, '.glb').replace(/[^a-zA-Z0-9_$]/g, '_'); // valid JS var name
  const jsContent = `export const ${exportName} = '${dataUri}';\n`;

  const outputFilePath = path.join(outputDir, `${exportName}.js`);
  fs.writeFileSync(outputFilePath, jsContent);
  console.log(`✅ Compiled ${file} -> ${outputFilePath}`);
});
