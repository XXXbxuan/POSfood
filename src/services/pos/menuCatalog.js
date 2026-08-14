import {
    menuCategories,
    menuProducts,
} from '@/data/menuCatalog.js'
import { safeMenuPrice, validMenuPrice } from '@/utils/money.js'

const MENU_CATALOG_STORAGE_KEY = 'posfood_menu_catalog'

function ensureLocalizedFields(products) {
    return products.map((product) => ({
        ...product,
        nameMode: product.nameMode || 'single',
        nameTranslations: {
            en: product.nameTranslations?.en || product.name || '',
            cn:
                product.nameTranslations?.cn ||
                product.nameTranslations?.['zh-CN'] ||
                '',
            bm: product.nameTranslations?.bm || product.nameTranslations?.ms || '',
        },
        modifierGroups: (product.modifierGroups || []).map((group) => ({
            ...group,
            nameMode: group.nameMode || 'single',
            nameTranslations: {
                en: group.nameTranslations?.en || group.name || '',
                cn:
                    group.nameTranslations?.cn ||
                    group.nameTranslations?.['zh-CN'] ||
                    '',
                bm: group.nameTranslations?.bm || group.nameTranslations?.ms || '',
            },
        })),
    }))
}

function ensureCategoryTranslations(categories, translations = {}) {
    return Object.fromEntries(
        categories.map((category) => [
            category,
            {
                en: translations[category]?.en || category,
                cn:
                    translations[category]?.cn ||
                    translations[category]?.['zh-CN'] ||
                    '',
                bm:
                    translations[category]?.bm ||
                    translations[category]?.ms ||
                    '',
            },
        ]),
    )
}

function cloneCatalog(categories, products, categoryTranslations = {}) {
    return JSON.parse(
        JSON.stringify({
            categories,
            products,
            categoryTranslations: ensureCategoryTranslations(
                categories,
                categoryTranslations,
            ),
        }),
    )
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
            const catalog = cloneCatalog(
                stored.categories,
                ensureLocalizedFields(stored.products),
                stored.categoryTranslations,
            )
            const repaired = repairCatalogPrices(
                catalog.categories,
                catalog.products,
            )
            if (repaired.changed)
                localStorage.setItem(
                    MENU_CATALOG_STORAGE_KEY,
                    JSON.stringify({
                        ...cloneCatalog(
                            repaired.categories,
                            repaired.products,
                            catalog.categoryTranslations,
                        ),
                    }),
                )
            return cloneCatalog(
                repaired.categories,
                repaired.products,
                catalog.categoryTranslations,
            )
        }
    } catch (error) {
        console.warn('Unable to read the saved menu catalog.', error)
    }

    const repaired = repairCatalogPrices(menuCategories, menuProducts)
    return cloneCatalog(
        repaired.categories,
        ensureLocalizedFields(repaired.products),
    )
}

function saveMenuCatalog(categories, products, categoryTranslations) {
    let storedTranslations = categoryTranslations
    if (!storedTranslations) {
        try {
            storedTranslations = JSON.parse(
                localStorage.getItem(MENU_CATALOG_STORAGE_KEY),
            )?.categoryTranslations
        } catch (error) {
            console.warn('Unable to read saved category translations.', error)
        }
    }
    const catalog = cloneCatalog(categories, products, storedTranslations)
    localStorage.setItem(MENU_CATALOG_STORAGE_KEY, JSON.stringify(catalog))
    return catalog
}

export {
    MENU_CATALOG_STORAGE_KEY,
    loadMenuCatalog,
    saveMenuCatalog,
    ensureLocalizedFields,
}
