class ImageOptimizer {
    static async optimizeCardImages() {
        const cards = document.querySelectorAll('.card-image-container');

        cards.forEach(async (container) => {
            const img = container.querySelector('img');
            if (!img) return;

            // Esperar a que la imagen cargue
            if (img.complete) {
                this.checkAndAdjustImage(img, container);
            } else {
                img.onload = () => this.checkAndAdjustImage(img, container);
            }
        });
    }

    static checkAndAdjustImage(img, container) {
        // Verificar proporción de la imagen
        const aspectRatio = img.naturalWidth / img.naturalHeight;

        // Si la imagen es muy vertical (relación < 0.7)
        if (aspectRatio < 0.7) {
            container.classList.add('vertical-image');

            // Ajustar para mostrar más de la imagen vertical
            img.style.objectFit = 'contain';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.backgroundColor = '#f5f5f5';

            // Opcional: Añadir padding para no tocar los bordes
            container.style.padding = '10px';
        } else if (aspectRatio > 1.5) {
            // Si la imagen es muy horizontal
            container.classList.add('horizontal-image');
            img.style.objectPosition = 'center top';
        }
    }

    static async optimizeDetailImages() {
        const detailContainers = document.querySelectorAll('.detail-image-container');

        detailContainers.forEach(async (container) => {
            const img = container.querySelector('img');
            if (!img) return;

            if (img.complete) {
                this.adjustDetailImage(img, container);
            } else {
                img.onload = () => this.adjustDetailImage(img, container);
            }
        });
    }

    static adjustDetailImage(img, container) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;

        // Para la vista detallada, siempre mostrar toda la imagen
        img.style.objectFit = 'contain';
        container.style.backgroundColor = '#f5f5f5';

        // Si la imagen es muy vertical, ajustar contenedor
        if (aspectRatio < 0.7) {
            container.style.maxHeight = '600px';
            container.style.overflowY = 'auto';
        }
    }
}