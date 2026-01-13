// Inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar la navegación (ya se hace en navigation.js)
    console.log('Pokédex Personal cargado');

    // Actualizar fecha
    const updateDate = document.getElementById('update-date');
    if (updateDate) {
        updateDate.textContent = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Configurar búsqueda con debounce
    let searchTimeout;
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    navigation.performSearch();
                } else if (query.length === 0 && navigation) {
                    navigation.loadSectionContent(navigation.currentSection);
                }
            }, 300);
        });
    }

    // Optimizar imágenes después de que se cargue el contenido
    setTimeout(() => {
        ImageOptimizer.optimizeCardImages();

        // Observar cambios en el DOM para optimizar nuevas imágenes
        const observer = new MutationObserver(() => {
            ImageOptimizer.optimizeCardImages();
            ImageOptimizer.optimizeDetailImages();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 1000);
});