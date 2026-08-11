const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const c = fs.readFileSync(file, 'utf8');
      if (/ease:\s*(?:"easeOut"|'easeOut')(?!\s*as\s*const)/.test(c)) {
        fs.writeFileSync(file, c.replace(/ease:\s*(?:"easeOut"|'easeOut')/g, 'ease: "easeOut" as const'), 'utf8');
        results.push(file);
      }
    }
  });
  return results;
}

console.log(walk('src'));
