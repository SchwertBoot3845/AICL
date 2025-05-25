import { fetchPacks as fetchRawPacks } from "../content.js";
import { score } from "../score.js";
import levelOrder from "../data/_list.js"; // Global level order
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

        const packsWithPoints = rawPacks.map((pack) => {
            const totalPoints = pack.levels.reduce((sum, level) => {
                const globalRank = levelOrder.indexOf(level.fileName) + 1;
                return sum + score(globalRank, 100, level.percentToQualify);
            }, 0);

            return {
                ...pack,
                halfPoints: totalPoints / 2,
            };
        });

        this.packs = packsWithPoints;
        this.loading = false;
    },
};
