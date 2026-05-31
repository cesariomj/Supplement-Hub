// inject-branch.js - Stronger Version for Netlify
const fs = require('fs');
const { execSync } = require('child_process');

let branch = 'local-dev';

try {
    if (process.env.VERCEL_GIT_COMMIT_REF) {
        branch = process.env.VERCEL_GIT_COMMIT_REF;
    } else if (process.env.NETLIFY) {
        branch = process.env.HEAD || 'netlify-deploy';
    } else {
        branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    }
} catch (err) {
    console.log('⚠️ Could not detect branch, using fallback');
}

console.log(`🔀 Injecting branch: ${branch}`);

let html = fs.readFileSync('./index.html', 'utf8');

// More aggressive replacement
html = html.replace(
    /<span id="branch-badge"[^>]*>[\s\S]*?<\/span>/gi,
    `<span id="branch-badge" class="text-xs bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full font-mono">${branch}</span>`
);

fs.writeFileSync('./index.html', html);
console.log(`✅ Branch injected: ${branch}`);