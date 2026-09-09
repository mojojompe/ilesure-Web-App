const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
const icons = new Set();
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Handle multi-line imports as well
  const match = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
  if (match) {
    match[1].split(',').forEach(i => {
      const icon = i.trim();
      if (icon) icons.add(icon);
    });
  }
});
console.log(Array.from(icons).join(', '));
