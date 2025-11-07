import { fetchPacks } from "../content.js";
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
              ({{ pack.points?.toFixed(2) ?? '0.00' }} points)
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
      this.packs = await fetchPacks();
    } catch (err) {
      console.error("💀 Error loading packs:", err);
      this.packs = [];
    } finally {
      this.loading = false;
    }
  },
}