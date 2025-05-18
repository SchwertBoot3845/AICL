import { store } from "../main.js";
import Spinner from "../components/Spinner.js";

// TODO: Replace this with actual fetch logic when your packs JSON is ready
async function fetchPacks() {
    // Example mock data
    return [
        {
            name: "Top 10 Challenges",
            levels: ["Level A", "Level B", "Level C"],
            points: 150,
        },
        {
            name: "Speedrun Set",
            levels: ["Speed 1", "Speed 2"],
            points: 75,
        },
    ];
}

export default {
    name: "Packs",
    components: { Spinner },
    template: /*html*/ `
        <main v-if="loading">
            <Spinner />
        </main>
        <main v-else class="page-packs">
            <div
              class="pack"
              v-for="pack in packs"
              :key="pack.id"
              :style="{
                borderColor: pack.color,
                '--header-color': pack.color
              }"
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
            loading: true,
            packs: [],
            store,
        };
    },
    async mounted() {
        this.packs = await fetchPacks();
        this.loading = false;
    },
};
