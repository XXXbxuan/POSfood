import {
    menuCategories,
    menuProducts,
} from '@/data/menuCatalog.js'
import { safeMenuPrice, validMenuPrice } from '@/utils/money.js'

const MENU_CATALOG_STORAGE_KEY = 'posfood_menu_catalog'

function cloneCatalog(categories, products) {
    return JSON.parse(JSON.stringify({ categories, products }))
}

function repairCatalogPrices(categories, products) {
    const productById = new Map(products.map((product) => [product.id, product]))
    let changed = false
    const repairedProducts = products.map((product) => {
        if (validMenuPrice(product.price)) return product
        let fallback = 0
        if (product.type === 'set') {
            fallback = (product.setItems || []).reduce((total, item) => {
                const included = productById.get(item.productId)
                return (
                    total +
                    safeMenuPrice(included?.price) *
                        Math.max(1, Number(item.quantity) || 1)
                )
            }, 0)
        }
        changed = true
        return {
            ...product,
            price: Number(safeMenuPrice(fallback).toFixed(2)),
        }
    })
    return { categories, products: repairedProducts, changed }
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
            const catalog = cloneCatalog(stored.categories, stored.products)
            const repaired = repairCatalogPrices(
                catalog.categories,
                catalog.products,
            )
            if (repaired.changed)
                localStorage.setItem(
                    MENU_CATALOG_STORAGE_KEY,
                    JSON.stringify({
                        categories: repaired.categories,
                        products: repaired.products,
                    }),
                )
            return cloneCatalog(repaired.categories, repaired.products)
        }
    } catch (error) {
        console.warn('Unable to read the saved menu catalog.', error)
    }

    const repaired = repairCatalogPrices(menuCategories, menuProducts)
    return cloneCatalog(repaired.categories, repaired.products)
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
