import { fetchPacks as fetchRawPacks } from "../content.js";
import { score } from "../score.js";
import Spinner from "../components/Spinner.js";

export default {
    template: `
        <main class="page-packs">
            <div
              class="pack"
              v-for="pack in packs"
              :key="pack.id"
              :style="{ borderColor: pack.color, '--header-color': pack.color }"
            >
                <div class="pack-header">
                    <h2 class="pack-name">{{ pack.name }}</h2>
                    <h3 class="pack-points">{{ pack.halfPoints.toFixed(2) }} points</h3>
                </div>
                <p>Levels:</p>
                <ul class="pack-levels">
                    <li v-for="level in pack.levels" :key="level.fileName">{{ level.name }}</li>
                </ul>
            </div>
        </main>
    `,
    data() {
        return {
            packs: [],
            loading: true,
        };
    },
    async mounted() {
        const rawPacks = await fetchRawPacks();

        const packsWithLevels = await Promise.all(
            rawPacks.map(async (pack) => {
                const levels = await Promise.all(
                    pack.levels.map(async (levelFileName) => {
                        const res = await fetch(`/data/${levelFileName}.json`);
                        if (!res.ok) throw new Error(`Failed to fetch level ${levelFileName}`);
                        const levelData = await res.json();
                        return {
                            ...levelData,
                            fileName: levelFileName,
                        };
                    })
                );

                const totalPoints = levels.reduce((sum, level, i) => {
                    return sum + score(i + 1, 100, level.percentToQualify);
                }, 0);

                const halfPoints = totalPoints / 2;

                return {
                    ...pack,
                    levels,
                    halfPoints,
                };
            })
        );

        this.packs = packsWithLevels;
        this.loading = false;
    },
};
