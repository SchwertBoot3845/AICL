import { fetchPacks } from "../content.js";
import { store } from "../main.js";
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
                    <h2>{{ pack.name }}</h2>
                </div>
                <p>Levels:</p>
                <ul class="pack-levels">
                    <li v-for="level in pack.levels" :key="level">{{ level }}</li>
                </ul>
            </div>
        </main>
    `,
    data() {
        return {
            packs: [],
        };
    },
    async mounted() {
        this.packs = await fetchPacks();
        this.loading = false;
    },
};
