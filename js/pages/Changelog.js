import { store } from '../main.js';
import { fetchChangelog } from '../content.js';

export default {
    template: `
        <main class="page-changelog">
            <h1 class="changelog-title">Changelog</h1>

            <div v-if="loading" class="loading">Loading...</div>

            <ul v-else class="changelog-list">
                <li 
                    v-for="entry in paginated" 
                    :key="entry.id" 
                    class="changelog-entry"
                    :class="'type-' + entry.type"
                >
                    <span class="entry-date">{{ entry.date }}</span>
                    <span class="entry-text">{{ entry.actionText }}</span>
                </li>
            </ul>

            <div v-if="!loading" class="pagination">
                <button class="page-btn" @click="prevPage" :disabled="page === 1">Prev</button>
                
                <span class="page-info">Page {{ page }} / {{ totalPages }}</span>

                <button class="page-btn" @click="nextPage" :disabled="page >= totalPages">Next</button>
            </div>

            <div v-if="!loading" class="pagination" style="margin-top: 1rem;">
                <label class="page-info">Jump to:</label>
                <input 
                    v-model.number="jumpTarget" 
                    @keyup.enter="jumpPage" 
                    type="number" 
                    min="1" 
                    :max="totalPages"
                    class="page-input"
                >
                <button class="page-btn" @click="jumpPage">Go</button>
            </div>
        </main>
    `,

    data() {
        return {
            rawChanges: [],     // raw data from json
            changes: [],        // parsed and normalized
            loading: true,
            page: 1,
            perPage: 25,
            jumpTarget: null,
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
                this.rawChanges = data;

                // Sort newest first
                const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));

                // Parse entries into useful objects
                this.changes = sorted.map(e => this.parseEntry(e));

            } catch (err) {
                console.error('Failed to load changelog:', err);
            } finally {
                this.loading = false;
            }
        },

        parseEntry(entry) {
            const typeMap = {
                1: 'Placed',
                2: 'Raised',
                3: 'Lowered',
                4: 'Swapped',
                5: 'Removed'
            };

            const base = {
                id: entry.id,
                date: entry.date,
                type: entry.type,
                level: entry.level || null,
                level2: entry.secondary || null,
                p1: entry.p1 || null,
                p2: entry.p2 || null,
            };

            let text = typeMap[entry.type] || 'Unknown';

            switch (entry.type) {
                case 1: // placed
                    text += ` ${entry.level} (#${entry.p1})`;
                    break;

                case 2: // raised
                case 3: // lowered
                    text += ` ${entry.level} (from #${entry.p2} → #${entry.p1})`;
                    break;

                case 4: // swapped
                    text += ` ${entry.level} ↔ ${entry.secondary} (positions #${entry.p1} and #${entry.p2})`;
                    break;

                case 5: // removed
                    text += ` ${entry.level}`;
                    break;
            }

            return { ...base, actionText: text };
        },

        nextPage() {
            if (this.page < this.totalPages) this.page++;
        },
        prevPage() {
            if (this.page > 1) this.page--;
        },

        jumpPage() {
            if (!this.jumpTarget) return;
            const target = Math.max(1, Math.min(this.jumpTarget, this.totalPages));
            this.page = target;
        },
    },

    mounted() {
        this.loadChanges();
    },
};
