import { reactive } from 'vue'
import rawEn from './en.js'
import rawCn from './cn.js'
import rawBm from './bm.js'

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'cn', label: '简体中文' },
    { code: 'bm', label: 'Bahasa Melayu' },
]

function flatten(value, prefix = '', output = {}) {
    Object.entries(value || {}).forEach(([key, entry]) => {
        const path = prefix ? `${prefix}.${key}` : key
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) flatten(entry, path, output)
        else output[path] = entry
    })
    return output
}

const flattened = { en: flatten(rawEn), cn: flatten(rawCn), bm: flatten(rawBm) }
export const messages = { en: {}, cn: {}, bm: {} }

Object.entries(flattened.en).forEach(([path, english]) => {
    if (typeof english !== 'string' || !english.trim()) return
    messages.en[english] = english
    messages.cn[english] = typeof flattened.cn[path] === 'string' ? flattened.cn[path] : english
    messages.bm[english] = typeof flattened.bm[path] === 'string' ? flattened.bm[path] : english
})

function lookupKey(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([*:])$/, '')
        .trim()
        .toLocaleLowerCase('en')
}

const normalizedMessages = { en: new Map(), cn: new Map(), bm: new Map() }
Object.keys(messages.en).forEach((english) => {
    const key = lookupKey(english)
    if (!key) return
    ;['en', 'cn', 'bm'].forEach((code) => {
        const candidate = messages[code][english] || english
        const current = normalizedMessages[code].get(key)
        if (!current || (lookupKey(current) === key && lookupKey(candidate) !== key)) normalizedMessages[code].set(key, candidate)
    })
})
const businessNames = new Map()

function storedLanguage() {
    const value = localStorage.getItem('inventory-language') || localStorage.getItem('shop-language') || 'en'
    return ['en', 'cn', 'bm'].includes(value) ? value : 'en'
}

export const languageState = reactive({ code: storedLanguage() })

export function setLanguage(code) {
    if (!messages[code]) return
    languageState.code = code
    localStorage.setItem('inventory-language', code)
    localStorage.setItem('shop-language', code)
    document.documentElement.lang = code === 'cn' ? 'zh-CN' : code === 'bm' ? 'ms' : 'en'
    window.dispatchEvent(new CustomEvent('inventory-language:changed', { detail: code }))
}

export function t(source) {
    const text = String(source ?? '')
    const direct = messages[languageState.code][text]
    const normalized = normalizedMessages[languageState.code].get(lookupKey(text))
    const translated = languageState.code === 'en'
        ? direct || normalized || text
        : direct && direct !== text
            ? direct
            : normalized || direct || text
    const suffix = text.match(/\s*([*:])$/)?.[0] || ''
    return translated === text || !suffix || translated.endsWith(suffix.trim()) ? translated : `${translated}${suffix}`
}

export function localizedValue(value, fallback = '') {
    if (value == null) return fallback
    if (typeof value === 'string') return value || fallback
    return value[languageState.code] || value.en || fallback
}

export function localizedFields(enValue = '', cnValue = '', bmValue = '') {
    const english = String(enValue || '').trim()
    return { en: english, cn: String(cnValue || '').trim() || english, bm: String(bmValue || '').trim() || english }
}

export function registerLocalizedFields(value) {
    if (!value || typeof value !== 'object') return
    const english = String(value.en || '').trim()
    if (!english) return
    const normalized = localizedFields(english, value.cn, value.bm)
    businessNames.set(english, normalized)
    messages.en[english] = normalized.en
    messages.cn[english] = normalized.cn
    messages.bm[english] = normalized.bm
    normalizedMessages.en.set(lookupKey(english), normalized.en)
    normalizedMessages.cn.set(lookupKey(english), normalized.cn)
    normalizedMessages.bm.set(lookupKey(english), normalized.bm)
}

export function registerLocalizedEntities(state) {
    ;['products', 'suppliers', 'warehouses', 'staff'].forEach((collection) => {
        ;(state?.[collection] || []).forEach((record) => {
            registerLocalizedFields(record.nameTranslations || record.nameI18n)
            ;(record.locations || []).forEach((location) => registerLocalizedFields(location.nameTranslations || location.nameI18n))
        })
    })
}

export function translateVisibleText(value) {
    const source = String(value ?? '')
    const exact = t(source)
    if (exact !== source) return exact
    let output = source
    businessNames.forEach((translations, english) => {
        output = output.replaceAll(english, translations[languageState.code] || translations.en)
    })
    return output
}

export default {
    install(app) {
        document.documentElement.lang = languageState.code === 'cn' ? 'zh-CN' : languageState.code === 'bm' ? 'ms' : 'en'
        app.config.globalProperties.$t = t
        app.config.globalProperties.$language = languageState
        app.config.globalProperties.$setLanguage = setLanguage
        app.config.globalProperties.$localized = localizedValue
    },
}
