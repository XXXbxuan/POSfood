<template>
    <select
        ref="selectEl"
        v-bind="attrs"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-expanded="open ? 'true' : 'false'"
        :class="['scroll-select-native', { 'scroll-select-native--open': open }]"
        @pointerdown.prevent="toggleMenu"
        @keydown="handleKeydown"
    >
        <slot />
    </select>

    <Teleport to="body">
        <div
            v-if="open"
            ref="menuEl"
            class="scroll-select-menu"
            :class="{ 'scroll-select-menu--up': placement === 'up' }"
            :style="menuStyle"
            role="listbox"
            :aria-label="menuLabel"
            @pointerdown.stop
        >
            <button
                v-for="(option, index) in options"
                :key="option.key"
                type="button"
                class="scroll-select-option"
                :class="{
                    selected: isSelected(option.value),
                    active: index === activeIndex,
                    disabled: option.disabled
                }"
                :disabled="option.disabled"
                role="option"
                :aria-selected="isSelected(option.value) ? 'true' : 'false'"
                @mouseenter="activeIndex = option.disabled ? activeIndex : index"
                @click="chooseOption(option, index)"
            >
                <span>{{ option.label }}</span>
                <i v-if="isSelected(option.value)" class="fa-solid fa-check" aria-hidden="true"></i>
            </button>
        </div>
    </Teleport>
</template>

<script setup>
import { Fragment, Text, Comment, computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useSlots, watch } from 'vue'

const props = defineProps({
    modelValue: { default: '' },
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])
const attrs = useAttrs()
const slots = useSlots()
const selectEl = ref(null)
const menuEl = ref(null)
const open = ref(false)
const activeIndex = ref(-1)
const placement = ref('down')
const menuStyle = ref({})
let resizeObserver = null

function textFromVNode(node) {
    if (node == null) return ''
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(textFromVNode).join('')
    if (node.type === Text) return String(node.children || '')
    if (node.type === Comment) return ''
    return textFromVNode(node.children)
}

function flattenOptions(nodes, result = []) {
    for (const node of nodes || []) {
        if (!node) continue
        if (Array.isArray(node)) {
            flattenOptions(node, result)
            continue
        }
        if (node.type === Fragment) {
            flattenOptions(node.children, result)
            continue
        }
        if (node.type === 'option') {
            const label = textFromVNode(node.children).replace(/\s+/g, ' ').trim()
            const rawValue = node.props && Object.prototype.hasOwnProperty.call(node.props, 'value')
                ? node.props.value
                : label
            result.push({
                key: node.key ?? `${result.length}-${String(rawValue)}`,
                value: rawValue,
                label,
                disabled: Boolean(node.props?.disabled)
            })
            continue
        }
        if (Array.isArray(node.children)) flattenOptions(node.children, result)
    }
    return result
}

const options = computed(() => flattenOptions(slots.default?.() || []))
const menuLabel = computed(() => String(attrs['aria-label'] || 'Options'))

function sameValue(a, b) {
    if (Object.is(a, b)) return true
    if (a == null || b == null) return a === b
    if (typeof a === 'object' || typeof b === 'object') return false
    return String(a) === String(b)
}

function isSelected(value) {
    return sameValue(value, props.modelValue)
}

function firstEnabledIndex() {
    return options.value.findIndex(option => !option.disabled)
}

function selectedIndex() {
    return options.value.findIndex(option => !option.disabled && isSelected(option.value))
}

function setInitialActive() {
    const selected = selectedIndex()
    activeIndex.value = selected >= 0 ? selected : firstEnabledIndex()
}

function reposition() {
    if (!open.value || !selectEl.value) return
    const rect = selectEl.value.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.top > window.innerHeight) {
        closeMenu()
        return
    }

    const margin = 8
    const gap = 6
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth
    const below = Math.max(0, viewportHeight - rect.bottom - margin - gap)
    const above = Math.max(0, rect.top - margin - gap)
    const desired = Math.min(320, Math.max(144, options.value.length * 48 + 12))
    const useUp = below < Math.min(176, desired) && above > below
    placement.value = useUp ? 'up' : 'down'
    const available = Math.max(96, useUp ? above : below)
    const maxHeight = Math.min(desired, available)
    const left = Math.min(Math.max(margin, rect.left), Math.max(margin, viewportWidth - rect.width - margin))
    const top = useUp
        ? Math.max(margin, rect.top - gap - maxHeight)
        : Math.min(viewportHeight - margin - maxHeight, rect.bottom + gap)

    menuStyle.value = {
        position: 'fixed',
        left: `${Math.round(left)}px`,
        top: `${Math.round(top)}px`,
        width: `${Math.round(rect.width)}px`,
        maxHeight: `${Math.floor(maxHeight)}px`
    }
}

