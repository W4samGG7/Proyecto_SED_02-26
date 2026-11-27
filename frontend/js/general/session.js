const LOGIN_ROUTE = '/modules/login/index_login.html';
const ADMIN_ROUTE = '/modules/admin/';

function currentPath(){
    return window.location.pathname + window.location.search;
}

function buildLoginUrl() {
    return `${LOGIN_ROUTE}?redirect=${encodeURIComponent(currentPath())}`;
}

export async function getSession() {
    try {
        const res = await fetch('/api/session');
        if(!res.ok) return null;
        const data = await res.json();
        return data.usuario ?? null;
    } catch {
        return null;
    }
}

export async function logout() {
    try{
    await fetch('/api/logout', {method: 'POST'});
    }catch{
        
    }
    window.location.href = '/';
}

function renderSessionState(user){
    const container = document.getElementById('estadoSesion');
    if( !container ||  !user) return;

    const greeting = document.createElement('span');
    greeting.className = 'usuario-bienvenida';
    greeting.textContent = `¡Hola, ${user.nombre || 'Usuario'}!`;

    const button = document.createElement('button');
    button.className = 'btn-cerrar-sesion';
    button.textContent = 'Cerrar sesión';
    button.addEventListener('click', logout);

    container.replaceChildren(greeting, button);
}

function rememberLinksAfterLogin() {
    if(window.location.pathname.startsWith('/modules/login/')) return;

    document.querySelectorAll('a[href*="index_login.html"]').forEach((link) => {
        link.href = buildLoginUrl();
    });
}


export async function initSession() {
    const user = await getSession();

    // El admin es solo administrativo: no compra ni vende, va directo a su panel
    if (user && user.rol === 'admin' && !window.location.pathname.startsWith(ADMIN_ROUTE)) {
        window.location.replace(`${ADMIN_ROUTE}panel.html`);
        return;
    }

    renderSessionState(user);

    if (user) return;

    rememberLinksAfterLogin();

    if (document.body.hasAttribute('data-requiere-sesion') && !user) {
        window.location.replace(buildLoginUrl());
    }
}
