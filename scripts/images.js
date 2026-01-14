class ImageOptimizer {
    static optimizeCardImages() {
        document.querySelectorAll('.card-image-container:not([data-optimized])').forEach(container => {
            const img = container.querySelector('img.card-image'); // Específico
            if (!img) return;

            const process = () => {
                this.adjustCardImage(img, container);
                container.dataset.optimized = 'true';
                img.classList.add('loaded'); // Muestra la imagen
            };

            if (img.complete && img.naturalWidth > 0) {
                process();
            } else {
                img.addEventListener('load', process, {once: true});
            }
        });
    }

    static optimizeDetailImages() {
        document.querySelectorAll('.detail-image-container:not([data-optimized])').forEach(container => {
            const img = container.querySelector('img.detail-image');
            if (!img) return;

            // Aplicar estilos INMEDIATAMENTE, sin esperar
            container.style.backgroundColor = '#f5f5f5';
            container.dataset.optimized = 'true';

            // Mostrar con transición SUAVE
            const showImage = () => {
                img.style.transition = 'opacity 0.4s ease';
                img.style.opacity = '1';
            };

            if (img.complete) {
                showImage();
            } else {
                img.addEventListener('load', showImage, {once: true});
            }
        });
    }

    static adjustCardImage(img, container) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;

        container.classList.remove('vertical-image', 'horizontal-image');

        if (aspectRatio < 0.7) {
            container.classList.add('vertical-image');
            img.style.objectFit = 'contain';
            container.style.backgroundColor = '#f5f5f5';
            container.style.padding = '10px';
        } else if (aspectRatio > 1.5) {
            container.classList.add('horizontal-image');
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center 30%';
        } else {
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
        }
    }
}