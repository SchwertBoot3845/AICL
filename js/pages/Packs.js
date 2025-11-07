import { fetchPacks as fetchRawPacks } from "../content.js";
import { score } from "../score.js";
import Spinner from "../components/Spinner.js";

export default {
  components: { Spinner },
  template: `
    <main class="page-packs">
      <Spinner v-if="loading" text="Loading packs..." />
      <div v-else>
        <div
          v-for="pack in packs"
          :key="pack.id"
          class="pack"
          :style="{ borderColor: pack.color || '#888', '--header-color': pack.color || '#888' }"
        >
          <div class="pack-header">
            <h2 class="pack-name">{{ pack.name }}</h2>
            <h3 class="pack-points">
              ({{ pack.halfPoints?.toFixed(2) ?? '0.00' }} points)
            </h3>
          </div>

          <p v-if="pack.levels?.length">Levels:</p>
          <ul v-if="pack.levels?.length" class="pack-levels">
            <li v-for="level in pack.levels" :key="level.fileName">
              {{ level.name }}
            </li>
          </ul>

          <p v-else class="empty-pack">No levels found in this pack.</p>
        </div>
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
    try {
      const packsRes = await fetch("/data/packs/_packs.json");
      const rawPacks = await packsRes.json();

      const listRes = await fetch("/data/_list.json");
      const levelOrder = await listRes.json();

      const packsWithPoints = rawPacks.map((pack) => {
        // If "points" already exists in pack file, use that
        if (typeof pack.points === "number") {
          return {
            ...pack,
            halfPoints: pack.points / 2,
          };
        }

        let totalPoints = 0;

        (pack.levels || []).forEach((level) => {
          const rank = levelOrder.indexOf(level.fileName);
          if (rank === -1) {
            console.warn(`⚠️ Level '${level.fileName}' not found in /data/_list.json`);
            return;
          }

          totalPoints += score(rank + 1, 100, level.percentToQualify || 100);
        });

        return {
          ...pack,
          halfPoints: totalPoints / 3,
        };
      });

      this.packs = packsWithPoints;
    } catch (err) {
      console.error("💀 Error while loading packs:", err);
      this.packs = [];
    } finally {
      this.loading = false;
    }
  },
}