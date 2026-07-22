<template>
    <aside
        v-if="visible"
        ref="keyboard"
        class="tablet-keyboard"
        :class="{
            numeric: mode === 'numeric',
            voucher: mode === 'voucher',
        }"
        aria-label="On-screen keyboard"
        @pointerdown.prevent
    >
        <header>
            <span>{{ keyboardTitle }}</span>
            <button type="button" aria-label="Close keyboard" @click="close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </header>

        <div v-if="mode === 'numeric'" class="keyboard-number-grid">
            <button v-for="key in numberKeys" :key="key" type="button" @click="press(key)">
                {{ key }}
            </button>
            <button v-if="allowDecimal" type="button" @click="press('.')">.</button>
            <button v-else type="button" @click="clearValue">Clear</button>
            <button type="button" @click="press('0')">0</button>
            <button type="button" aria-label="Backspace" @click="backspace">
                <i class="fa-solid fa-delete-left"></i>
            </button>
            <button type="button" class="keyboard-done" @click="close">Done</button>
        </div>

        <div v-else class="keyboard-letter-layout">
            <div
                v-for="(row, index) in displayedRows"
                :key="index"
                class="keyboard-letter-row"
                :class="`keyboard-row-${index + 1}`"
            >
                <button
                    v-if="index === 2"
                    type="button"
                    class="keyboard-shift"
                    :class="{ active: shift }"
                    aria-label="Shift"
                    @pointerdown="beginShiftHold"
                    @pointerup="endShiftHold"
                    @pointercancel="cancelShiftHold"
                    @pointerleave="cancelShiftHold"
                    @click="toggleShift"
                >
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button v-for="key in row" :key="key" type="button" @click="pressLetter(key)">
                    {{ displayedKey(key) }}
                </button>
                <button
                    v-if="index === 2"
                    type="button"
                    class="keyboard-backspace"
                    aria-label="Backspace"
                    @click="backspace"
                >
                    <i class="fa-solid fa-delete-left"></i>
                </button>
            </div>
            <div class="keyboard-action-row">
                <button type="button" @click="symbolMode = !symbolMode">
                    {{ symbolMode ? 'ABC' : '123' }}
                </button>
                <button type="button" @click="press(',')">,</button>
                <button
                    type="button"
                    class="keyboard-space"
                    @click="press(' ')"
                >
                    space
                </button>
                <button type="button" @click="press('.')">.</button>
                <button type="button" class="keyboard-done" @click="close">return</button>
            </div>
        </div>
    </aside>
</template>

