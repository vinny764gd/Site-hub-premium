// Detecta automaticamente se está em produção ou desenvolvimento
const isProduction = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1');

// URL do backend - ALTERE PARA A SUA URL
const BACKEND_URL = 'https://api-hub-one.vercel.app';

export const API_URL = `${BACKEND_URL}/api`;