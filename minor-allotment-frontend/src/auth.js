export const isLoggedIn = () => !!localStorage.getItem('token');

export const getToken = () => localStorage.getItem('token');

export const login = (token) => localStorage.setItem('token', token);

export const logout = () => localStorage.removeItem('token');
