/**
 * Centralized API configuration for the Agentic AI Tutor.
 * 
 * In production (Vercel), we expect the backend to be either:
 * 1. A separate service (e.g., Render, Railway) with a custom URL.
 * 2. Proxied via Vercel if configured.
 * 
 * For now, we allow overriding via VITE_API_URL or fallback to localhost.
 */

const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;
    
    // Fallback logic for production vs local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return "http://localhost:8000";
    }
    
    // Defaults to empty string (relative) for Vercel/proxied routes
    // or you can set a default production backend here.
    return ""; 
};

export const API_BASE_URL = getApiBaseUrl();

export const api = {
    teach: `${API_BASE_URL}/api/teach`,
    gap: `${API_BASE_URL}/api/gap-analysis`,
    evaluate: `${API_BASE_URL}/api/evaluate`,
    diagnose: `${API_BASE_URL}/api/diagnose-mistake`,
    strategy: `${API_BASE_URL}/api/strategy`,
    chat: `${API_BASE_URL}/api/chat`,
    execute: `${API_BASE_URL}/api/code/execute`,
    status: `${API_BASE_URL}/api/status`,
    processAnswer: `${API_BASE_URL}/api/evaluate` // Mapping to evaluate which runs full cycle
};
