document.addEventListener('DOMContentLoaded', () => {

    const imageInput = document.getElementById('item-image');
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const placeholder = document.querySelector('.image-upload-placeholder');

    let currentImageURL = null;

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

    });

});