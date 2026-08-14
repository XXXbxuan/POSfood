import { messages, t, translateVisibleText } from './index.js'

const ATTRIBUTES = ['placeholder', 'title', 'aria-label']
const SKIP = 'script,style,code,pre,textarea,[data-i18n-ignore="true"],.supplier-name,.warehouse-name,.location-name,.staff-name,.user-content'
const states = new WeakMap()
const attributeStates = new WeakMap()
let observer
let applying = false

function normalized(value) { return String(value || '').replace(/\s+/g, ' ').trim() }

function englishSource(value) {
    const text = normalized(value)
    if (!text) return ''
    if (Object.prototype.hasOwnProperty.call(messages.en, text)) return text
    for (const locale of ['cn', 'bm']) {
        const match = Object.keys(messages[locale]).find((key) => messages[locale][key] === text)
        if (match) return match
    }
    return text
}

function ignored(element) { return !element || Boolean(element.closest?.(SKIP)) }

function translateNode(node) {
    if (!node?.parentElement || ignored(node.parentElement)) return
    const current = node.nodeValue || ''
    if (!normalized(current)) return
    let state = states.get(node)
    if (!state) {
        state = { source: englishSource(current), rendered: current }
        states.set(node, state)
    } else if (current !== state.rendered) state.source = englishSource(current)
    const leading = current.match(/^\s*/)?.[0] || ''
    const trailing = current.match(/\s*$/)?.[0] || ''
    const next = `${leading}${translateVisibleText(state.source)}${trailing}`
    state.rendered = next
    if (current !== next) node.nodeValue = next
}

function translateAttributes(element) {
    if (ignored(element)) return
    let state = attributeStates.get(element)
    if (!state) { state = {}; attributeStates.set(element, state) }
    ATTRIBUTES.forEach((attribute) => {
        if (!element.hasAttribute?.(attribute)) return
        const current = element.getAttribute(attribute) || ''
        if (!normalized(current)) return
        if (!state[attribute]) state[attribute] = { source: englishSource(current), rendered: current }
        else if (current !== state[attribute].rendered) state[attribute].source = englishSource(current)
        const next = translateVisibleText(state[attribute].source)
        state[attribute].rendered = next
        if (current !== next) element.setAttribute(attribute, next)
    })
}

function translateTree(root = document.body) {
    if (!root) return
    applying = true
    if (root.nodeType === Node.TEXT_NODE) translateNode(root)
    else if (root.nodeType === Node.ELEMENT_NODE) {
        translateAttributes(root)
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
            if (walker.currentNode.nodeType === Node.TEXT_NODE) translateNode(walker.currentNode)
            else translateAttributes(walker.currentNode)
        }
    }
    applying = false
}

export function installAutoText() {
    translateTree()
    observer = new MutationObserver((mutations) => {
        if (applying) return
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData') translateNode(mutation.target)
            else if (mutation.type === 'attributes') translateAttributes(mutation.target)
            else mutation.addedNodes.forEach((node) => translateTree(node))
        })
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES })
    window.addEventListener('inventory-language:changed', () => requestAnimationFrame(() => translateTree()))
}
