// inject-branch.js
const fs = require('fs');

const branch = process.env.VERCEL_GIT_COMMIT_REF || 'local-dev';
console.log(`🔀 Injecting branch: ${branch}`);

let html = fs.readFileSync('./index.html', 'utf8');

// Multiple fallback patterns to find the branch span
const patterns = [
    /<span id="branch-badge"[^>]*>.*?<\/span>/i,
    /<span class="text-xs bg-slate-200[^>]*>.*?<\/span>/i,
    /loading\.\.\./i
];

let replaced = false;

for (let pattern of patterns) {
    const newHtml = html.replace(pattern, 
        `<span id="branch-badge" class="text-xs bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full font-mono">${branch}</span>`
    );
    
    if (newHtml !== html) {
        html = newHtml;
        replaced = true;
        break;
    }
}

// If nothing was replaced, just append it near the title
if (!replaced) {
    html = html.replace(
        /<title>Supplement Hub<\/title>/i,
        `<title>Supplement Hub</title>\n    <span id="branch-badge" class="text-xs bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full font-mono">${branch}</span>`
    );
}

fs.writeFileSync('./index.html', html);
console.log(`✅ Successfully injected branch: ${branch}`);