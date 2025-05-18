import List from './pages/List.js';
import Packs from './pages/Packs.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';

export default [
    { path: '/', component: List },
    { path: '/packs', component: Packs },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/roulette', component: Roulette },
];
