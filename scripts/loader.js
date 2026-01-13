class DataLoader {
    constructor() {
        this.data = {
            characters: [],
            locations: [],
            items: [],
            categories: {}
        };
    }

    async loadAllData() {
        try {
            const [characters, locations, items, categories] = await Promise.all([
                this.loadJSON('data/characters.json'),
                this.loadJSON('data/locations.json'),
                this.loadJSON('data/items.json'),
                this.loadJSON('data/categories.json')
            ]);

            this.data.characters = characters || [];
            this.data.locations = locations || [];
            this.data.items = items || [];
            this.data.categories = categories || {};

            this.updateStats();
            return this.data;

        } catch (error) {
            console.error('Error cargando datos:', error);
            return null;
        }
    }

    async loadJSON(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Error cargando ${filePath}: ${response.status}`);
            }
            const data = await response.json();
            return Array.isArray(data) || typeof data === 'object' ? data : null;
        } catch (error) {
            console.warn(`No se pudo cargar ${filePath}:`, error);
            return null;
        }
    }

    updateStats() {
        const stats = document.getElementById('stats-display');
        if (stats) {
            stats.innerHTML = `
                <p>👥 Personajes: ${this.data.characters?.length || 0}</p>
                <p>📍 Lugares: ${this.data.locations?.length || 0}</p>
                <p>🎁 Objetos: ${this.data.items?.length || 0}</p>
                <p>🏷️ Categorías: ${Object.keys(this.data.categories || {}).length}</p>
            `;
        }
    }

    search(query) {
        query = query.toLowerCase().trim();

        const results = {
            characters: (this.data.characters || []).filter(char =>
                    char && (
                        (char.name && char.name.toLowerCase().includes(query)) ||
                        (char.description && char.description.toLowerCase().includes(query)) ||
                        (char.category && char.category.toLowerCase().includes(query)) ||
                        (char.history && char.history.toLowerCase().includes(query))
                    )
            ),
            locations: (this.data.locations || []).filter(loc =>
                    loc && (
                        (loc.name && loc.name.toLowerCase().includes(query)) ||
                        (loc.description && loc.description.toLowerCase().includes(query)) ||
                        (loc.history && loc.history.toLowerCase().includes(query))
                    )
            ),
            items: (this.data.items || []).filter(item =>
                    item && (
                        (item.name && item.name.toLowerCase().includes(query)) ||
                        (item.description && item.description.toLowerCase().includes(query))
                    )
            )
        };

        return results;
    }

    getCharacter(id) {
        return (this.data.characters || []).find(char => char && char.id === id);
    }

    getLocation(id) {
        return (this.data.locations || []).find(loc => loc && loc.id === id);
    }

    getItem(id) {
        return (this.data.items || []).find(item => item && item.id === id);
    }

    // Métodos para obtener relaciones

    getCharactersByLocation(locationId) {
        return (this.data.characters || []).filter(char =>
            char && char.relatedLocations && char.relatedLocations.includes(locationId)
        );
    }

    getItemsByLocation(locationId) {
        return (this.data.items || []).filter(item =>
            item && item.relatedLocations && item.relatedLocations.includes(locationId)
        );
    }

    getCharactersByItem(itemId) {
        return (this.data.characters || []).filter(char =>
            char && char.relatedItems && char.relatedItems.includes(itemId)
        );
    }

    getLocationsByItem(itemId) {
        return (this.data.locations || []).filter(loc =>
            loc && loc.relatedItems && loc.relatedItems.includes(itemId)
        );
    }

    filterByCategory(type, category) {
        // Asegurarnos de que el tipo existe y es un array
        if (!this.data[type] || !Array.isArray(this.data[type])) {
            return [];
        }
        return this.data[type].filter(item => item && item.category === category);
    }

    getAllCategories(type) {
        // Asegurarnos de que el tipo existe y es un array
        if (!this.data[type] || !Array.isArray(this.data[type])) {
            return [];
        }

        const categories = new Set();
        this.data[type].forEach(item => {
            if (item && item.category) categories.add(item.category);
        });
        return Array.from(categories);
    }

    // Método auxiliar para verificar si un tipo es válido
    isValidType(type) {
        return ['characters', 'locations', 'items'].includes(type);
    }
}

// Instancia global
window.dataLoader = new DataLoader();