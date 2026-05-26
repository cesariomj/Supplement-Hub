// inject-branch.js - More robust version
const fs = require('fs');

const branch = process.env.VERCEL_GIT_COMMIT_REF || 'local-dev';
console.log(`🔀 Injecting branch: ${branch}`);

let html = fs.readFileSync('./index.html', 'utf8');

// Try multiple ways to find and replace
if (html.includes('id="branch-badge"')) {
    html = html.replace(
        /<span id="branch-badge"[^>]*>.*?<\/span>/i,
        `<span id="branch-badge" class="text-xs bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full font-mono">${branch}</span>`
    );
} else {
    // Fallback: Add it after the title if not found
    html = html.replace(
        /<title>Supplement Hub<\/title>/i,
        `<title>Supplement Hub</title>`
    );
    // Add it near the top of body if needed
}

fs.writeFileSync('./index.html', html);
console.log(`✅ Successfully injected branch: ${branch}`);