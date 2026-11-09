function loadComponent(id,archivo) {
    fetch(archivo)
        .then(response => {
            if(!response.ok) throw new Error("No se pudo cargar ${archivo}");
            return response.text();
        })
        .then(data =>{
            document.getElementById(id).innerHTML = data;
        })
        .catch(error => console.error("Error:", error));
}

document.addEventListener("DOMContentLoaded",() => {
    loadComponent("header-container","../../modules/general/header.html")
    loadComponent("footer-container","../../modules/general/footer.html")
});