<script>
export default {
    name: 'TabletKeyboard',
    data() {
        return {
            target: null,
            visible: false,
            mode: 'letters',
            shift: false,
            shiftLocked: false,
            shiftHoldTimer: null,
            suppressShiftClick: false,
            raisedElement: null,
            ignoreOpeningClick: false,
            openingClickTimer: null,
            pendingRaisedTarget: null,
            symbolMode: false,
            allowDecimal: true,
            numberKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
            letterRows: [
                ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
                ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
                ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
            ],
            symbolRows: [
                ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
                ['@', '#', '$', '%', '&', '*', '-', '+', '(', ')'],
                ['!', '?', '/', '_', ':', ';', "'", '"'],
            ],
        }
    },
    computed: {
        keyboardTitle() {
            if (this.mode === 'numeric') return 'NUMBER'
            if (this.mode === 'voucher') return 'VOUCHER CODE'
            return 'KEYBOARD'
        },
        displayedRows() {
            return this.symbolMode ? this.symbolRows : this.letterRows
        },
    },
    mounted() {
        document.addEventListener('pointerdown', this.prepareInput, true)
        document.addEventListener('focusin', this.openForInput, true)
        document.addEventListener('click', this.closeAfterOutsideClick)
        window.addEventListener('resize', this.syncKeyboardLayout)
    },
    beforeUnmount() {
        document.removeEventListener('pointerdown', this.prepareInput, true)
        document.removeEventListener('focusin', this.openForInput, true)
        document.removeEventListener('click', this.closeAfterOutsideClick)
        window.removeEventListener('resize', this.syncKeyboardLayout)
        window.clearTimeout(this.openingClickTimer)
        this.cancelShiftHold()
        this.resetKeyboardLayout()
    },
    methods: {
        isEditable(target) {
            return (
                (target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement) &&
                !target.disabled &&
                !target.readOnly &&
                !['date', 'time', 'datetime-local', 'checkbox', 'radio', 'file', 'color', 'range'].includes(target.type)
            )
        },
        prepareInput(event) {
            const target = event.target
            if (this.isEditable(target)) {
                this.ignoreOpeningClick = true
                window.clearTimeout(this.openingClickTimer)
                this.openingClickTimer = window.setTimeout(() => {
                    this.finishOpeningClick()
                }, 500)
                if (!target.dataset.originalInputmode)
                    target.dataset.originalInputmode = target.getAttribute('inputmode') || 'text'
                target.setAttribute('inputmode', 'none')
                return
            }
        },
        closeAfterOutsideClick(event) {
            if (this.ignoreOpeningClick) {
                this.finishOpeningClick()
                return
            }
            if (
                !this.visible ||
                this.isEditable(event.target) ||
                event.target.closest?.('.tablet-keyboard')
            ) {
                return
            }
            requestAnimationFrame(() => this.close())
        },
        openForInput(event) {
            if (!this.isEditable(event.target)) return
            this.target = event.target
            const requestedMode = event.target.dataset.originalInputmode || ''
            if (event.target.dataset.keyboardMode === 'voucher')
                this.mode = 'voucher'
            else
                this.mode =
                    event.target.type === 'number' ||
                    event.target.type === 'tel' ||
                    ['numeric', 'decimal', 'tel'].includes(requestedMode)
                        ? 'numeric'
                        : 'letters'
            this.shift = false
            this.shiftLocked = false
            this.suppressShiftClick = false
            this.symbolMode = false
            this.allowDecimal =
                event.target.type !== 'tel' &&
                !['numeric', 'tel'].includes(requestedMode)
            this.visible = true
            if (this.ignoreOpeningClick) {
                this.pendingRaisedTarget = event.target
            } else {
                this.openKeyboardLayout(event.target)
            }
        },
        finishOpeningClick() {
            this.ignoreOpeningClick = false
            window.clearTimeout(this.openingClickTimer)
            const target = this.pendingRaisedTarget || this.target
            this.pendingRaisedTarget = null
            if (!this.visible || !target) return
            requestAnimationFrame(() => this.openKeyboardLayout(target))
        },
        openKeyboardLayout(target) {
            if (!this.visible || target !== this.target) return
            this.raiseInputPopup(target)
            this.$nextTick(this.syncKeyboardLayout)
        },
        raiseInputPopup(target) {
            this.raisedElement?.classList.remove('keyboard-raised-popup')
            this.raisedElement =
                target.closest(
                    '.modal-backdrop, .module-modal-backdrop, .menu-admin-backdrop, .confirm-backdrop, .checkout-payment-backdrop, .dashboard-backdrop, .topbar-member-backdrop, .voucher-print-backdrop, .camera-backdrop',
                ) || target.closest('.login-panel')
            this.raisedElement?.classList.add('keyboard-raised-popup')
        },
        syncKeyboardLayout() {
            if (!this.visible || !this.$refs.keyboard) return
            const height = Math.ceil(
                this.$refs.keyboard.getBoundingClientRect().height,
            )
            document.documentElement.classList.add('tablet-keyboard-open')
            document.documentElement.style.setProperty(
                '--tablet-keyboard-height',
                `${height}px`,
            )
            requestAnimationFrame(() => this.revealTarget())
        },
        revealTarget() {
            if (!this.target || !this.$refs.keyboard) return
            let container = this.target.parentElement
            while (container && container !== document.body) {
                const overflow = getComputedStyle(container).overflowY
                if (
                    /(auto|scroll)/.test(overflow) &&
                    container.scrollHeight > container.clientHeight
                ) {
                    break
                }
                container = container.parentElement
            }

            if (container && container !== document.body) {
                const targetRect = this.target.getBoundingClientRect()
                const containerRect = container.getBoundingClientRect()
                container.scrollTop +=
                    targetRect.top -
                    containerRect.top -
                    Math.max(
                        16,
                        (container.clientHeight - targetRect.height) / 2,
                    )
            } else {
                this.target.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                })
            }

            requestAnimationFrame(() => {
                const keyboardTop =
                    this.$refs.keyboard.getBoundingClientRect().top
                const targetRect = this.target.getBoundingClientRect()
                const targetBottom = targetRect.bottom
                const overlap = targetBottom - keyboardTop + 20
                if (overlap > 0) {
                    if (container && container !== document.body) {
                        container.scrollTop += overlap
                    } else {
                        window.scrollBy({ top: overlap, behavior: 'auto' })
                    }
                }
            })
        },
        resetKeyboardLayout() {
            this.raisedElement?.classList.remove('keyboard-raised-popup')
            this.raisedElement = null
            document.documentElement.classList.remove('tablet-keyboard-open')
            document.documentElement.style.removeProperty(
                '--tablet-keyboard-height',
            )
        },
        setValue(value, selectionStart = value.length) {
            if (!this.target) return
            const prototype =
                this.target instanceof HTMLTextAreaElement
                    ? HTMLTextAreaElement.prototype
                    : HTMLInputElement.prototype
            const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
            if (setter) setter.call(this.target, value)
            else this.target.value = value
            this.target.dispatchEvent(new Event('input', { bubbles: true }))
            this.target.focus({ preventScroll: true })
            if (typeof this.target.setSelectionRange === 'function') {
                try {
                    this.target.setSelectionRange(selectionStart, selectionStart)
                } catch (error) {
                    // Number inputs do not expose a text selection range.
                }
            }
        },
        selection() {
            const value = String(this.target?.value || '')
            const start = this.target?.selectionStart ?? value.length
            const end = this.target?.selectionEnd ?? start
            return { value, start, end }
        },
        press(key) {
            const { value, start, end } = this.selection()
            this.setValue(`${value.slice(0, start)}${key}${value.slice(end)}`, start + key.length)
        },
        pressLetter(key) {
            if (this.symbolMode) {
                this.press(key)
                return
            }
            this.press(
                this.shift ? key.toUpperCase() : key,
            )
            if (this.shift && !this.shiftLocked) this.shift = false
        },
        displayedKey(key) {
            if (this.symbolMode) return key
            return this.shift ? key.toUpperCase() : key
        },
        toggleShift() {
            if (this.suppressShiftClick) {
                this.suppressShiftClick = false
                return
            }
            this.shift = !this.shift
            this.shiftLocked = false
        },
        beginShiftHold() {
            this.cancelShiftHold()
            this.shiftHoldTimer = window.setTimeout(() => {
                this.shiftLocked = !this.shiftLocked
                this.shift = this.shiftLocked
                this.suppressShiftClick = true
                this.shiftHoldTimer = null
            }, 1500)
        },
        endShiftHold() {
            if (this.shiftHoldTimer) this.cancelShiftHold()
        },
        cancelShiftHold() {
            if (!this.shiftHoldTimer) return
            window.clearTimeout(this.shiftHoldTimer)
            this.shiftHoldTimer = null
        },
        backspace() {
            const { value, start, end } = this.selection()
            if (start !== end)
                return this.setValue(`${value.slice(0, start)}${value.slice(end)}`, start)
            if (!start) return
            this.setValue(`${value.slice(0, start - 1)}${value.slice(end)}`, start - 1)
        },
        clearValue() {
            this.setValue('', 0)
        },
        close() {
            this.visible = false
            this.shift = false
            this.shiftLocked = false
            this.symbolMode = false
            this.cancelShiftHold()
            this.ignoreOpeningClick = false
            this.pendingRaisedTarget = null
            window.clearTimeout(this.openingClickTimer)
            this.target?.blur()
            this.target = null
            this.resetKeyboardLayout()
        },
    },
}
</script>
