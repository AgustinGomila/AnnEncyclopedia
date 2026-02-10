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

    // INYECTAR TEXTOS DEL UI EN EL DOM
    injectUITexts();

    navigation.switchSection('books');

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
    if (updateDateEl && uiConfig.footerText) {
        updateDateEl.textContent = new Date().toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        document.querySelector('footer p').innerHTML = uiConfig.footerText.replace('{date}', updateDateEl.textContent);
        document.querySelector('footer p:last-child').textContent = uiConfig.footerHint;
    }
});

// FUNCIÓN CENTRAL PARA INYECTAR TEXTOS
function injectUITexts() {
    if (!uiConfig || Object.keys(uiConfig).length === 0) return;

    // Header
    document.querySelector('.logo h1').textContent = uiConfig.appName || 'Mi Universo';
    document.querySelector('.logo p').textContent = uiConfig.appSubtitle || 'Archivo de contenido';

    // BÚSQUEDA: Configurar solo después de que navigation existe
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.placeholder = uiConfig.searchPlaceholder || 'Buscar...';
    }
    document.getElementById('search-btn').title = uiConfig.searchButtonTitle || 'Buscar';

    // Nav links
    uiConfig.navLinks?.forEach(link => {
        const navLink = document.querySelector(`[data-section="${link.section}"]`);
        if (navLink) navLink.textContent = link.text;
    });

    // Stats
    const statsTitle = document.querySelector('.stats h3');
    if (statsTitle) statsTitle.textContent = uiConfig.categoryFiltersTitle || 'Categorías';

    console.log('🎉 AnnDex completamente cargado y listo');
}