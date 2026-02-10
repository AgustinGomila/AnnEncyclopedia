class NavigationManager {
    constructor() {
        this.currentSection = 'books';
        this.currentCategory = 'all';
        this.currentDetail = null;
        this.pendingTimeouts = new Set();
        this.historyStack = []; // Para navegación hacia atrás en detalles
        this.init();

        // INICIALIZACIÓN DE TEMA Y BÚSQUEDA
        this.initTheme();
        this.initClearSearch();
    }

    init() {
        // DELEGACIÓN CENTRALIZADA: Un listener por contenedor estático
        this.setupDelegatedListeners();
        // Listeners para elementos permanentes (navegación, búsqueda)
        this.setupStaticListeners();
    }

    // TEMA OSCURO/CLARO
    initTheme() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        const savedTheme = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.body.classList.toggle('dark-mode', savedTheme === 'dark');
        toggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

        toggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            toggle.textContent = isDark ? '☀️' : '🌙';
        });
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
                const description = thumbnail.dataset.description;

                const mainImage = document.querySelector('.detail-image');
                const descElement = document.getElementById('image-description');

                if (mainImage) {
                    mainImage.src = fullImageSrc;
                    mainImage.dataset.index = index;

                    // Actualizar descripción
                    if (descElement) {
                        descElement.textContent = description || '';
                        descElement.classList.toggle('hidden', !description);
                    }

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
                if (this.currentDetail) this.historyStack.push({...this.currentDetail});

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

    // BOTÓN BORRAR BÚSQUEDA
    initClearSearch() {
        const searchBox = document.querySelector('.search-box');
        const searchInput = document.getElementById('search-input');
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clear-search';
        clearBtn.innerHTML = '✕';
        clearBtn.setAttribute('aria-label', 'Limpiar búsqueda');
        searchBox?.appendChild(clearBtn);

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            this.performSearch();
            clearBtn.classList.remove('visible');
        });

        searchInput.addEventListener('input', () => {
            clearBtn.classList.toggle('visible', searchInput.value.length > 0);
        });

        if (searchInput.value) clearBtn.classList.add('visible');
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
            ...results.items.map(i => ({...i, type: 'items'})),
            ...results.books.map(b => ({...b, type: 'books'}))
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
                <p style="margin-bottom: 1.5rem; line-height: 1.6;">Este es un archivo personal para organizar y mostrar personajes, lugares, ítems y libros de tu universo creativo.</p>
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
                    <li><strong>books.json</strong>: Libros relacionados</li>
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
        if (grid) grid.innerHTML = '<div class="no-results">No hay contenido disponible para esta sección</div>';
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
            items: () => dataLoader.getItem(id),
            books: () => dataLoader.getBook(id)
        };
        return getters[type]?.() || null;
    }

    // RELACIONES BIDIRECCIONALES Y LIBROS
    getRelatedInfo(item, type) {
        const relatedInfo = {characters: [], locations: [], items: [], books: []};

        switch (type) {
            case 'characters':
                relatedInfo.locations = (item.relatedLocations || []).map(id => dataLoader.getLocation(id)).filter(Boolean);
                relatedInfo.items = (item.relatedItems || []).map(id => dataLoader.getItem(id)).filter(Boolean);
                relatedInfo.books = dataLoader.getBooksByEntity('characters', item.id);
                relatedInfo.characters = dataLoader.getRelatedCharacters(item.id);
                break;
            case 'locations':
                relatedInfo.characters = dataLoader.getCharactersByLocation(item.id);
                relatedInfo.items = dataLoader.getItemsByLocation(item.id);
                relatedInfo.books = dataLoader.getBooksByEntity('locations', item.id);
                break;
            case 'items':
                relatedInfo.characters = dataLoader.getCharactersByItem(item.id);
                relatedInfo.locations = dataLoader.getLocationsByItem(item.id);
                relatedInfo.books = dataLoader.getBooksByEntity('items', item.id);
                break;
            case 'books': // Libros muestran sus entidades relacionadas
                relatedInfo.characters = (item.relatedCharacters || []).map(id => dataLoader.getCharacter(id)).filter(Boolean);
                relatedInfo.locations = (item.relatedLocations || []).map(id => dataLoader.getLocation(id)).filter(Boolean);
                relatedInfo.items = (item.relatedItems || []).map(id => dataLoader.getItem(id)).filter(Boolean);
                break;
        }
        return relatedInfo;
    }

    // Retrocompatible image/images
    getImagesArray(item) {
        return dataLoader.normalizeImages(item.images || item.image);
    }

    createCard(item, type) {
        const images = this.getImagesArray(item);
        const mainImage = images[0].src;
        const name = item.name || 'Sin nombre';
        const category = item.category || 'Sin categoría';
        const description = item.shortDescription || (item.description ? item.description.substring(0, 100) + '...' : 'Sin descripción');

        return `
        <div class="card" data-id="${item.id}" data-type="${type}">
            <div class="card-image-container">
                <img src="${mainImage}" alt="${name}" class="card-image" loading="lazy" onerror="this.src='${window.placeholder}'">
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

        const imageDescriptionHTML = `
        <div class="image-description ${mainImage.description ? '' : 'hidden'}" id="image-description">
            ${mainImage.description || ''}
        </div>
        `;

        // GALERÍA: Insertada DENTRO del contenedor de imagen
        const galleryHTML = images.length > 1 ? `
        <div class="image-thumbnails">
            ${images.map((img, index) => `
                <img src="${img.src}" alt="${name} ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                     data-index="${index}" data-full="${img.src}" data-description="${img.description}" 
                     loading="lazy" onerror="this.src='${window.placeholder}'; this.classList.add('broken')">
            `).join('')}
        </div>` : '';

        const statsHTML = item.stats && Object.keys(item.stats).length > 0
            ? `<div class="attributes">${Object.entries(item.stats).map(([key, value]) => `
                <div class="attribute"><h4>${this.formatKey(key)}</h4><p>${value || 'N/A'}</p></div>
            `).join('')}</div>` : '';

        // SECCIÓN LIBROS para personajes/lugares/ítems
        const booksHTML = (type !== 'books' && relatedInfo.books?.length > 0) ? `
            <div class="books-section">
                <h3>📚 Libros donde aparece</h3>
                <div class="related-grid">
                    ${relatedInfo.books.map(book => this.createRelatedCard(book, 'books')).join('')}
                </div>
            </div>` : '';

        // Relaciones (excluye libros de la lista general)
        const relatedSections = ['characters', 'locations', 'items']
            .filter(relType => relType !== type || (relType === 'characters' && type === 'characters')) // Permitir characters en characters
            .filter(relType => relatedInfo[relType]?.length > 0)
            .map(relType => {
                const titles = {
                    characters: type === 'characters'
                        ? '🎭 Alter-Egos / Otras Versiones'
                        : '👥 Personajes Relacionados',
                    locations: '📍 Lugares Relacionados',
                    items: '🎁 Objetos Relacionados'
                };
                return `
            <div class="related-section">
                <h3>${titles[relType]}</h3>
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
                            <img src="${mainImage.src}" alt="${name}" class="detail-image" data-index="0" onerror="this.src='${window.placeholder}'">
                            ${galleryHTML}
                            ${imageDescriptionHTML}
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
                    ${booksHTML} <!-- Insertado al final -->
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
                <img src="${mainImage}" alt="${name}" class="related-card-image" loading="lazy" onerror="this.src='${window.placeholder}'">
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