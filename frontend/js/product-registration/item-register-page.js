import { initSession } from './general/session.js';

document.addEventListener('DOMContentLoaded', async () => {

    await initSession();

    const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

    const imageInput = document.getElementById('item-image');
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const placeholder = document.querySelector('.image-upload-placeholder');

    const form = document.getElementById('item-register-form');
    const cardContainer = document.getElementById('preview-card-container');
    const statusMessage = document.getElementById('form-status');
    const publishButton = document.querySelector('.btn-publish-item');

    let currentImageURL = null;

    function escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function createPreviewCardHTML(product) {
        return `
            <article class="product-card">
                <div class="product-image-container">
                    ${product.image ? `<img src="${product.image}" alt="${escapeHTML(product.brand)}" class="product-image">` : ''}
                    <button type="button" class="add-to-cart">
                        <img src="../../assets/icons/shoppingCart/cart-plus.svg" alt="Carrito" class="cart-icon">
                    </button>
                </div>
                <div class="product-info">
                    <span class="product-brand">${escapeHTML(product.brand)}</span>
                    <span class="product-name">${escapeHTML(product.name)}</span>
                    <span class="product-size">Talla ${escapeHTML(product.size)}</span>
                    <div class="product-pricing">
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                    </div>
                </div>
            </article>
        `;
    }

    function renderPreview() {
        const product = {
            name: form.item_name.value.trim() || 'Nombre del artículo',
            brand: form.item_brand.value.trim() || 'Marca',
            size: form.item_size.value.trim() || '—',
            price: parseFloat(form.price.value) || 0,
            image: currentImageURL
        };

        cardContainer.innerHTML = createPreviewCardHTML(product);
    }

    function showStatus(message, isError) {
        statusMessage.textContent = message;
        statusMessage.className = isError ? 'form-status form-status-error' : 'form-status form-status-ok';
    }


    imageInput.addEventListener('change', () => {

        const file = imageInput.files[0];

        if (currentImageURL) {
            URL.revokeObjectURL(currentImageURL);
            currentImageURL = null;
        }

        if (!file) {
            previewContainer.style.display = 'none';
            placeholder.style.display = 'flex';
            imagePreview.src = '';
            renderPreview();
            return;
        }

        currentImageURL = URL.createObjectURL(file);

        imagePreview.src = currentImageURL;
        previewContainer.style.display = 'block';
        placeholder.style.display = 'none';

        renderPreview();

    });

    form.addEventListener('input', renderPreview);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showStatus('', false);

        const file = imageInput.files[0];

        if(!file) {
            showStatus('Sube una foto del producto.', true);
            return;
        }

        if(file.size > MAX_IMAGE_BYTES){
            showStatus('La foto supera los 2MB.', true);
            return;
        }
        
        const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            showStatus('La foto debe ser PNG o JPG.', true);
            return;
        }

        publishButton.disabled = true;
        showStatus('Publicando...',false)

        try{
            const response = await fetch('/api/productos', {
                method: 'POST',
                body: new FormData(form) 
            });

            const data = await response.json().catch(() => ({}));

            if (response.status === 401) {
                window.location.href =
                    '/modules/login/index_login.html?redirect=' +
                    encodeURIComponent(window.location.pathname);
                return;
            }

             if (!response.ok) {
                showStatus(data.message || 'No se pudo publicar el artículo.', true);
                publishButton.disabled = false;
                return;
            }

            showStatus('¡Artículo publicado!', false);

            setTimeout(() => {
                window.location.href = '/modules/seller/panel.html';
            }, 1200);

        }catch {
            showStatus('No se pudo conectar con el servidor.', true);
            publishButton.disabled = false;
        }
    });

    renderPreview();

});