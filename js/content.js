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
    const packs = await fetchPacks();  // <-- fetch packs here
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
            beatenPacks: [],  // track beaten packs here
            packPoints: 0,
        };

        const { verified } = scoreMap[verifier];

        const verifierScore = verifier === "" ? 0 : score(rank + 1, 100, level.percentToQualify);

        verified.push({
            rank: rank + 1,
            level: level.name,
            score: verifierScore,
            link: level.verification,
        });

        level.records.forEach((record) => {
            if (!record || !record.user) return;

            const user = record.user.trim();
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
                beatenPacks: [],
                packPoints: 0,
            };
            const { completed, progressed } = scoreMap[user];

            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });

    // Now, check packs for beaten status per user
    Object.entries(scoreMap).forEach(([user, scores]) => {
        const completedLevels = new Set(scores.completed.map(c => c.level));
        
        packs.forEach(pack => {
            // Check if user completed all levels in pack
            const allCompleted = pack.levels.every(level =>
                completedLevels.has(level.name)
            );

            if (allCompleted) {
                scores.beatenPacks.push({
                    id: pack.id,
                    name: pack.name,
                    points: pack.halfPoints,
                });
                scores.packPoints += pack.halfPoints;
            }
        });
    });

    // Wrap in extra object containing the user and total score (include packPoints)
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed, packPoints } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0) + packPoints;

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
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

                const levelFilenames = Array.isArray(packData.levels)
                    ? packData.levels
                    : [];

                const levels = await Promise.all(
                    levelFilenames.map(async (filename) => {
                        if (typeof filename !== 'string') {
                            console.warn(`Invalid level filename (not a string):`, filename);
                            return null;
                        }

                        const levelPath = `/data/${filename}.json`;
                        const levelRes = await fetch(levelPath);
                        if (!levelRes.ok) {
                            throw new Error(`Failed to fetch: ${levelPath} (status ${levelRes.status})`);
                        }
                        const levelData = await levelRes.json();
                        return {
                            ...levelData,
                            fileName: filename,
                        };
                    })
                );

                const validLevels = levels.filter(Boolean);

                const totalPoints = validLevels.reduce((sum, level, i) => {
                    return sum + score(i + 1, 100, level.percentToQualify);
                }, 0);
                const halfPoints = totalPoints / 2;

                return {
                    id: packId,
                    ...packData,
                    levels: validLevels,
                    halfPoints,
                };
            })
        );

        return packs;
    } catch (err) {
        console.error('Failed to fetch packs:', err);
        return [];
    }
}
