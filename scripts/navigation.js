class NavigationManager {
    constructor() {
        this.currentSection = 'characters';
        this.currentCategory = 'all';
        this.currentDetail = null;
        this.pendingTimeouts = new Set();
        this.historyStack = []; // Para navegación hacia atrás en detalles
        this.init();
    }

    init() {
        // DELEGACIÓN CENTRALIZADA: Un listener por contenedor estático
        this.setupDelegatedListeners();
        // Listeners para elementos permanentes (navegación, búsqueda)
        this.setupStaticListeners();
    }

    // LISTENERS DELEGADOS
    setupDelegatedListeners() {
        // Tarjetas DEL GRID
        document.getElementById('content-grid')?.addEventListener('click', (e) => {
            const card = e.target.closest('.card[data-id]');
            if (card) {
                const id = parseInt(card.dataset.id);
                const type = card.dataset.type;
                this.showDetail(id, type);
            }
        });

        // Tarjetas RELACIONADAS EN DETALLE
        document.getElementById('detail-view')?.addEventListener('click', (e) => {
            // Thumbnail click
            const thumbnail = e.target.closest('.thumbnail');
            if (thumbnail) {
                e.preventDefault();
                const fullImageSrc = thumbnail.dataset.full;
                const index = parseInt(thumbnail.dataset.index);
                const mainImage = document.querySelector('.detail-image');
                if (mainImage) {
                    mainImage.src = fullImageSrc;
                    mainImage.dataset.index = index;
                    thumbnail.parentElement.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumbnail.classList.add('active');
                }
                return;
            }

            // Related card navigation
            const relatedCard = e.target.closest('.related-card[data-id]');
            if (relatedCard) {
                e.preventDefault();
                const id = parseInt(relatedCard.dataset.id);
                const type = relatedCard.dataset.type;

                // Guardar el detalle actual en el historial
                if (this.currentDetail) {
                    this.historyStack.push({...this.currentDetail});
                }

                this.showDetail(id, type);
                return;
            }

            // Botón cerrar
            const closeBtn = e.target.closest('.close-detail');
            if (closeBtn) {
                this.closeDetailView();
                return;
            }

            // Botón volver atrás
            const backBtn = e.target.closest('.back-detail');
            if (backBtn && this.historyStack.length > 0) {
                const previous = this.historyStack.pop();
                this.showDetail(previous.id, previous.type, true); // true = no guardar en historial
            }
        });

        // FILTROS
        document.getElementById('category-filters')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.category-btn[data-category]');
            if (!btn) return;

            // Actualizar estado visual
            btn.parentElement.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.currentCategory = btn.dataset.category;
            this.loadSectionContent(this.currentSection);
        });
    }

    // LISTENERS ESTÁTICOS
    setupStaticListeners() {
        // Navegación principal
        document.querySelectorAll('.main-nav a[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                if (section) this.switchSection(section);
            });
        });

        // Búsqueda
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }
    }

    // GESTIÓN DE TIMERS
    setSafeTimeout(callback, delay) {
        const id = setTimeout(() => {
            this.pendingTimeouts.delete(id);
            callback();
        }, delay);
        this.pendingTimeouts.add(id);
        return id;
    }

    clearAllTimeouts() {
        this.pendingTimeouts.forEach(id => clearTimeout(id));
        this.pendingTimeouts.clear();
    }

    // MÉTODOS PRINCIPALES
    performSearch() {
        const query = document.getElementById('search-input')?.value || '';
        if (!query.trim()) {
            this.loadSectionContent(this.currentSection);
            return;
        }

        const results = dataLoader.search(query);
        const allResults = [
            ...results.characters.map(c => ({...c, type: 'characters'})),
            ...results.locations.map(l => ({...l, type: 'locations'})),
            ...results.items.map(i => ({...i, type: 'items'}))
        ];

        const grid = document.getElementById('content-grid');
        if (!grid) return;

        grid.innerHTML = allResults.length
            ? `<div class="search-header"><h3>Resultados para: "${query}" (${allResults.length})</h3></div>
               ${allResults.map(item => this.createCard(item, item.type)).join('')}`
            : `<div class="no-results">No se encontró "${query}"</div>`;

        this.clearAllTimeouts();
        this.setSafeTimeout(() => ImageOptimizer.optimizeCardImages(), 50);
    }

    // Sección About
    showAboutSection() {
        const grid = document.getElementById('content-grid');
        const categoryFilters = document.getElementById('category-filters');

        if (!grid) return;

        // Limpiar filtros
        if (categoryFilters) {
            categoryFilters.innerHTML = '<p style="color:#999;">No hay filtros para esta sección</p>';
        }

        // Mostrar contenido estático
        grid.innerHTML = `
            <div class="about-content" style="grid-column: 1 / -1; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: var(--primary-color); margin-bottom: 1rem;">📚 Acerca de este proyecto</h2>
                <p style="margin-bottom: 1.5rem; line-height: 1.6;">Este es un archivo personal para organizar y mostrar personajes, lugares e historias de tu universo creativo.</p>
                
                <h3 style="color: var(--secondary-color); margin-top: 2rem;">¿Cómo agregar contenido?</h3>
                <ol style="margin-left: 1.5rem; line-height: 2;">
                    <li>Edita los archivos JSON en la carpeta <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">/data</code></li>
                    <li>Agrega imágenes a las carpetas correspondientes en <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">/images/</code></li>
                    <li>Actualiza las referencias en los archivos JSON</li>
                </ol>
                
                <h3 style="color: var(--secondary-color); margin-top: 2rem;">Estructura de datos</h3>
                <ul style="margin-left: 1.5rem; line-height: 2;">
                    <li><strong>characters.json</strong>: Personajes con sus historias y estadísticas</li>
                    <li><strong>locations.json</strong>: Lugares del universo</li>
                    <li><strong>items.json</strong>: Objetos y artefactos</li>
                    <li><strong>categories.json</strong>: Sistema de categorías</li>
                </ul>
            </div>
        `;

        this.closeDetailView();
    }

    switchSection(section) {
        if (!section) return;

        this.currentSection = section;
        this.currentCategory = 'all';
        this.historyStack = []; // Limpiar historial al cambiar sección

        document.querySelectorAll('.main-nav a').forEach(link => {
            link.classList.toggle('active', link.dataset.section === section);
        });

        if (section === 'about') {
            this.showAboutSection();
            return;
        }

        this.loadCategoryFilters(section);
        this.loadSectionContent(section);
        this.closeDetailView();
    }

    loadCategoryFilters(section) {
        const container = document.getElementById('category-filters');
        if (!container || !dataLoader.isValidType(section)) return;

        const items = dataLoader.data[section] || [];
        if (items.length === 0) {
            container.innerHTML = '<p style="color:#999;">Sin categorías</p>';
            return;
        }

        const categories = dataLoader.getAllCategories(section);
        container.innerHTML = `
            <button class="category-btn active" data-category="all">Todos (${items.length})</button>
            ${categories.map(cat => `
                <button class="category-btn" data-category="${cat}">
                    ${cat} (${items.filter(i => i.category === cat).length})
                </button>
            `).join('')}
        `;
    }

    loadSectionContent(section) {
        if (!dataLoader.isValidType(section)) {
            this.showNoContentMessage();
            return;
        }

        let items = dataLoader.data[section] || [];
        if (this.currentCategory !== 'all') {
            items = items.filter(item => item?.category === this.currentCategory);
        }

        this.renderGrid(items, section);
        this.clearAllTimeouts();
        this.setSafeTimeout(() => ImageOptimizer.optimizeCardImages(), 50);
    }

    showNoContentMessage() {
        const grid = document.getElementById('content-grid');
        if (grid) {
            grid.innerHTML = '<div class="no-results">No hay contenido disponible para esta sección</div>';
        }
    }

    renderGrid(items, type) {
        const grid = document.getElementById('content-grid');
        if (!grid) return;

        grid.innerHTML = !items?.length
            ? '<div class="no-results">No hay elementos en esta sección</div>'
            : items.filter(item => item).map(item => this.createCard(item, type)).join('');
    }

    showDetail(id, type, dontPushToHistory = false) {
        const item = this.getItemByType(id, type);
        if (!item) {
            console.error(`❌ Item no encontrado: ${type}/${id}`);
            return;
        }

        // Guardar en historial solo si no venimos de "atrás"
        if (!dontPushToHistory && this.currentDetail) {
            this.historyStack.push({...this.currentDetail});
        }

        this.currentDetail = {id, type};
        const relatedInfo = this.getRelatedInfo(item, type);
        const detailView = document.getElementById('detail-view');
        if (!detailView) return;

        this.clearAllTimeouts();
        detailView.innerHTML = this.createDetailView(item, type, relatedInfo);
        detailView.classList.add('active');
        this.setSafeTimeout(() => ImageOptimizer.optimizeDetailImages(), 50);
        detailView.scrollIntoView({behavior: 'smooth'});
    }

    // Métodos auxiliares
    getItemByType(id, type) {
        const getters = {
            characters: () => dataLoader.getCharacter(id),
            locations: () => dataLoader.getLocation(id),
            items: () => dataLoader.getItem(id)
        };
        return getters[type]?.() || null;
    }

    getRelatedInfo(item, type) {
        const relatedInfo = {characters: [], locations: [], items: []};
        switch (type) {
            case 'characters':
                relatedInfo.locations = (item.relatedLocations || []).map(id => dataLoader.getLocation(id)).filter(Boolean);
                relatedInfo.items = (item.relatedItems || []).map(id => dataLoader.getItem(id)).filter(Boolean);
                break;
            case 'locations':
                relatedInfo.characters = dataLoader.getCharactersByLocation(item.id);
                relatedInfo.items = dataLoader.getItemsByLocation(item.id);
                break;
            case 'items':
                relatedInfo.characters = dataLoader.getCharactersByItem(item.id);
                relatedInfo.locations = dataLoader.getLocationsByItem(item.id);
                break;
        }
        return relatedInfo;
    }

    // Detecta image o images, string o array
    getImagesArray(item) {
        // Prioriza 'images' si existe
        if (item.images) {
            return Array.isArray(item.images) ? item.images : [item.images];
        }
        // Luego 'image'
        if (item.image) {
            return Array.isArray(item.image) ? item.image : [item.image];
        }
        // Fallback
        return ['images/placeholder.jpg'];
    }

    createCard(item, type) {
        const images = this.getImagesArray(item);
        const mainImage = images[0];
        const name = item.name || 'Sin nombre';
        const category = item.category || 'Sin categoría';
        const description = item.shortDescription || (item.description ? item.description.substring(0, 100) + '...' : 'Sin descripción');

        return `
            <div class="card" data-id="${item.id}" data-type="${type}">
                <div class="card-image-container">
                    <img src="${mainImage}" alt="${name}" class="card-image" loading="lazy" onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="card-content">
                    <span class="card-category">${category}</span>
                    <h3>${name}</h3>
                    <p class="card-description">${description}</p>
                </div>
            </div>
        `;
    }

    // Galería
    createDetailView(item, type, relatedInfo) {
        const images = this.getImagesArray(item);
        const mainImage = images[0];
        const name = item.name || 'Sin nombre';
        const category = item.category || 'Sin categoría';
        const description = item.description || 'Sin descripción';

        const backButton = this.historyStack.length > 0
            ? `<button class="back-detail">◄</button>`
            : `<button class="back-detail" hidden></button>`;

        // GALERÍA: Insertada DENTRO del contenedor de imagen
        const galleryHTML = images.length > 1 ? `
        <div class="image-thumbnails">
            ${images.map((img, index) => `
                <img src="${img}" alt="${name} ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                     data-index="${index}" data-full="${img}" loading="lazy" onerror="this.src='images/placeholder.jpg'; this.classList.add('broken')">
            `).join('')}
        </div>
    ` : '';

        const statsHTML = item.stats && Object.keys(item.stats).length > 0
            ? `<div class="attributes">${Object.entries(item.stats).map(([key, value]) => `
            <div class="attribute"><h4>${this.formatKey(key)}</h4><p>${value || 'N/A'}</p></div>
        `).join('')}</div>`
            : '';

        const relatedSections = ['characters', 'locations', 'items']
            .filter(relType => relType !== type && relatedInfo[relType]?.length > 0)
            .map(relType => {
                const titles = {characters: 'Personajes', locations: 'Lugares', items: 'Objetos'};
                return `
                <div class="related-section">
                    <h3>${titles[relType]} Relacionados</h3>
                    <div class="related-grid">
                        ${relatedInfo[relType].map(r => this.createRelatedCard(r, relType)).join('')}
                    </div>
                </div>
            `;
            })
            .join('');

        const historyHTML = item.history ? `
        <div class="history-section">
            <h3>Historia</h3>
            <div class="history-content">${item.history}</div>
        </div>` : '';

        return `
        <div class="detail-header">
            <div class="detail-actions">
                ${backButton}
                <button class="close-detail" aria-label="Cerrar">✕</button>
            </div>
            <div class="detail-content">
                <div class="detail-main">
                    <div class="detail-image-container">
                        <img src="${mainImage}" alt="${name}" class="detail-image" data-index="0" onerror="this.src='images/placeholder.jpg'">
                        ${galleryHTML} <!-- DENTRO del contenedor -->
                    </div>
                    <div class="detail-info">
                        <span class="detail-category">${category}</span>
                        <h2>${name}</h2>
                        <div class="detail-description">${description}</div>
                        ${statsHTML}
                    </div>
                </div>
                ${relatedSections}
                ${historyHTML}
            </div>
        </div>
    `;
    }

    createRelatedCard(item, type) {
        const images = this.getImagesArray(item);
        const mainImage = images[0];
        const name = item.name || 'Sin nombre';

        return `
            <div class="related-card" data-id="${item.id}" data-type="${type}">
                <img src="${mainImage}" alt="${name}" class="related-card-image" loading="lazy" onerror="this.src='images/placeholder.jpg'">
                <div class="related-card-name">${name}</div>
            </div>
        `;
    }

    closeDetailView() {
        document.getElementById('detail-view')?.classList.remove('active');
        this.currentDetail = null;
        this.historyStack = []; // Limpiar historial al cerrar manualmente
    }

    formatKey(key) {
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    }

    // Cleanup para casos de hot-reload
    destroy() {
        this.clearAllTimeouts();
        this.historyStack = [];
    }
}