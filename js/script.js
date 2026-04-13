// ============================================================
// SCRIPT PRINCIPAL - HUB PREMIUM
// ============================================================

const API_URL = '/api';
let fullPlatforms = [];
let currentFilter = "all";

async function apiRequest(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { success: false, data: [] };
    }
}

function getImageColor(name) {
    const colors = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)',
        'linear-gradient(135deg, #fa709a, #fee140)'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
}

function getBadgeClass(badge, hot, type) {
    if (badge) {
        if (badge.includes('PAGANDO')) return 'badge-paying';
        if (badge.includes('LANÇAMENTO') || badge.includes('NOVO')) return 'badge-new';
        if (badge.includes('HOT') || badge.includes('🔥')) return 'badge-hot';
        return 'badge-paying';
    }
    if (hot) return 'badge-hot';
    if (type === 'pagando') return 'badge-paying';
    if (type === 'lancamento') return 'badge-new';
    return 'badge-paying';
}

async function loadData() {
    const grid = document.getElementById('platformsGrid');
    if (grid) {
        grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Carregando plataformas...</p></div>';
    }
    try {
        const url = `/platforms${currentFilter !== 'all' ? `?type=${currentFilter}` : ''}`;
        const response = await apiRequest(url);
        if (response.success && response.data) {
            fullPlatforms = response.data.sort((a, b) => {
                if (a.hot === b.hot) return 0;
                return a.hot ? -1 : 1;
            });
            renderPlatforms();
        } else {
            if (grid) grid.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar plataformas</p><button onclick="loadData()" class="retry-btn">Tentar novamente</button></div>';
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (grid) {
            grid.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar plataformas</p><button onclick="loadData()" class="retry-btn">Tentar novamente</button></div>';
        }
    }
}

function renderPlatforms() {
    const grid = document.getElementById('platformsGrid');
    if (!grid) return;
    if (fullPlatforms.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma plataforma encontrada</p></div>';
        return;
    }
    let html = '';
    fullPlatforms.forEach(plat => {
        const badgeClass = getBadgeClass(plat.badge, plat.hot, plat.type);
        const imageStyle = plat.image && plat.image.trim()
            ? `background-image: url('${plat.image}'); background-size: cover; background-position: center;`
            : `background: ${getImageColor(plat.name)};`;
        const displayBadge = plat.badge || (plat.hot ? "🔥 DESTAQUE" : (plat.type === 'pagando' ? "💰 PAGANDO" : "🚀 LANÇAMENTO"));
        const hotClass = plat.hot ? 'platform-card-hot' : '';
        html += `
            <div class="platform-card ${hotClass}" onclick="window.open('${plat.link}', '_blank')">
                <div class="card-badge ${badgeClass}">${displayBadge}</div>
                <div class="platform-image" style="${imageStyle}"><i class="fas fa-trophy"></i></div>
                <div class="platform-name">${plat.name}</div>
                <div class="btn-access">Acessar Plataforma</div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        loadData();
    });
});

async function loadRanking() {
    const container = document.getElementById('rankingContainer');
    if (!container) return;
    try {
        const response = await apiRequest('/ranking');
        if (response.success && response.data && response.data.length > 0) {
            let html = '';
            response.data.slice(0, 5).forEach((item, index) => {
                const positionClass = index === 0 ? 'top-1' : (index === 1 ? 'top-2' : (index === 2 ? 'top-3' : ''));
                const positionIcon = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `${index + 1}º`));
                html += `
                    <div class="ranking-item" onclick="window.open('${item.link}', '_blank')">
                        <div class="ranking-position ${positionClass}">${positionIcon}</div>
                        <div><strong>${item.name}</strong><br><small>${item.clicks || 0} acessos</small></div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

async function loadTestimonials() {
    const container = document.getElementById('testimonialsContainer');
    if (!container) return;
    try {
        const response = await apiRequest('/testimonials');
        if (response.success && response.data && response.data.length > 0) {
            let html = '';
            response.data.forEach(testimonial => {
                html += `
                    <div class="testimonial-card">
                        <div class="testimonial-header">
                            <div class="testimonial-avatar"><i class="fas fa-user-circle"></i></div>
                            <div><strong>${testimonial.name}</strong><div class="testimonial-stars">${'⭐'.repeat(testimonial.rating)}</div></div>
                        </div>
                        <p>${testimonial.text}</p>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar depoimentos:', error);
    }
}

async function loadActivity() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    try {
        const response = await apiRequest('/activity');
        if (response.success && response.data && response.data.length > 0) {
            let html = '';
            response.data.forEach(activity => {
                html += `
                    <div class="activity-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>${activity.message}</span>
                        <small>${activity.timeAgo || 'agora mesmo'}</small>
                    </div>
                `;
            });
            feed.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
    }
}

async function loadStats() {
    try {
        const response = await apiRequest('/stats');
        if (response.success) {
            const stats = response.data;
            document.getElementById('statPayments').innerHTML = `R$ ${(stats.estimatedPayments / 1000).toFixed(0)}K+`;
            document.getElementById('statUsers').innerHTML = `${(stats.stats_total_users / 1000).toFixed(0)}K+`;
            document.getElementById('statUpdates').innerHTML = `${stats.stats_daily_updates || 12}+ diárias`;
            document.getElementById('newTodayBadge').innerHTML = `+${stats.newToday || 0} novas hoje`;
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

let endTime = new Date().getTime() + (24 * 60 * 60 * 1000);
setInterval(() => {
    const now = new Date().getTime();
    const distance = endTime - now;
    if (distance > 0) {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('countdown').innerHTML = `${hours}h ${minutes}m`;
    } else {
        document.getElementById('countdown').innerHTML = "Oferta encerrada!";
    }
}, 1000);

document.getElementById('scrollToPlatforms')?.addEventListener('click', () => {
    document.getElementById('plataformas').scrollIntoView({ behavior: 'smooth' });
});

// ========== MODAL DE PESQUISA ==========
const searchModal = document.getElementById('searchModal');
const searchFab = document.getElementById('searchFab');
const modalSearchInput = document.getElementById('modalSearchInput');
const clearModalSearch = document.getElementById('clearModalSearch');
const closeModalBtn = document.getElementById('closeModal');

function openSearchModal() {
    if (searchModal) {
        searchModal.classList.add('active');
        setTimeout(() => {
            if (modalSearchInput) modalSearchInput.focus();
        }, 100);
    }
}

function closeSearchModal() {
    if (searchModal) {
        searchModal.classList.remove('active');
        if (modalSearchInput) {
            modalSearchInput.value = '';
            renderSearchResults('');
            if (clearModalSearch) clearModalSearch.style.display = 'none';
        }
    }
}

if (searchFab) searchFab.addEventListener('click', openSearchModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeSearchModal);
if (searchModal) {
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) closeSearchModal();
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchModal && searchModal.classList.contains('active')) {
        closeSearchModal();
    }
});

async function renderSearchResults(searchTerm) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    if (!searchTerm || searchTerm.trim() === '') {
        container.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><p>Digite para buscar</p></div>';
        return;
    }
    try {
        const response = await apiRequest(`/platforms?search=${encodeURIComponent(searchTerm)}`);
        let results = response.data;
        if (!results || results.length === 0) {
            container.innerHTML = `<div class="no-results"><i class="fas fa-frown"></i><p>Nenhum resultado para "${searchTerm}"</p></div>`;
            return;
        }
        let html = `<div class="search-result-count"><span>${results.length}</span> resultados</div>`;
        results.forEach(plat => {
            const imageStyle = plat.image && plat.image.trim()
                ? `background-image: url('${plat.image}'); background-size: cover;`
                : `background: ${getImageColor(plat.name)};`;
            html += `
                <div class="search-result-item" onclick="window.open('${plat.link}', '_blank')">
                    <div class="search-result-image" style="${imageStyle}"><i class="fas fa-trophy"></i></div>
                    <div><strong>${plat.name}</strong><br><small>${plat.domain}</small></div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-triangle"></i><p>Erro ao buscar</p></div>';
    }
}

if (modalSearchInput) {
    modalSearchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        renderSearchResults(value);
        if (clearModalSearch) {
            clearModalSearch.style.display = value ? 'flex' : 'none';
        }
    });
}

if (clearModalSearch) {
    clearModalSearch.addEventListener('click', () => {
        if (modalSearchInput) {
            modalSearchInput.value = '';
            renderSearchResults('');
            clearModalSearch.style.display = 'none';
            modalSearchInput.focus();
        }
    });
}

// Inicialização
loadData();
loadRanking();
loadTestimonials();
loadActivity();
loadStats();

setInterval(() => {
    loadData();
    loadRanking();
    loadActivity();
    loadStats();
}, 30000);