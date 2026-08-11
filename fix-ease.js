const fs = require('fs');
['src/app/login/page.tsx', 'src/app/register/page.tsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/ease: \[0\.16, 1, 0\.3, 1\]/g, 'ease: "easeOut"');
  fs.writeFileSync(f, c, 'utf8');
});
console.log('done');
