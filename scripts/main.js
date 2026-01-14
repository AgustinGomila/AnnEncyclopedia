document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 AnnDex iniciando...');

    if (typeof dataLoader === 'undefined') {
        console.error('❌ CRÍTICO: dataLoader no está definido');
        return;
    }

    const success = await dataLoader.loadAllData();
    if (!success) {
        console.error('❌ Error al cargar datos');
        return;
    }
    console.log('✅ Datos cargados');

    dataLoader.updateStats();

    // Crear navegación ANTES de configurar búsqueda
    window.navigation = new NavigationManager();

    navigation.switchSection('characters');

    // Service Worker
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registrado');
        } catch (err) {
            console.log('⚠️ Modo online:', err.message);
        }
    }

    // Fecha
    const updateDateEl = document.getElementById('update-date');
    if (updateDateEl) {
        updateDateEl.textContent = new Date().toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // BÚSQUEDA: Configurar solo después de que navigation existe
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query.length >= 2 && window.navigation) {
                    navigation.performSearch();
                } else if (query.length === 0 && window.navigation) {
                    navigation.loadSectionContent(navigation.currentSection);
                }
            }, 300);
        });
    }

    console.log('🎉 AnnDex completamente cargado y listo');
});