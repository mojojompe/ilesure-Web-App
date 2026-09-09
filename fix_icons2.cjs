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
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/import \{([^}]*?)\bFile\b([^}]*?)\} from '@hugeicons\/react'/g, 'import {$1File01Icon$2} from \'@hugeicons/react\'');
  content = content.replace(/<File /g, '<File01Icon ');
  content = content.replace(/<File\b/g, '<File01Icon');
  content = content.replace(/\bicon=\{File\}\b/g, 'icon={File01Icon}');
  content = content.replace(/\bIcon=\{File\}\b/g, 'Icon={File01Icon}');
  content = content.replace(/File02Icon/g, 'File01Icon');
  content = content.replace(/File01Icon01Icon/g, 'File01Icon');
  content = content.replace(/TelephoneIcon, TelephoneIcon/g, 'TelephoneIcon');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed File icon imports');
