const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src/app');
const pages = ['about', 'careers', 'press', 'contact', 'partners'];

pages.forEach(p => {
  const file = path.join(pagesDir, p, 'page.tsx');
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove <Navbar />
  content = content.replace(/<Navbar \/>\s*/g, '');
  
  // Remove import { Navbar } ...
  content = content.replace(/import { Navbar } from "@\/components\/navbar";\n/g, '');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
