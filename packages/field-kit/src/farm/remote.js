export const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID || 'betail-pwa';
export const getHost = () => localStorage.getItem('host') || '';
export const setHost = (host) => { localStorage.setItem('host', host); };
export const getToken = () => JSON.parse(localStorage.getItem('token'));
export const setToken = token => localStorage.setItem('token', JSON.stringify(token));
