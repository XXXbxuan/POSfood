import { reactive } from 'vue'
import en from './en.json'
import cn from './cn.json'
import bm from './bm.json'
import {
    getCurrentShopLanguage,
    normalizeI18nLanguage,
    setCurrentShopLanguage,
} from '@/system/engine/shopLanguage.js'

// Same locale names and folder convention as the Shop Demo.
export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'cn', label: '简体中文' },
    { code: 'bm', label: 'Bahasa Melayu' },
]

// The legacy aliases keep previously saved POS menu data compatible.
export const messages = { en, cn, bm, 'zh-CN': cn, ms: bm }

export const languageState = reactive({
    code: getCurrentShopLanguage(),
})

function interpolate(value, params = {}) {
    return String(value).replace(/\{([\w]+)\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match,
    )
}

export function setLanguage(code) {
    const locale = normalizeI18nLanguage(code)
    if (!['en', 'cn', 'bm'].includes(locale)) return
    languageState.code = setCurrentShopLanguage(locale)
    window.dispatchEvent(
        new CustomEvent('pos-language:changed', { detail: languageState.code }),
    )
}

export function t(key, paramsOrFallback = {}, fallback = key) {
    let params = paramsOrFallback
    let resolvedFallback = fallback

    if (typeof paramsOrFallback === 'string') {
        params = {}
        resolvedFallback = paramsOrFallback
    }

    const selected = key
        .split('.')
        .reduce((result, part) => result?.[part], messages[languageState.code])
    const english = key
        .split('.')
        .reduce((result, part) => result?.[part], messages.en)
    return interpolate(selected ?? english ?? resolvedFallback, params)
}

export function localizedName(value, fallback = '') {
    if (!value) return fallback
    if (typeof value === 'string') return value
    const aliases = {
        cn: ['cn', 'zh-CN'],
        bm: ['bm', 'ms'],
    }
    const candidates = aliases[languageState.code] || [languageState.code]
    return candidates.map((key) => value[key]).find(Boolean) || value.en || fallback
}

export function makeLocalizedName(value = '') {
    return { en: value, cn: '', bm: '' }
}

export default {
    install(app) {
        document.documentElement.lang = languageState.code
        app.config.globalProperties.$t = t
        app.config.globalProperties.$language = languageState
        app.config.globalProperties.$setLanguage = setLanguage
    },
}
