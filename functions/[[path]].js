export async function onRequest(context) {
    const url = new URL(context.request.url);
    const path = url.pathname;

    // Serve non-HTML assets normally (images, js, css, etc.)
    if (path.match(/\.(js|css|png|jpg|svg|ico|json|woff2?|ttf)$/)) {
        return context.env.ASSETS.fetch(context.request);
    }

    // Fetch base index.html
    const response = await context.env.ASSETS.fetch(
        new Request(`${url.origin}/index.html`)
    );
    let html = await response.text();

    // --- Default meta values ---
    let title = "All Inclusive Challenge List";
    let description =
        "The All Inclusive Challenge List (AICL) for Geometry Dash; " +
        "a comprehensive ranking of all submitted challenges with no level cap.";
    let ogUrl = `https://aicl.pages.dev${path}`;

    // --- Route matching ---
    const levelMatch = path.match(/^\/list\/(\d+)$/);

    if (levelMatch) {
        // /list/{id} — fetch level data and build specific embed
        const levelId = levelMatch[1];
        const levelInfo = await getLevelById(levelId, url.origin);
        if (levelInfo) {
            title = `#${levelInfo.rank} ${levelInfo.name} - AICL`;
            description =
                `Rank #${levelInfo.rank} on the AICL. ` +
                `Verified by ${levelInfo.verifier}. ` +
                `Requires ${levelInfo.percentToQualify}% to qualify.`;
        } else {
            title = "Level not found - AICL";
            description = "This level could not be found on the AICL.";
        }

    } else if (path === "/list" || path === "/") {
        title = "List - AICL";
        description =
            "Browse every ranked challenge level on the AICL. ";

    } else if (path === "/leaderboard") {
        title = "Leaderboard - AICL";
        description =
            "See the top players on the AICL ranked by total points " +
            "earned from completing challenge levels.";

    } else if (path === "/packs") {
        title = "Packs - AICL";
        description =
            "Complete themed level packs on the AICL to earn 6 or 7 bonus points. ";

    } else if (path === "/roulette") {
        title = "Roulette - AICL";
        description =
            "Spin the AICL roulette and get assigned a random challenge level. " +
            "Yes we copied Demon Roulette, so what?";
    } else if (path === "/changelog") {
        title = "Changelog - AICL";
        description =
            "Level Changelogs from the discord server added to the site. " +
            "ATTENTION: OUTDATED";
    }

    // --- Inject meta tags ---
    html = injectMeta(html, { title, description, ogUrl });

    return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
}


// Fetches _list.js, then scans level JSONs until it finds the matching ID
async function getLevelById(levelId, origin) {
    try {
        const listRes = await fetch(`${origin}/main/data/_list.js`);
        if (!listRes.ok) return null;

        const listText = await listRes.text();

        // Parse the exported array of filenames from _list.js
        // Handles: export default [...] or module.exports = [...] or just [...]
        const arrMatch = listText.match(/\[[\s\S]*\]/);
        if (!arrMatch) return null;

        const files = arrMatch[0]
            .replace(/[\[\]]/g, "")
            .split(",")
            .map(s => s.trim().replace(/['"]/g, "").replace(/\s/g, ""))
            .filter(Boolean);

        for (let i = 0; i < files.length; i++) {
            try {
                const lvlRes = await fetch(`${origin}/main/data/${files[i]}.json`);
                if (!lvlRes.ok) continue;
                const lvl = await lvlRes.json();
                if (String(lvl.id) === String(levelId)) {
                    return {
                        rank: i + 1,
                        name: lvl.name,
                        verifier: lvl.verifier,
                        percentToQualify: lvl.percentToQualify ?? 100,
                    };
                }
            } catch {
                continue;
            }
        }
        return null;
    } catch {
        return null;
    }
}


// Replaces all relevant meta tags in the HTML string
function injectMeta(html, { title, description, ogUrl }) {
    return html
        .replace(
            /<title>[\s\S]*<\/title>/,
            `<title>${title}</title>`
        )
        .replace(
            /(<meta\s[^>]*property="og:title"[^>]*content=")[^"]*(")/,
            `$1${title}$2`
        )
        .replace(
            /(<meta\s[^>]*content=")[^"]*("\s[^>]*property="og:title"[^>]*)/,
            `$1${title}$2`
        )
        .replace(
            /(<meta\s[^>]*property="og:description"[^>]*content=")[^"]*(")/,
            `$1${description}$2`
        )
        .replace(
            /(<meta\s[^>]*content=")[^"]*("\s[^>]*property="og:description"[^>]*)/,
            `$1${description}$2`
        )
        .replace(
            /(<meta\s[^>]*property="og:url"[^>]*content=")[^"]*(")/,
            `$1${ogUrl}$2`
        )
        .replace(
            /(<meta\s[^>]*name="description"[^>]*content=")[^"]*(")/,
            `$1${description}$2`
        );
}
