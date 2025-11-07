import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }
        if (!level || typeof level.verifier !== 'string') return;

        const verifier = level.verifier.trim() || "";
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };

        const { verified } = scoreMap[verifier];

        const verifierScore = verifier === "" ? 0 : score(rank + 1, 100, level.percentToQualify);

        verified.push({
            rank: rank + 1,
            level: level.name,
            score: verifierScore,
            link: level.verification,
            fileName: level.path,
        });

        level.records.forEach((record) => {
            if (!record || !record.user) return;

            const user = record.user.trim();
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            const { completed, progressed } = scoreMap[user];

            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                    fileName: level.path,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
                fileName: level.path,
            });
        });
    });

    const packs = await fetchPacks();

    Object.entries(scoreMap).forEach(([user, scores]) => {
        const { verified, completed } = scores;

        const beatenLevels = new Set([
            ...verified.map(v => v.fileName),
            ...completed.map(c => c.fileName),
        ]);

        const beatenPacks = packs.filter(pack =>
            pack.levels.every(level => beatenLevels.has(level.fileName))
        ).map(pack => ({
            id: pack.id,
            name: pack.name,
            points: pack.points,
        }));

        scores.beatenPacks = beatenPacks;
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed, beatenPacks } = scores;

        const total = [
            ...verified,
            ...completed,
            ...progressed,
            ...(beatenPacks ? beatenPacks.map(p => ({ score: p.points })) : []),
        ].reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}

export async function fetchPacks() {
    try {
        const res = await fetch('/data/packs/_packs.json');
        if (!res.ok) {
            throw new Error(`Failed to fetch: /data/packs/_packs.json (status ${res.status})`);
        }
        const packList = await res.json();

        const packs = await Promise.all(
            packList.map(async (packId) => {
                const packPath = `/data/packs/${packId}.json`;
                const packRes = await fetch(packPath);
                if (!packRes.ok) {
                    throw new Error(`Failed to fetch: ${packPath} (status ${packRes.status})`);
                }
                const packData = await packRes.json();

                const levels = await Promise.all(
                    (packData.levels || []).map(async (filename) => {
                        const levelPath = `/data/${filename}.json`;
                        const levelRes = await fetch(levelPath);
                        if (!levelRes.ok) {
                            console.warn(`Failed to fetch level: ${levelPath}`);
                            return null;
                        }
                        const levelData = await levelRes.json();
                        return {
                            ...levelData,
                            fileName: filename,
                        };
                    })
                );

                return {
                    id: packId,
                    ...packData,
                    levels: levels.filter(Boolean),
                    points: packData.points,
                };
            })
        );

        return packs;
    } catch (err) {
        console.error('Failed to fetch packs:', err);
        return [];
    }
}