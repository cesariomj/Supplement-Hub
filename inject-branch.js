// inject-branch.js - Final Reliable Version
const fs = require('fs');
const { execSync } = require('child_process');

let branch = 'local-dev';

try {
    // Vercel environment variable
    if (process.env.VERCEL_GIT_COMMIT_REF) {
        branch = process.env.VERCEL_GIT_COMMIT_REF;
    } 
    // Local Git branch detection
    else {
        branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    }
} catch (err) {
    console.log('⚠️ Could not detect Git branch, using local-dev');
}

console.log(`🔀 Injecting branch: ${branch}`);

let html = fs.readFileSync('./index.html', 'utf8');

// Strong replacement
html = html.replace(
    /<span id="branch-badge"[^>]*>[\s\S]*?<\/span>/i,
    `<span id="branch-badge" class="text-xs bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full font-mono">${branch}</span>`
);

fs.writeFileSync('./index.html', html);
console.log(`✅ Successfully injected: ${branch}`);