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
                    :key="entry.id ?? entry.date + '-' + index" 
                    class="changelog-entry"
                    :class="'type-' + (entry.type ?? 0)"
                >
                    <span class="entry-date">{{ entry.date }}</span>
                    <span class="entry-text">{{ entry.actionText }}</span>
                </li>
            </ul>

            <div v-if="!loading" class="pagination">
                <button class="page-btn" @click="prevPage" :disabled="page === 1">Prev</button>

                <span class="page-info">
                    Page 
                    <input 
                        class="page-input-inline"
                        v-model.number="pageInput"
                        @keyup.enter="applyPage"
                        type="number" 
                        :min="1" 
                        :max="maxInput"
                    >
                    / {{ totalPages }}
                </span>

                <button class="page-btn" @click="nextPage" :disabled="page >= totalPages">Next</button>
            </div>
        </main>
    `,

    data() {
        return {
            rawChanges: [],
            changes: [],
            loading: true,
            page: 1,
            pageInput: 1,
            perPage: 25,
            store,
        };
    },

    computed: {
        startIndex() { return (this.page - 1) * this.perPage; },
        endIndex() { return this.page * this.perPage; },
        paginated() { return this.changes.slice(this.startIndex, this.endIndex); },
        totalPages() { return Math.ceil(this.changes.length / this.perPage); },
        // used so input's max never becomes 0 (which can be annoying for browsers)
        maxInput() { return Math.max(this.totalPages, 1); },
    },

    methods: {
        async loadChanges() {
            try {
                const data = await fetchChangelog() || [];
                console.log('changelog fetched:', data); // dev: remove later
                this.rawChanges = Array.isArray(data) ? data : [];

                const sorted = this.rawChanges.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

                this.changes = sorted.map(e => this.parseEntry(e));

                // Ensure page is within bounds and sync the input
                if (this.totalPages === 0) {
                    this.page = 1;
                    this.pageInput = 1;
                } else {
                    // clamp page to [1, totalPages]
                    this.page = Math.min(Math.max(1, this.page), this.totalPages);
                    this.pageInput = this.page;
                }
            } catch (err) {
                console.error('Failed to load changelog:', err);
                this.rawChanges = [];
                this.changes = [];
                this.page = 1;
                this.pageInput = 1;
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
                5: 'Removed',
            };

            const safe = {
                id: entry?.id ?? null,
                date: entry?.date ?? '(no date)',
                type: entry?.type ?? 0,
                level: entry?.level ?? null,
                secondary: entry?.secondary ?? null,
                p1: entry?.p1 ?? null,
                p2: entry?.p2 ?? null,
            };

            let text = typeMap[safe.type] || 'Unknown';

            switch (safe.type) {
                case 1:
                    text += safe.level ? ` ${safe.level} at ${safe.p1 ?? '?'}.` : ' (malformed entry)';
                    break;
                case 2:
                case 3:
                    text += safe.level ? ` ${safe.level} from #${safe.p2 ?? '?'} to #${safe.p1 ?? '?'}.` : ' (malformed entry)';
                    break;
                case 4:
                    text += (safe.level && safe.secondary)
                        ? ` ${safe.level} with ${safe.secondary}, with ${safe.level} now above at #${safe.p1 ?? '?'}.`
                        : ' (malformed swap)';
                    break;
                case 5:
                    text += safe.level ? ` ${safe.level} from the list.` : ' (malformed entry)';
                    break;
                default:
                    text += ' (unknown type)';
            }

            return {
                ...safe,
                actionText: text,
            };
        },

        nextPage() {
            if (this.page < this.totalPages) {
                this.page++;
                this.pageInput = this.page;
            }
        },
        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.pageInput = this.page;
            }
        },

        applyPage() {
            let n = Number(this.pageInput) || 1;
            if (n < 1) n = 1;
            if (this.totalPages > 0 && n > this.totalPages) n = this.totalPages;
            this.page = n;
            this.pageInput = n;
        },
    },

    mounted() {
        this.loadChanges();
    },
};
