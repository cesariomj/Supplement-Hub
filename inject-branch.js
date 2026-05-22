// inject-branch.js
const fs = require('fs');

const branch = process.env.VERCEL_GIT_COMMIT_REF || 'local-dev';
console.log(`🔀 Injecting branch: ${branch}`);

let html = fs.readFileSync('./index.html', 'utf8');

// More aggressive replacement
html = html.replace(
    /<span id="branch-badge"[^>]*>.*?<\/span>/i,
    `<span id="branch-badge" class="text-xs bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full font-mono">${branch}</span>`
);

fs.writeFileSync('./index.html', html);
console.log(`✅ Branch injected: ${branch}`);