const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Backgrounds
            content = content.replace(/bg-\[#ffffff\] dark:bg-\[#1c2024\]/g, 'bg-surface-container-lowest');
            content = content.replace(/bg-\[#f6fafe\] dark:bg-\[#14171a\]/g, 'bg-surface-container-lowest'); // or surface
            content = content.replace(/bg-\[#f0f4f8\] dark:bg-\[#1c2024\]/g, 'bg-surface-container-low');
            content = content.replace(/bg-\[#eaeef2\] dark:bg-\[#24282c\]/g, 'bg-surface-container');
            
            // Text
            content = content.replace(/text-\[#171c1f\] dark:text-\[#f6fafe\]/g, 'text-on-surface');
            content = content.replace(/text-\[#5b5f63\] dark:text-\[#c5c7c8\]/g, 'text-on-surface-variant');
            content = content.replace(/text-\[#747879\] dark:text-\[#a0a4a6\]/g, 'text-on-surface-variant');
            content = content.replace(/text-\[#496177\] dark:text-\[#f6fafe\]/g, 'text-tertiary dark:text-on-surface');
            content = content.replace(/text-\[#496177\] dark:text-\[#b0c9e3\]/g, 'text-tertiary');
            
            // Borders
            content = content.replace(/border-\[#c4c7c8\] dark:border-\[#353a40\]/g, 'border-outline-variant');
            content = content.replace(/border-\[#c4c7c8\]\/50 dark:border-\[#353a40\]/g, 'border-outline-variant/50');
            content = content.replace(/border-\[#c4c7c8\]\/30 dark:border-\[#353a40\]/g, 'border-outline-variant/30');

            // Hovers
            content = content.replace(/hover:bg-\[#eaeef2\] dark:hover:bg-\[#24282c\]/g, 'hover:bg-surface-container');
            content = content.replace(/hover:text-\[#171c1f\] dark:hover:text-\[#f6fafe\]/g, 'hover:text-on-surface');
            content = content.replace(/hover:text-\[#5b5f63\] dark:hover:text-\[#c5c7c8\]/g, 'hover:text-on-surface-variant');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'components'));
processDir(path.join(__dirname, 'src', 'app'));
console.log("Done");
