class NavigationManager {
    constructor() {
        this.currentSection = 'characters';
        this.currentCategory = 'all';
        this.currentDetail = null;
        this.init();
    }

    init() {
        // Navegación principal
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // Botón de búsqueda
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
    }

    switchSection(section) {
        if (!section) return;

        this.currentSection = section;
        this.currentCategory = 'all';

        // Actualizar navegación activa
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });

        // Si es la sección "about", mostrar contenido estático
        if (section === 'about') {
            this.showAboutSection();
            return;
        }

        // Cargar categorías para esta sección
        this.loadCategoryFilters(section);

        // Cargar contenido
        this.loadSectionContent(section);

        // Cerrar vista detallada si está abierta
        this.closeDetailView();
    }

    async loadCategoryFilters(section) {
        const container = document.getElementById('category-filters');
        if (!container || !dataLoader.isValidType(section)) return;

        // Asegurarnos de que los datos están cargados
        await dataLoader.loadAllData();

        if (!dataLoader.data[section] || dataLoader.data[section].length === 0) {
            container.innerHTML = '<p>No hay datos disponibles</p>';
            return;
        }

        const categories = dataLoader.getAllCategories(section);

        container.innerHTML = `
            <button class="category-btn active" data-category="all">
                Todos (${dataLoader.data[section].length})
            </button>
        `;

        if (categories && categories.length > 0) {
            categories.forEach(category => {
                const count = dataLoader.filterByCategory(section, category).length;
                const button = document.createElement('button');
                button.className = 'category-btn';
                button.textContent = `${category} (${count})`;
                button.dataset.category = category;
                button.addEventListener('click', (e) => {
                    container.querySelectorAll('.category-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    button.classList.add('active');
                    this.currentCategory = button.dataset.category;
                    this.loadSectionContent(section);
                });
                container.appendChild(button);
            });
        }

        // Event listener para el botón "Todos"
        const allBtn = container.querySelector('.category-btn');
        if (allBtn) {
            allBtn.addEventListener('click', (e) => {
                container.querySelectorAll('.category-btn').forEach(b => {
                    b.classList.remove('active');
                });
                allBtn.classList.add('active');
                this.currentCategory = 'all';
                this.loadSectionContent(section);
            });
        }
    }

    loadSectionContent(section) {
        // Verificar si es una sección válida
        if (!dataLoader.isValidType(section)) {
            this.showNoContentMessage();
            return;
        }

        let items = dataLoader.data[section] || [];

        // Filtrar por categoría si no es "all"
        if (this.currentCategory !== 'all') {
            items = items.filter(item => item && item.category === this.currentCategory);
        }

        // Renderizar en grid
        this.renderGrid(items, section);
    }

    renderGrid(items, type) {
        const grid = document.getElementById('content-grid');
        if (!grid) return;

        if (!items || items.length === 0) {
            grid.innerHTML = '<div class="no-results">No se encontraron elementos</div>';
            return;
        }

        // Filtrar items nulos
        const validItems = items.filter(item => item);

        grid.innerHTML = validItems.map(item => this.createCard(item, type)).join('');

        // Añadir event listeners a las tarjetas - ¡ESTE ERA EL ERROR!
        grid.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const cardType = card.dataset.type;
                this.showDetail(id, cardType);
            });
        });
    }

    createCard(item, type) {
        if (!item) return '';

        const imageUrl = item.image || 'images/placeholder.jpg';
        const name = item.name || 'Sin nombre';
        const category = item.category || 'Sin categoría';
        const description = item.shortDescription ||
            (item.description ? item.description.substring(0, 100) + '...' : 'Sin descripción');

        return `
        <div class="card" data-id="${item.id}" data-type="${type}">
            <div class="card-image-container">
                <img src="${imageUrl}" 
                     alt="${name}" 
                     class="card-image"
                     onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="card-content">
                <span class="card-category">${category}</span>
                <h3>${name}</h3>
                <p class="card-description">${description}</p>
            </div>
        </div>
    `;
    }

    showDetail(id, type) {
        const detailView = document.getElementById('detail-view');
        if (!detailView) return;

        let item;
        switch (type) {
            case 'characters':
                item = dataLoader.getCharacter(id);
                break;
            case 'locations':
                item = dataLoader.getLocation(id);
                break;
            case 'items':
                item = dataLoader.getItem(id);
                break;
            default:
                return;
        }

        if (!item) return;

        this.currentDetail = {id, type};

        // Obtener elementos relacionados
        let relatedInfo = this.getRelatedInfo(item, type);

        detailView.innerHTML = this.createDetailView(item, type, relatedInfo);
        detailView.classList.add('active');

        // Añadir event listener para cerrar
        const closeBtn = detailView.querySelector('.close-detail');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDetailView());
        }

        // Scroll a la vista detallada
        detailView.scrollIntoView({behavior: 'smooth'});
    }

    getRelatedInfo(item, type) {
        let relatedInfo = {
            characters: [],
            locations: [],
            items: []
        };

        switch (type) {
            case 'characters':
                // Personajes relacionados
                if (item.relatedCharacters) {
                    relatedInfo.characters = item.relatedCharacters
                        .map(id => dataLoader.getCharacter(id))
                        .filter(Boolean);
                }
                // Lugares relacionados
                if (item.relatedLocations) {
                    relatedInfo.locations = item.relatedLocations
                        .map(id => dataLoader.getLocation(id))
                        .filter(Boolean);
                }
                // Items relacionados
                if (item.relatedItems) {
                    relatedInfo.items = item.relatedItems
                        .map(id => dataLoader.getItem(id))
                        .filter(Boolean);
                }
                break;

            case 'locations':
                // Personajes en este lugar
                relatedInfo.characters = dataLoader.getCharactersByLocation(item.id);
                // Items en este lugar
                relatedInfo.items = dataLoader.getItemsByLocation(item.id);
                break;

            case 'items':
                // Personajes relacionados con este item
                relatedInfo.characters = dataLoader.getCharactersByItem(item.id);
                // Lugares relacionados con este item
                relatedInfo.locations = dataLoader.getLocationsByItem(item.id);
                break;
        }

        return relatedInfo;
    }

    createDetailView(item, type, relatedInfo) {
        if (!item) return '';

        const imageUrl = item.image || 'images/placeholder.jpg';
        const name = item.name || 'Sin nombre';
        const category = item.category || 'Sin categoría';
        const description = item.description || 'Sin descripción';
        const history = item.history || '';

        // Generar estadísticas si existen
        let statsHTML = '';
        if (item.stats && Object.keys(item.stats).length > 0) {
            statsHTML = `
            <div class="attributes">
                ${Object.entries(item.stats).map(([key, value]) => `
                    <div class="attribute">
                        <h4>${this.formatKey(key)}</h4>
                        <p>${value || 'N/A'}</p>
                    </div>
                `).join('')}
            </div>
        `;
        }

        // Generar secciones de relaciones
        let relatedSections = '';
        const sections = [
            {
                title: 'Personajes Relacionados',
                items: relatedInfo.characters,
                type: 'characters',
                show: relatedInfo.characters.length > 0 && type !== 'characters'
            },
            {
                title: 'Lugares Relacionados',
                items: relatedInfo.locations,
                type: 'locations',
                show: relatedInfo.locations.length > 0 && type !== 'locations'
            },
            {
                title: 'Objetos Relacionados',
                items: relatedInfo.items,
                type: 'items',
                show: relatedInfo.items.length > 0 && type !== 'items'
            }
        ];

        sections.forEach(section => {
            if (section.show) {
                relatedSections += `
                <div class="related-section">
                    <h3>${section.title}</h3>
                    <div class="related-grid">
                        ${section.items.map(relItem => this.createRelatedCard(relItem, section.type)).join('')}
                    </div>
                </div>
            `;
            }
        });

        // Historia
        let historyHTML = '';
        if (history) {
            historyHTML = `
            <div class="history-section">
                <h3>Historia</h3>
                <div class="history-content">${history}</div>
            </div>
        `;
        }

        return `
        <div class="detail-header">
            <button class="close-detail">×</button>
            <div class="detail-main">
                <div class="detail-image-container">
                    <img src="${imageUrl}" alt="${name}" class="detail-image"
                         onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="detail-info">
                    <span class="detail-category">${category}</span>
                    <h2>${name}</h2>
                    <div class="detail-description">${description}</div>
                    ${statsHTML}
                </div>
            </div>
        </div>
        ${relatedSections}
        ${historyHTML}
    `;
    }

    createRelatedCard(item, type) {
        if (!item) return '';

        const imageUrl = item.image || 'images/placeholder.jpg';
        const name = item.name || 'Sin nombre';

        return `
        <div class="related-card" data-id="${item.id}" data-type="${type}">
            <img src="${imageUrl}" alt="${name}" class="related-card-image"
                 onerror="this.src='images/placeholder.jpg'">
            <div class="related-card-name">${name}</div>
        </div>
    `;
    }

    closeDetailView() {
        const detailView = document.getElementById('detail-view');
        if (detailView) {
            detailView.classList.remove('active');
            this.currentDetail = null;
        }
    }

    showNoContentMessage() {
        const grid = document.getElementById('content-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="no-content" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h3>No hay contenido disponible</h3>
                    <p>Agrega elementos editando los archivos JSON en la carpeta /data</p>
                </div>
            `;
        }
    }

    showAboutSection() {
        const grid = document.getElementById('content-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="about-content" style="grid-column: 1 / -1; padding: 2rem;">
                <h2>Acerca de este proyecto</h2>
                <p>Este es un archivo personal para organizar y mostrar personajes, lugares e historias de tu universo creativo.</p>
                
                <h3>¿Cómo agregar contenido?</h3>
                <ol>
                    <li>Edita los archivos JSON en la carpeta /data</li>
                    <li>Agrega imágenes a las carpetas correspondientes en /images/</li>
                    <li>Actualiza las referencias en los archivos JSON</li>
                </ol>
                
                <h3>Estructura de datos</h3>
                <ul>
                    <li><strong>characters.json</strong>: Personajes con sus historias y estadísticas</li>
                    <li><strong>locations.json</strong>: Lugares del universo</li>
                    <li><strong>items.json</strong>: Objetos y artefactos</li>
                    <li><strong>categories.json</strong>: Sistema de categorías</li>
                </ul>
            </div>
        `;

        const categoryFilters = document.getElementById('category-filters');
        if (categoryFilters) {
            categoryFilters.innerHTML = '<p>No hay filtros para esta sección</p>';
        }

        this.closeDetailView();
    }

    performSearch() {
        const query = document.getElementById('search-input').value;
        if (!query || query.trim() === '') {
            this.loadSectionContent(this.currentSection);
            return;
        }

        const results = dataLoader.search(query);

        // Mostrar resultados en una vista especial
        this.showSearchResults(results, query);
    }

    showSearchResults(results, query) {
        const grid = document.getElementById('content-grid');
        if (!grid) return;

        let allResults = [
            ...results.characters.map(c => ({...c, type: 'characters'})),
            ...results.locations.map(l => ({...l, type: 'locations'})),
            ...results.items.map(i => ({...i, type: 'items'}))
        ];

        if (allResults.length === 0) {
            grid.innerHTML = `<div class="no-results">No se encontraron resultados para "${query}"</div>`;
            return;
        }

        grid.innerHTML = `
            <div class="search-header" style="grid-column: 1 / -1; margin-bottom: 1rem;">
                <h3>Resultados para: "${query}" (${allResults.length} encontrados)</h3>
            </div>
            ${allResults.map(item => this.createCard(item, item.type)).join('')}
        `;

        // Añadir event listeners a las tarjetas de resultados
        grid.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const type = card.dataset.type;
                this.showDetail(id, type);
            });
        });
    }

    formatKey(key) {
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new NavigationManager();
    // Iniciar con la sección de personajes
    navigation.switchSection('characters');
});