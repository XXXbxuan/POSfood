import { languageState, messages, t } from './index.js'

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label']
const ignoredTags = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA'])
const ignoredNameSelector = [
    '.voucher-code strong',
    '.staff-list-identity strong',
    '.topbar-current-member strong',
    '.topbar-member-results strong',
    '.member-name',
    '.profile-name',
    '.simple-menu-card h3',
    '.product-card h3',
    '.product-name',
    '.kitchen-ticket-dish-copy strong',
    '.kitchen-detail-title',
    '.receipt-item-name',
    '[data-product-name]',
    '[data-member-name]',
    '[data-staff-name]',
].join(',')
const textState = new WeakMap()
const attributeState = new WeakMap()
let observer = null
let translating = false
let scheduled = false

function flatten(object, prefix = '', output = {}) {
    Object.entries(object || {}).forEach(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value))
            flatten(value, path, output)
        else output[path] = String(value)
    })
    return output
}

const flattened = Object.fromEntries(
    Object.entries(messages).map(([code, content]) => [code, flatten(content)]),
)

const exactKeyMaps = {}
const englishLowerKeyMap = new Map()
Object.entries(flattened).forEach(([code, values]) => {
    const map = new Map()
    Object.entries(values).forEach(([key, value]) => {
        const normalized = normalize(value)
        if (normalized && !map.has(normalized)) map.set(normalized, key)
    })
    exactKeyMaps[code] = map
    if (code === 'en') {
        map.forEach((key, value) => {
            const lower = value.toLowerCase()
            if (!englishLowerKeyMap.has(lower)) englishLowerKeyMap.set(lower, key)
        })
    }
})

function normalize(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
}

function preserveWhitespace(original, translated) {
    const leading = original.match(/^\s*/)?.[0] || ''
    const trailing = original.match(/\s*$/)?.[0] || ''
    return `${leading}${translated}${trailing}`
}

function findExactKey(value) {
    const normalized = normalize(value)
    if (!normalized) return ''

    for (const code of ['en', 'cn', 'bm']) {
        const key = exactKeyMaps[code].get(normalized)
        if (key) return key
    }

    return englishLowerKeyMap.get(normalized.toLowerCase()) || ''
}

function translateDynamic(value) {
    const source = normalize(value)
    if (!source) return source

    let match = source.match(/^Page\s+(\d+)\s+of\s+(\d+)$/i)
    if (match)
        return t('auto.pageOf', { page: match[1], total: match[2] }, source)

    match = source.match(/^(\d+)\s+active vouchers$/i)
    if (match) return t('auto.voucherCount', { count: match[1] }, source)

    match = source.match(/^(\d+)\s+set dishes$/i)
    if (match) return t('auto.setDishCount', { count: match[1] }, source)

    match = source.match(/^(\d+)\s+dishes$/i)
    if (match) return t('auto.dishCount', { count: match[1] }, source)

    match = source.match(/^(\d+)\s+items$/i)
    if (match) return t('auto.itemCount', { count: match[1] }, source)

    match = source.match(/^Table\s+(.+)$/i)
    if (match) return t('auto.tableWithNumber', { number: match[1] }, source)

    match = source.match(/^Completed\s+(.+)$/i)
    if (match) return t('auto.completedTime', { time: match[1] }, source)

    match = source.match(/^Last login:\s*(.+)$/i)
    if (match) return `${t('auto.lastLogin')}: ${match[1]}`

    match = source.match(/^(\d+)\s+min$/i)
    if (match) return t('auto.minutesAgo', { count: match[1] }, source)

    match = source.match(/^(\d+)h\s+(\d+)m$/i)
    if (match)
        return t(
            'auto.hoursMinutes',
            { hours: match[1], minutes: match[2] },
            source,
        )

    match = source.match(/^RECEIPT\s+(\d+)\s+OF\s+(\d+)$/i)
    if (match)
        return t('auto.receiptOf', { page: match[1], total: match[2] }, source)

    match = source.match(/^(Dine In|Takeaway)\s*·\s*(.+)$/i)
    if (match) {
        const type = match[1].toLowerCase() === 'takeaway'
            ? t('topbar.takeaway')
            : t('topbar.dineIn')
        return `${type} · ${match[2]}`
    }

    match = source.match(/^No\s+(.+)\s+orders$/i)
    if (match)
        return t('auto.noStatusOrders', {
            status: translateText(match[1]),
        }, source)

    match = source.match(/^Voucher is (.+)\.$/i)
    if (match)
        return t('auto.voucherIsStatus', { status: translateText(match[1]) }, source)

    match = source.match(/^Only valid for (.+)\.$/i)
    if (match)
        return t('auto.onlyValidFor', { services: translateText(match[1]) }, source)

    match = source.match(/^Minimum eligible spend is RM ([0-9.]+)\.$/i)
    if (match)
        return t('auto.minimumEligibleSpend', { amount: match[1] }, source)

    match = source.match(/^(.+) has an unpaid order\.$/i)
    if (match) return t('auto.tableHasUnpaid', { table: match[1] }, source)

    match = source.match(/^(.+) position was saved\.$/i)
    if (match) return t('auto.positionSaved', { name: match[1] }, source)

    match = source.match(/^(.+) category was added\.$/i)
    if (match) return t('auto.categoryAdded', { name: match[1] }, source)

    match = source.match(/^(.+) category was deleted\.$/i)
    if (match) return t('auto.categoryDeleted', { name: match[1] }, source)

    match = source.match(/^(.+) options were updated\.$/i)
    if (match) return t('auto.optionsUpdated', { name: match[1] }, source)

    match = source.match(/^(.+) was added successfully\.$/i)
    if (match) return t('auto.tableAdded', { table: match[1] }, source)

    match = source.match(/^(.+) is available again\.$/i)
    if (match) return t('auto.tableAvailableAgain', { table: match[1] }, source)

    match = source.match(/^(.+) is marked as service\.$/i)
    if (match) return t('auto.tableMarkedService', { table: match[1] }, source)

    match = source.match(/^(.+) was added\.$/i)
    if (match) return t('auto.itemAdded', { name: match[1] }, source)

    match = source.match(/^(.+) was deleted\.$/i)
    if (match) return t('auto.itemDeleted', { name: match[1] }, source)

    match = source.match(/^(.+) was saved\.$/i)
    if (match) return t('auto.itemSaved', { name: match[1] }, source)

    match = source.match(/^(.+) was updated\.$/i)
    if (match) return t('auto.itemUpdated', { name: match[1] }, source)

    match = source.match(/^Selection (\d+)$/i)
    if (match) return t('auto.selectionNumber', { number: match[1] }, source)

    match = source.match(/^(\d+) reworks?$/i)
    if (match)
        return Number(match[1]) === 1
            ? t('auto.oneRework')
            : t('auto.redoCount', { count: match[1] }, source)

    match = source.match(/^(\d+) Pax$/i)
    if (match) return t('auto.paxCount', { count: match[1] }, source)

    match = source.match(/^(\d+) pts$/i)
    if (match) return t('auto.pointsCount', { count: match[1] }, source)

    return source
}

