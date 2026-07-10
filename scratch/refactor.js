const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('components').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('useTransition')) {
    // Remove useTransition from React imports
    content = content.replace(/import \{(.*?)\s*useTransition(.*?)\} from 'react';/, (match, p1, p2) => {
      const rest = (p1 + p2).split(',').map(s => s.trim()).filter(Boolean).join(', ');
      if (!rest) return "";
      return `import { ${rest} } from 'react';`;
    });
    
    // Replace useTransition calls
    content = content.replace(/const \[(.*?),\s*(.*?)\] = useTransition\(\);/g, 'const [$1, $2] = useOverlayTransition();');
    
    if (!content.includes('useOverlayTransition')) {
      console.log('Missed:', file);
    } else {
      if (!content.includes("import { useOverlayTransition }")) {
        const lines = content.split('\n');
        const importIdx = lines.findIndex(l => l.startsWith('import '));
        if (importIdx >= 0) {
          lines.splice(importIdx, 0, "import { useOverlayTransition } from '@/lib/context/OverlayContext';");
        } else {
          lines.unshift("import { useOverlayTransition } from '@/lib/context/OverlayContext';");
        }
        content = lines.join('\n');
      }
      fs.writeFileSync(file, content);
      console.log('Updated:', file);
    }
  }
});
