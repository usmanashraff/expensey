const fs = require('fs');

const files = [
  'src/app/about/page.tsx',
  'src/components/dashboard-sidebar.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/ease:\s*\[[\d\.\s,]+\]/g, 'ease: "easeOut"');
  fs.writeFileSync(f, c, 'utf8');
});

console.log('done');
