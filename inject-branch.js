// inject-branch.js
const fs = require('fs');

const branch = process.env.VERCEL_GIT_COMMIT_REF || 
               process.env.GITHUB_HEAD_REF || 
               'local-dev';

console.log(`🔀 Injecting branch: ${branch}`);

let html = fs.readFileSync('./index.html', 'utf8');

// This looks for your existing branch span and replaces it
html = html.replace(
  /<span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono">[^<]*<\/span>/,
  `<span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono">${branch}</span>`
);

fs.writeFileSync('./index.html', html);
console.log('✅ Branch injected successfully');