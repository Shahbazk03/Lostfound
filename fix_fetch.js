const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  if (file.includes('admin\\page.tsx') || file.includes('admin/page.tsx')) return; // Leave admin dashboard alone
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('/api/admin/settings')) {
    let newContent = content.replace(/\/api\/admin\/settings/g, '/api/settings');
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed fetch URL in', file);
  }
});
