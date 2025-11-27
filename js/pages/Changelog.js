import { store } from '../main.js';
import { fetchChangelog } from '../content.js';

export default {
    template: `
        <main class="page-changelog">
            <h1>Changelog</h1>
            <div v-if="loading" class="loading">Loading...</div>
            <ul v-else class="changelog-list">
                <li v-for="entry in paginated" :key="entry.id" class="changelog-entry">
                    <strong>{{ entry.date }}</strong>: {{ formatEntry(entry) }}
                </li>
            </ul>
            <div v-if="!loading" class="pagination">
                <button @click="prevPage" :disabled="page === 1">Prev</button>
                <span>Page {{ page }} / {{ totalPages }}</span>
                <button @click="nextPage" :disabled="page >= totalPages">Next</button>
            </div>
        </main>
    `,
    data() {
        return {
            changes: [],
            loading: true,
            page: 1,
            perPage: 25,
            store,
        };
    },
    computed: {
        startIndex() { return (this.page - 1) * this.perPage; },
        endIndex() { return this.page * this.perPage; },
        paginated() { return this.changes.slice(this.startIndex, this.endIndex); },
        totalPages() { return Math.ceil(this.changes.length / this.perPage); },
    },
    methods: {
        async loadChanges() {
            try {
                const data = await fetchChangelog();
                // Sort newest first
                this.changes = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            } catch (err) {
                console.error('Failed to load changelog:', err);
            } finally {
                this.loading = false;
            }
        },
        formatEntry(entry) {
            const typeMap = { 1: 'Placed', 2: 'Raised', 3: 'Lowered', 4: 'Swapped', 5: 'Removed' };
            let text = typeMap[entry.type] || 'Unknown';
            text += ` ${entry.level}`;
            if (entry.secondary) text += ` / ${entry.secondary}`;
            if (entry.type === 2 || entry.type === 3) text += ` (from #${entry.p2} → #${entry.p1})`;
            if (entry.type === 4) text += ` (swapped #${entry.p1} ↔ #${entry.p2})`;
            return text;
        },
        nextPage() { if(this.page < this.totalPages) this.page++; },
        prevPage() { if(this.page > 1) this.page--; },
    },
    mounted() {
        this.loadChanges();
    },
};
