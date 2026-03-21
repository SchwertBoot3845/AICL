export async function onRequest(context) {
    const url = new URL(context.request.url);
    const path = url.pathname;

    if (path.match(/\.(js|css|png|jpg|svg|ico|json|woff2?|ttf)$/)) {
        return context.env.ASSETS.fetch(context.request);
    }

    const response = await context.env.ASSETS.fetch(
        new Request(`${url.origin}/index.html`)
    );
    let html = await response.text();

    let title = "All Inclusive Challenge List";
    let description =
        "The All Inclusive Challenge List (AICL) for Geometry Dash; " +
        "a comprehensive ranking of all submitted challenges with no level cap.";
    let ogUrl = `https://aicl.pages.dev${path}`;

    const levelMatch = path.match(/^\/list\/(\d+)$/);

    if (levelMatch) {
        const levelId = levelMatch[1];
        const levelInfo = await getLevelById(levelId);
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
        description = "Browse every ranked challenge level on the AICL.";
    } else if (path === "/leaderboard") {
        title = "Leaderboard - AICL";
        description =
            "See the top players on the AICL ranked by total points " +
            "earned from completing challenge levels.";
    } else if (path === "/packs") {
        title = "Packs - AICL";
        description =
            "Complete themed level packs on the AICL to earn 6 or 7 bonus points.";
    } else if (path === "/roulette") {
        title = "Roulette - AICL";
        description =
            "Spin the AICL roulette and get assigned a random challenge level. " +
            "Yes we copied Demon Roulette, so what?";
    } else if (path === "/changelog") {
        title = "Changelog - AICL";
        description =
            "Level changelogs from the discord server added to the site. " +
            "ATTENTION: OUTDATED";
    }

    html = injectMeta(html, { title, description, ogUrl });

    return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
}

async function getLevelById(levelId) {
    try {
        const listRes = await fetch("https://aicl.pages.dev/main/data/_list.json");
        console.log("_list.json status:", listRes.status);
        if (!listRes.ok) return null;

        const listText = await listRes.text();
        console.log("_list.js first 100 chars:", listText.slice(0, 100));

        const arrMatch = listText.match(/\[[\s\S]*\]/);
        console.log("arrMatch found:", !!arrMatch);
        if (!arrMatch) return null;

        const files = arrMatch[0]
            .replace(/[\[\]]/g, "")
            .split(",")
            .map(s => s.trim().replace(/['"]/g, "").replace(/\s/g, ""))
            .filter(Boolean);

        console.log("files count:", files.length, "first file:", files[0]);

        for (let i = 0; i < files.length; i++) {
            try {
                const lvlRes = await fetch(`https://aicl.pages.dev/main/data/${files[i]}.json`);
                if (!lvlRes.ok) continue;
                const lvl = await lvlRes.json();
                console.log(`Checking ${files[i]}: id=${lvl.id} vs ${levelId}`);
                if (String(lvl.id) === String(levelId)) {
                    return {
                        rank: i + 1,
                        name: lvl.name,
                        verifier: lvl.verifier,
                        percentToQualify: lvl.percentToQualify ?? 100,
                    };
                }
            } catch (e) {
                console.log(`Error on file ${files[i]}:`, e.message);
                continue;
            }
        }
        console.log("Level not found after scanning all files");
        return null;
    } catch (e) {
        console.log("getLevelById crashed:", e.message);
        return null;
    }
}

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