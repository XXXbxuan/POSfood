const SUPPORTED_LOCALES = new Set(['en', 'cn', 'bm', 'zh-cn', 'ms', 'my'])
const LANGUAGE_STORAGE_KEY = 'posfood_language'

export function normalizeI18nLanguage(language) {
    const value = String(language || '').toLowerCase()
    if (value === 'zh-cn') return 'cn'
    if (value === 'ms' || value === 'my') return 'bm'
    return SUPPORTED_LOCALES.has(value) ? value : 'en'
}

export function normalizeShopLocale(language) {
    const locale = normalizeI18nLanguage(language)
    return ['en', 'cn', 'bm'].includes(locale) ? locale : 'en'
}

export function getCurrentShopLanguage() {
    try {
        return normalizeShopLocale(localStorage.getItem(LANGUAGE_STORAGE_KEY))
    } catch (error) {
        return 'en'
    }
}

export function setCurrentShopLanguage(language) {
    const nextLanguage = normalizeShopLocale(language)
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    } catch (error) {}
    document.documentElement.lang = nextLanguage
    window.dispatchEvent(
        new CustomEvent('shop-language-changed', { detail: nextLanguage }),
    )
    return nextLanguage
}
