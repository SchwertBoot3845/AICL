import { fetchPacks as fetchRawPacks } from "../content.js";
import Spinner from "../components/Spinner.js";

export default {
    template: `
        <main class="page-packs">
            <Spinner v-if="loading" />

            <div
              v-else
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
    components: {
        Spinner,
    },
    data() {
        return {
            packs: [],
            loading: true,
        };
    },
    async mounted() {
        try {
            const rawPacks = await fetchRawPacks();

            const packsWithPoints = rawPacks.map((pack) => {
                // Ensure points is a number, default to 0 if invalid
                const pts = parseFloat(pack.points);
                return {
                    ...pack,
                    halfPoints: !isNaN(pts) ? pts : 0,
                };
            });

            this.packs = packsWithPoints;
        } catch (err) {
            console.error("Failed to load packs:", err);
            this.packs = [];
        } finally {
            this.loading = false;
        }
    },
}