export function translateText(value) {
    const original = String(value ?? '')
    const normalized = normalize(original)
    if (!normalized || languageState.code === 'en') return original

    const key = findExactKey(normalized)
    const translated = key ? t(key, normalized) : translateDynamic(normalized)
    return preserveWhitespace(original, translated)
}

function shouldIgnore(element) {
    if (!element || ignoredTags.has(element.tagName)) return true
    if (element.closest('[data-i18n-ignore="true"]')) return true
    if (element.matches?.(ignoredNameSelector)) return true
    return false
}

function translateTextNode(node) {
    const parent = node.parentElement
    if (!parent || shouldIgnore(parent)) return

    const current = node.nodeValue || ''
    if (!normalize(current)) return

    let state = textState.get(node)
    if (!state) {
        state = { source: current, lastRendered: current }
        textState.set(node, state)
    } else if (current !== state.lastRendered) {
        const exactKey = findExactKey(current)
        state.source = exactKey
            ? flattened.en[exactKey] || current
            : current
    }

    const next = translateText(state.source)
    state.lastRendered = next
    if (current !== next) node.nodeValue = next
}

function translateAttributes(element) {
    if (shouldIgnore(element)) return

    let states = attributeState.get(element)
    if (!states) {
        states = {}
        attributeState.set(element, states)
    }

    TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return
        const current = element.getAttribute(attribute) || ''
        if (!normalize(current)) return

        let state = states[attribute]
        if (!state) {
            state = { source: current, lastRendered: current }
            states[attribute] = state
        } else if (current !== state.lastRendered) {
            const exactKey = findExactKey(current)
            state.source = exactKey
                ? flattened.en[exactKey] || current
                : current
        }

        const next = translateText(state.source)
        state.lastRendered = next
        if (current !== next) element.setAttribute(attribute, next)
    })
}

function translateTree(root = document.body) {
    if (!root) return
    translating = true

    if (root.nodeType === Node.TEXT_NODE) translateTextNode(root)
    else if (root.nodeType === Node.ELEMENT_NODE) {
        translateAttributes(root)
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        )
        let node = walker.nextNode()
        while (node) {
            if (node.nodeType === Node.TEXT_NODE) translateTextNode(node)
            else translateAttributes(node)
            node = walker.nextNode()
        }
    }

    translating = false
}

function scheduleTranslation() {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
        scheduled = false
        translateTree(document.body)
    })
}

export function installAutoText() {
    if (observer) return

    translateTree(document.body)
    observer = new MutationObserver((mutations) => {
        if (translating) return
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData')
                translateTextNode(mutation.target)
            else if (mutation.type === 'attributes')
                translateAttributes(mutation.target)
            else
                mutation.addedNodes.forEach((node) => {
                    if (
                        node.nodeType === Node.ELEMENT_NODE ||
                        node.nodeType === Node.TEXT_NODE
                    ) translateTree(node)
                })
        })
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: TRANSLATABLE_ATTRIBUTES,
    })

    window.addEventListener('pos-language:changed', scheduleTranslation)
}
