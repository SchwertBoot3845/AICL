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
            <h1 class="type-title-xl">Challenge Packs</h1>
            <div class="pack" v-for="pack in packs" :key="pack.name">
                <h2 class="type-title-md">{{ pack.name }}</h2>
                <p><strong>Points:</strong> {{ pack.points }}</p>
                <ul class="pack-levels">
                    <li v-for="level in pack.levels" :key="level">• {{ level }}</li>
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
