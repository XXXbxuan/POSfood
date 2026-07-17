import {
    menuCategories,
    menuProducts,
} from '@/data/menuCatalog.js'

const MENU_CATALOG_STORAGE_KEY = 'posfood_menu_catalog'

function cloneCatalog(categories, products) {
    return JSON.parse(JSON.stringify({ categories, products }))
}

function loadMenuCatalog() {
    try {
        const stored = JSON.parse(
            localStorage.getItem(MENU_CATALOG_STORAGE_KEY),
        )

        if (
            Array.isArray(stored?.categories) &&
            Array.isArray(stored?.products)
        ) {
            return cloneCatalog(stored.categories, stored.products)
        }
    } catch (error) {
        console.warn('Unable to read the saved menu catalog.', error)
    }

    return cloneCatalog(menuCategories, menuProducts)
}

function saveMenuCatalog(categories, products) {
    const catalog = cloneCatalog(categories, products)
    localStorage.setItem(MENU_CATALOG_STORAGE_KEY, JSON.stringify(catalog))
    return catalog
}

export {
    MENU_CATALOG_STORAGE_KEY,
    loadMenuCatalog,
    saveMenuCatalog,
}
