// ============================================================
// FUNIL DE CAPTURA E MARKETING
// ============================================================

const API_URL = '/api';
const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/SEU_LINK_AQUI";

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return { success: false };
    }
}

function setupNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const whatsapp = document.getElementById('whatsappNumber').value;
        if (!whatsapp || whatsapp.length < 10) {
            alert('Por favor, insira um número de WhatsApp válido');
            return;
        }
        try {
            await apiRequest('/leads', {
                method: 'POST',
                body: JSON.stringify({ whatsapp }),
                headers: { 'Content-Type': 'application/json' }
            });
            alert('✅ Cadastro realizado! Em breve você receberá nossas novidades no WhatsApp.');
            form.reset();
        } catch (error) {
            alert('❌ Erro ao cadastrar. Tente novamente.');
        }
    });
}

function setupWhatsAppButtons() {
    // APENAS 1 BOTÃO - SOMENTE NO HEADER
    const buttons = document.querySelectorAll('#whatsappBtnHeader');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.open(WHATSAPP_GROUP_LINK, '_blank');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupNewsletter();
    setupWhatsAppButtons();
});