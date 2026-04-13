// ============================================================
// ADMIN - PAINEL DE CONTROLE COMPLETO
// ============================================================

const API_URL = 'https://api-hub-one.vercel.app/api';
const STORAGE_KEY = 'hub_auth_token';

let platforms = [];
let editingId = null;
let deleteId = null;
let searchTerm = '';

// Verificar autenticação
function checkAuth() {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

if (!checkAuth()) throw new Error('Não autenticado');

// Função para fazer requisições autenticadas
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE_KEY);
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = 'index.html';
        }
        throw new Error(data.message || 'Erro na requisição');
    }
    return data;
}

// Mostrar notificação
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Carregar dados
async function loadData() {
    try {
        const response = await apiRequest('/platforms');
        if (response.success) {
            platforms = response.data;
            updateStats();
            renderTable();
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="9" style="text-align:center;">Erro ao carregar dados</td></tr>';
    }
}

// Atualizar estatísticas
async function updateStats() {
    try {
        const response = await apiRequest('/stats');
        if (response.success) {
            document.getElementById('totalCount').innerText = response.data.total || 0;
            document.getElementById('pagandoCount').innerText = response.data.pagando || 0;
            document.getElementById('lancamentoCount').innerText = response.data.lancamento || 0;
            document.getElementById('hotCount').innerText = response.data.hot || 0;
        }
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// CRUD Operations
async function addPlatform(platform) {
    const response = await apiRequest('/platforms', { method: 'POST', body: JSON.stringify(platform) });
    return response.data;
}

async function updatePlatform(id, platform) {
    const response = await apiRequest(`/platforms/${id}`, { method: 'PUT', body: JSON.stringify(platform) });
    return response.data;
}

async function deletePlatform(id) {
    await apiRequest(`/platforms/${id}`, { method: 'DELETE' });
}

// Função para determinar a classe da badge
function getBadgeClassForTable(badge, hot, type) {
    if (badge) {
        if (badge.includes('PAGANDO')) return 'badge-table-paying';
        if (badge.includes('LANÇAMENTO') || badge.includes('NOVO')) return 'badge-table-new';
        if (badge.includes('HOT') || badge.includes('🔥')) return 'badge-table-hot';
        return 'badge-table-custom';
    }
    if (hot) return 'badge-table-hot';
    if (type === 'pagando') return 'badge-table-paying';
    if (type === 'lancamento') return 'badge-table-new';
    return 'badge-table-custom';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Renderizar tabela
function renderTable() {
    const tbody = document.getElementById('tableBody');
    let filtered = [...platforms];
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || p.domain.toLowerCase().includes(term));
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Nenhuma plataforma encontrada</td></tr>';
        return;
    }
    
    let html = '';
    filtered.forEach(plat => {
        const typeText = { pagando: '💰 Pagando', lancamento: '🚀 Lançamento', destaque: '⭐ Destaque' }[plat.type];
        const badgeClass = getBadgeClassForTable(plat.badge, plat.hot, plat.type);
        const badgeDisplay = plat.badge ? `<span class="badge-display ${badgeClass}">${plat.badge}</span>` : '-';
        
        html += `
            <tr>
                <td>${plat._id.slice(-6)}</td>
                <td><div class="table-image"><i class="fas fa-trophy"></i></div></td>
                <td><strong>${escapeHtml(plat.name)}</strong></td>
                <td>${escapeHtml(plat.domain)}</td>
                <td>${typeText}</td>
                <td>${badgeDisplay}</td>
                <td>${plat.hot ? '🔥 Sim' : '❌ Não'}</td>
                <td><a href="${plat.link}" target="_blank" style="color:#FFB347;">Ver</a></td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="openEditModal('${plat._id}')"><i class="fas fa-edit"></i> Editar</button>
                    <button class="delete-btn" onclick="openDeleteModal('${plat._id}', '${escapeHtml(plat.name)}')"><i class="fas fa-trash"></i> Excluir</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Modal de Adicionar/Editar
const modal = document.getElementById('platformModal');
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('platformForm');
const predefinedBadge = document.getElementById('predefinedBadge');
const badgeInput = document.getElementById('badge');
const badgePreviewContainer = document.getElementById('badgePreviewContainer');
const badgePreview = document.getElementById('badgePreview');

function updateBadgePreview() {
    let badgeValue = badgeInput.value;
    if (!badgeValue && predefinedBadge.value) badgeValue = predefinedBadge.value;
    
    if (badgeValue) {
        let badgeClass = 'badge-custom';
        if (badgeValue.includes('PAGANDO')) badgeClass = 'badge-paying';
        else if (badgeValue.includes('LANÇAMENTO')) badgeClass = 'badge-new';
        else if (badgeValue.includes('HOT') || badgeValue.includes('🔥')) badgeClass = 'badge-hot';
        
        badgePreview.innerHTML = `<span class="badge-preview ${badgeClass}" style="display:inline-block; padding:6px 14px; border-radius:30px; font-size:0.8rem; font-weight:700;">${badgeValue}</span>`;
        badgePreviewContainer.style.display = 'block';
    } else {
        badgePreviewContainer.style.display = 'none';
    }
}

predefinedBadge?.addEventListener('change', function() {
    if (this.value) { badgeInput.value = this.value; updateBadgePreview(); }
});

badgeInput?.addEventListener('input', function() {
    if (this.value) { predefinedBadge.value = ''; updateBadgePreview(); }
    else { badgePreviewContainer.style.display = 'none'; }
});

async function openAddModal() {
    editingId = null;
    modalTitle.innerHTML = '<i class="fas fa-plus"></i> Nova Plataforma';
    form.reset();
    document.getElementById('hot').value = 'false';
    predefinedBadge.value = '';
    badgeInput.value = '';
    badgePreviewContainer.style.display = 'none';
    modal.classList.add('active');
}

async function openEditModal(id) {
    const platform = platforms.find(p => p._id === id);
    if (!platform) return;
    
    editingId = id;
    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Plataforma';
    document.getElementById('name').value = platform.name;
    document.getElementById('domain').value = platform.domain;
    document.getElementById('type').value = platform.type;
    document.getElementById('hot').value = platform.hot ? 'true' : 'false';
    document.getElementById('badge').value = platform.badge || '';
    document.getElementById('image').value = platform.image || '';
    document.getElementById('link').value = platform.link;
    
    if (platform.badge) {
        const optionExists = Array.from(predefinedBadge.options).some(opt => opt.value === platform.badge);
        predefinedBadge.value = optionExists ? platform.badge : '';
        updateBadgePreview();
    } else {
        predefinedBadge.value = '';
        badgePreviewContainer.style.display = 'none';
    }
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    editingId = null;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let badgeValue = document.getElementById('badge').value;
    if (!badgeValue && predefinedBadge.value) badgeValue = predefinedBadge.value;
    
    const platformData = {
        name: document.getElementById('name').value,
        domain: document.getElementById('domain').value,
        type: document.getElementById('type').value,
        hot: document.getElementById('hot').value === 'true',
        badge: badgeValue || null,
        image: document.getElementById('image').value || null,
        link: document.getElementById('link').value
    };
    
    try {
        if (editingId) {
            await updatePlatform(editingId, platformData);
            showToast('✅ Plataforma atualizada com sucesso!');
        } else {
            await addPlatform(platformData);
            showToast('✅ Plataforma adicionada com sucesso!');
        }
        closeModal();
        await loadData();
    } catch (error) {
        showToast('❌ Erro ao salvar: ' + error.message, 'error');
    }
});

// Modal de Exclusão
const deleteModal = document.getElementById('deleteModal');

function openDeleteModal(id, name) {
    deleteId = id;
    document.getElementById('deletePlatformName').innerText = name;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteId = null;
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (deleteId) {
        try {
            await deletePlatform(deleteId);
            showToast('🗑️ Plataforma excluída com sucesso!');
            closeDeleteModal();
            await loadData();
        } catch (error) {
            showToast('❌ Erro ao excluir: ' + error.message, 'error');
        }
    }
});

// Eventos
document.getElementById('addNewBtn')?.addEventListener('click', openAddModal);
document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
document.getElementById('closeDeleteModalBtn')?.addEventListener('click', closeDeleteModal);
document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
deleteModal?.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });
document.getElementById('adminSearch')?.addEventListener('input', (e) => { searchTerm = e.target.value; renderTable(); });
document.getElementById('logoutBtn')?.addEventListener('click', () => { localStorage.removeItem(STORAGE_KEY); window.location.href = 'index.html'; });

loadData();