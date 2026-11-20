
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const sesion = await api('/api/session');

        if (sesion?.usuario?.rol === 'admin') {
            window.location.replace('/');
            return;
        }
    } catch {
        return; 
    }

});