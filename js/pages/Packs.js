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
                    <h3 class="pack-points">({{ pack.halfPoints.toFixed(2) }} points)</h3>
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

        // Load level ranking from _list.json (top to bottom order)
        const listRes = await fetch('/data/_list.json');
        const levelOrder = await listRes.json();

        const packsWithPoints = rawPacks.map((pack) => {
            let totalPoints = 0;

            pack.levels.forEach((level) => {
                const rank = levelOrder.indexOf(level.fileName);
                if (rank === -1) {
                    console.warn(`Level '${level.fileName}' not found in _list.json.`);
                    return;
                }

                totalPoints += score(rank + 1, 100, level.percentToQualify);
            });

            return {
                ...pack,
                halfPoints: totalPoints / 3,
            };
        });

        this.packs = packsWithPoints;
        this.loading = false;
    }
};