function scrollActiveIntoView() {
    nextTick(() => {
        const menu = menuEl.value
        if (!menu || activeIndex.value < 0) return
        const option = menu.children?.[activeIndex.value]
        option?.scrollIntoView?.({ block: 'nearest' })
    })
}

function openMenu() {
    if (props.disabled || open.value) return
    open.value = true
    setInitialActive()
    nextTick(() => {
        reposition()
        scrollActiveIntoView()
    })
}

function closeMenu() {
    if (!open.value) return
    open.value = false
}

function toggleMenu() {
    if (props.disabled) return
    selectEl.value?.focus?.({ preventScroll: true })
    if (open.value) closeMenu()
    else openMenu()
}

function chooseOption(option, index) {
    if (!option || option.disabled) return
    activeIndex.value = index
    if (!isSelected(option.value)) {
        emit('update:modelValue', option.value)
        emit('change', { target: { value: option.value } })
    }
    closeMenu()
    nextTick(() => selectEl.value?.focus?.({ preventScroll: true }))
}

function moveActive(direction) {
    if (!options.value.length) return
    let index = activeIndex.value
    for (let step = 0; step < options.value.length; step += 1) {
        index = (index + direction + options.value.length) % options.value.length
        if (!options.value[index]?.disabled) {
            activeIndex.value = index
            scrollActiveIntoView()
            return
        }
    }
}

function handleKeydown(event) {
    if (props.disabled) return
    if (!open.value) {
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault()
            openMenu()
            if (event.key === 'ArrowUp' && selectedIndex() < 0) {
                const last = [...options.value].map((option, index) => ({ option, index })).reverse().find(({ option }) => !option.disabled)
                if (last) activeIndex.value = last.index
            }
        }
        return
    }

    if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
    } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveActive(1)
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveActive(-1)
    } else if (event.key === 'Home') {
        event.preventDefault()
        activeIndex.value = firstEnabledIndex()
        scrollActiveIntoView()
    } else if (event.key === 'End') {
        event.preventDefault()
        for (let index = options.value.length - 1; index >= 0; index -= 1) {
            if (!options.value[index]?.disabled) {
                activeIndex.value = index
                scrollActiveIntoView()
                break
            }
        }
    } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        chooseOption(options.value[activeIndex.value], activeIndex.value)
    } else if (event.key === 'Tab') {
        closeMenu()
    }
}

function handleDocumentPointerDown(event) {
    if (!open.value) return
    if (event.target === selectEl.value || selectEl.value?.contains?.(event.target) || menuEl.value?.contains(event.target)) return
    closeMenu()
}

function handleViewportChange() {
    if (open.value) reposition()
}

watch(() => props.disabled, value => {
    if (value) closeMenu()
})

watch(options, () => {
    if (!open.value) return
    setInitialActive()
    nextTick(reposition)
})

onMounted(() => {
    document.addEventListener('pointerdown', handleDocumentPointerDown, true)
    window.addEventListener('resize', handleViewportChange, { passive: true })
    window.addEventListener('scroll', handleViewportChange, true)
    if (window.ResizeObserver && selectEl.value) {
        resizeObserver = new ResizeObserver(handleViewportChange)
        resizeObserver.observe(selectEl.value)
    }
})

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
    window.removeEventListener('resize', handleViewportChange)
    window.removeEventListener('scroll', handleViewportChange, true)
    resizeObserver?.disconnect?.()
})
</script>

<style>
.scroll-select-native {
    cursor: pointer;
}

.scroll-select-native:disabled {
    cursor: not-allowed;
}

.scroll-select-native--open {
    border-color: var(--pf-teal) !important;
    box-shadow: 0 0 0 .1875rem rgba(12, 159, 152, .12) !important;
}

.scroll-select-menu {
    z-index: 15000;
    display: grid;
    align-content: start;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: .3rem;
    border: .0625rem solid var(--pf-line-strong);
    border-radius: .72rem;
    background: #fff;
    box-shadow: 0 .85rem 2.1rem rgba(23, 53, 58, .22);
}

.scroll-select-option {
    display: grid;
    width: 100%;
    min-height: 2.85rem;
    grid-template-columns: minmax(0, 1fr) 1rem;
    align-items: center;
    gap: .65rem;
    padding: .55rem .75rem;
    border: 0;
    border-radius: .48rem;
    background: transparent;
    color: var(--pf-ink);
    font: inherit;
    font-size: 1rem;
    line-height: 1.2;
    text-align: left;
    cursor: pointer;
}

.scroll-select-option > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.scroll-select-option > i {
    color: var(--pf-teal);
    font-size: .9rem;
}

.scroll-select-option:hover,
.scroll-select-option.active {
    background: var(--pf-teal-soft);
}

.scroll-select-option.selected {
    color: var(--pf-teal-dark);
    font-weight: 800;
}

.scroll-select-option.disabled,
.scroll-select-option:disabled {
    background: #f4f7f7;
    color: #a6b3b5;
    cursor: not-allowed;
}
</style>
