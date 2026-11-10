document.addEventListener('DOMContentLoaded', () => {

    const imageInput = document.getElementById('item-image');
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const placeholder = document.querySelector('.image-upload-placeholder');

     const form = document.getElementById('item-register-form');
    const btnPreview = document.getElementById('btn-preview-item');
    const dialog = document.getElementById('preview-dialog');
    const cardContainer = document.getElementById('preview-card-container');
    const btnClose = document.getElementById('preview-close');



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
                        <i class="fa-solid fa-cart-shopping"></i>
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

    imageInput.addEventListener('change', () => {

        const file = imageInput.files[0];

        if (!file) {
            previewContainer.style.display = 'none';
            placeholder.style.display = 'flex';
            imagePreview.src = '';
            return;
        }

        if (currentImageURL) {
            URL.revokeObjectURL(currentImageURL);
        }

        currentImageURL = URL.createObjectURL(file);

        imagePreview.src = currentImageURL;
        previewContainer.style.display = 'block';
        placeholder.style.display = 'none';

        renderPreview();

    });

    form.addEventListener('input', renderPreview);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    renderPreview();

});