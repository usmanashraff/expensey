const fs = require('fs');
let c = fs.readFileSync('src/components/dashboard-sidebar.tsx', 'utf8');

// Replace backgrounds and borders
c = c.replace(/bg-\[#f6fafe\] dark:bg-\[#2c3134\]/g, 'bg-surface');
c = c.replace(/border-\[#c4c7c8\] dark:border-\[#747879\]/g, 'border-outline-variant');

// Text colors
c = c.replace(/text-\[#171c1f\] dark:text-\[#edf1f5\]/g, 'text-on-surface');
c = c.replace(/text-\[#444749\] dark:text-\[#c5c7c8\]/g, 'text-on-surface-variant');
c = c.replace(/text-\[#5c5f60\] dark:text-\[#c5c7c8\]/g, 'text-on-surface-variant');
c = c.replace(/text-\[#5b5f63\] dark:text-\[#c3c7cc\]/g, 'text-on-surface-variant');
c = c.replace(/text-\[#181c20\] dark:text-\[#f6fafe\]/g, 'text-on-surface');

// Hovers and actives
c = c.replace(/hover:text-\[#171c1f\] dark:hover:text-\[#edf1f5\]/g, 'hover:text-on-surface');
c = c.replace(/hover:bg-\[#eaeef2\] dark:hover:bg-\[#dfe3e7\]\/10/g, 'hover:bg-surface-container-low');
c = c.replace(/bg-\[#dde0e5\]\/10 dark:bg-\[#2c3134\]\/50/g, 'bg-surface-container');
c = c.replace(/border-\[#181c20\] dark:border-\[#e0e3e8\]/g, 'border-tertiary');
c = c.replace(/bg-\[#f6fafe\]\/50 dark:bg-\[#2c3134\]\/50/g, 'bg-surface/50');
c = c.replace(/text-\[#5b5f63\]/g, 'text-on-surface-variant');

fs.writeFileSync('src/components/dashboard-sidebar.tsx', c, 'utf8');
console.log('done');
