const LOGIN_ROUTE = '/modules/login/index_login.html';

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

export async function initSession() {
    const user = await getSession();
    renderSessionState(user);

    if (document.body.hasAttribute('data-requiere-sesion') && !user) {
        window.location.replace(LOGIN_ROUTE);
    }
}
