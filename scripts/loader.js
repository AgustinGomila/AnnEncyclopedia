// INSTANCIA GLOBAL PRIMERO
const dataLoader = new DataLoader();

// FUNCIÓN CONSTRUCTORA
function DataLoader() {
    this.data = {
        characters: [],
        locations: [],
        items: [],
        books: [],
        categories: {}
    };
    this.loaded = false;
}

// TODOS LOS MÉTODOS NECESARIOS

DataLoader.prototype.loadAllData = async function () {
    try {
        console.log('📡 Cargando JSONs...');

        const [characters, locations, items, books, categories] = await Promise.all([
            fetch('data/characters.json').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('data/locations.json').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('data/items.json').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('data/books.json').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('data/categories.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))
        ]);

        this.data = {characters, locations, items, books, categories};
        this.loaded = true;

        console.log('✅ Datos cargados:', {
            personajes: characters.length,
            lugares: locations.length,
            objetos: items.length,
            libros: books.length
        });

        return true;
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        return false;
    }
};

DataLoader.prototype.updateStats = function () {
    const stats = document.getElementById('stats-display');
    if (stats) {
        stats.innerHTML = `
            <p>👥 Personajes: ${this.data.characters.length}</p>
            <p>📍 Lugares: ${this.data.locations.length}</p>
            <p>🎁 Objetos: ${this.data.items.length}</p>
            <p>📚 Libros: ${this.data.books.length}</p>
            <p>🏷️ Categorías: ${Object.keys(this.data.categories).length}</p>
        `;
    }
};

// MÉTODO DE BÚSQUEDA
DataLoader.prototype.search = function (query) {
    const q = query.toLowerCase().trim();
    return {
        characters: this.data.characters.filter(char =>
            char.name?.toLowerCase().includes(q) ||
            char.description?.toLowerCase().includes(q) ||
            char.category?.toLowerCase().includes(q) ||
            char.history?.toLowerCase().includes(q)
        ),
        locations: this.data.locations.filter(loc =>
            loc.name?.toLowerCase().includes(q) ||
            loc.description?.toLowerCase().includes(q) ||
            loc.history?.toLowerCase().includes(q)
        ),
        items: this.data.items.filter(item =>
            item.name?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
        ),
        books: this.data.books.filter(book =>
            book.name?.toLowerCase().includes(q) ||
            book.description?.toLowerCase().includes(q)
        )
    };
};

// MÉTODOS DE OBTENCIÓN POR ID
DataLoader.prototype.getCharacter = function (id) {
    return this.data.characters.find(c => c?.id === id);
};

DataLoader.prototype.getLocation = function (id) {
    return this.data.locations.find(l => l?.id === id);
};

DataLoader.prototype.getItem = function (id) {
    return this.data.items.find(i => i?.id === id);
};

// MÉTODOS DE RELACIONES
DataLoader.prototype.getBook = function (id) {
    return this.data.books.find(b => b?.id === id);
};

DataLoader.prototype.getCharactersByLocation = function (locationId) {
    return this.data.characters.filter(char => char.relatedLocations?.includes(locationId));
};

DataLoader.prototype.getItemsByLocation = function (locationId) {
    return this.data.items.filter(item => item.relatedLocations?.includes(locationId));
};

DataLoader.prototype.getCharactersByItem = function (itemId) {
    return this.data.characters.filter(char => char.relatedItems?.includes(itemId));
};

DataLoader.prototype.getLocationsByItem = function (itemId) {
    return this.data.locations.filter(loc => loc.relatedItems?.includes(itemId));
};

// MÉTODOS DE FILTRADO
DataLoader.prototype.getBooksByEntity = function (entityType, entityId) {
    return this.data.books.filter(book => {
        const relatedArray = book[`related${entityType.charAt(0).toUpperCase()}${entityType.slice(1)}`];
        return relatedArray?.includes(entityId);
    });
};

DataLoader.prototype.filterByCategory = function (type, category) {
    return this.data[type]?.filter(item => item?.category === category) || [];
};

DataLoader.prototype.getAllCategories = function (type) {
    return [...new Set(this.data[type]?.map(item => item?.category).filter(Boolean))] || [];
};

DataLoader.prototype.isValidType = function (type) {
    return ['characters', 'locations', 'items', 'books'].includes(type);
};