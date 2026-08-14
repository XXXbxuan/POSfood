<template>
    <div class="module-modal-backdrop" @click.self="$emit('close')">
        <section
            class="module-editor-modal voucher-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-editor-title"
        >
            <header class="voucher-editor-header">
                <div>
                    <span>STEP {{ currentStep + 1 }} OF {{ steps.length }}</span>
                    <h2 id="voucher-editor-title">
                        {{ steps[currentStep].label }}
                    </h2>
                    <p>{{ steps[currentStep].description }}</p>
                </div>
                <div class="voucher-editor-header-actions">
                    <button
                        v-if="initialVoucher"
                        type="button"
                        class="delete"
                        aria-label="Delete voucher"
                        @click="showDeleteConfirm = true"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                    <button
                        type="button"
                        aria-label="Close"
                        @click="$emit('close')"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <form @submit.prevent="submitVoucher">
                <div class="voucher-wizard">
                    <nav class="voucher-step-rail" aria-label="Voucher setup steps">
                        <button
                            v-for="(step, index) in steps"
                            :key="step.key"
                            type="button"
                            :class="{
                                active: currentStep === index,
                                complete: currentStep > index,
                            }"
                            :aria-label="step.label"
                            :aria-current="currentStep === index ? 'step' : null"
                            :title="step.label"
                            @click="currentStep = index"
                        >
                            <i
                                class="fa-solid"
                                :class="currentStep > index ? 'fa-check' : step.icon"
                            ></i>
                        </button>
                    </nav>

                    <section class="voucher-step-content">
                        <div
                            v-if="currentStep === 0"
                            class="module-form-grid voucher-basic-grid"
                        >
                            <label class="full">
                                Voucher code
                                <input
                                    v-model.trim="form.code"
                                    type="text"
                                    placeholder="LUNCH10"
                                    data-keyboard-mode="voucher"
                                    autocapitalize="characters"
                                    spellcheck="false"
                                    @input="uppercaseCode"
                                />
                            </label>

                            <label>
                                Discount type
                                <select v-model="form.type">
                                    <option value="fixed">Fixed amount</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </label>
                            <label>
                                Discount value
                                <span
                                    class="voucher-affix-input"
                                    :class="{ percentage: form.type === 'percentage' }"
                                >
                                    <strong v-if="form.type === 'fixed'">RM</strong>
                                    <input
                                        v-model.number="form.value"
                                        type="number"
                                        min="0"
                                        :max="form.type === 'percentage' ? 100 : undefined"
                                        step="0.01"
                                    />
                                    <strong v-if="form.type === 'percentage'">%</strong>
                                </span>
                            </label>

                            <label v-if="form.type === 'percentage'">
                                Maximum discount
                                <span class="voucher-affix-input">
                                    <strong>RM</strong>
                                    <input
                                        v-model.number="form.maxDiscount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                    />
                                </span>
                            </label>
                            <label
                                class="voucher-minimum-spend"
                                :class="{ full: form.type === 'fixed' }"
                            >
                                Minimum spend
                                <span class="voucher-affix-input">
                                    <strong>RM</strong>
                                    <input
                                        v-model.number="form.minSpend"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                    />
                                </span>
                            </label>

                            <label>
                                Total redemption limit
                                <span class="voucher-number-stepper">
                                    <button
                                        type="button"
                                        aria-label="Decrease total redemption limit"
                                        @click="adjustNumber('totalLimit', -1)"
                                    >
                                        <i class="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <input
                                        :value="form.totalLimit || ''"
                                        type="number"
                                        min="0"
                                        step="1"
                                        inputmode="numeric"
                                        placeholder="–"
                                        aria-label="Total redemption limit"
                                        @input="setLimitFromInput('totalLimit', $event)"
                                    />
                                    <button
                                        type="button"
                                        aria-label="Increase total redemption limit"
                                        @click="adjustNumber('totalLimit', 1)"
                                    >
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </span>
                                <small>Enter 0 for unlimited use.</small>
                            </label>
                            <label>
                                Limit per member
                                <span class="voucher-number-stepper">
                                    <button
                                        type="button"
                                        aria-label="Decrease limit per member"
                                        @click="adjustNumber('perMemberLimit', -1)"
                                    >
                                        <i class="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <input
                                        :value="form.perMemberLimit || ''"
                                        type="number"
                                        min="0"
                                        step="1"
                                        inputmode="numeric"
                                        placeholder="–"
                                        aria-label="Limit per member"
                                        @input="setLimitFromInput('perMemberLimit', $event)"
                                    />
                                    <button
                                        type="button"
                                        aria-label="Increase limit per member"
                                        @click="adjustNumber('perMemberLimit', 1)"
                                    >
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </span>
                                <small>Enter 0 for unlimited use.</small>
                            </label>

                            <fieldset class="voucher-status-field full">
                                <legend>Status</legend>
                                <div>
                                    <button
                                        type="button"
                                        :class="{ active: form.status === 'active' }"
                                        @click="form.status = 'active'"
                                    >
                                        <i class="fa-solid fa-circle-check"></i>
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        :class="{ active: form.status === 'disabled' }"
                                        @click="form.status = 'disabled'"
                                    >
                                        <i class="fa-solid fa-circle-pause"></i>
                                        Disabled
                                    </button>
                                </div>
                            </fieldset>
                        </div>

                        <div v-else-if="currentStep === 1" class="voucher-schedule-layout">
                            <section class="voucher-range-panel">
                                <header>
                                    <i class="fa-regular fa-calendar"></i>
                                    <strong>Date</strong>
                                </header>
                                <div class="voucher-range-inputs">
                                    <label>
                                        From
                                        <input
                                            v-model="form.startDate"
                                            type="date"
                                            @click="openNativePicker"
                                        />
                                    </label>
                                    <span>to</span>
                                    <label>
                                        To
                                        <input
                                            v-model="form.endDate"
                                            type="date"
                                            @click="openNativePicker"
                                        />
                                    </label>
                                </div>
                            </section>

                            <section class="voucher-range-panel">
                                <header>
                                    <i class="fa-regular fa-clock"></i>
                                    <strong>Time</strong>
                                </header>
                                <div class="voucher-range-inputs">
                                    <label>
                                        From
                                        <input
                                            v-model="form.startTime"
                                            type="time"
                                            @click="openNativePicker"
                                        />
                                    </label>
                                    <span>to</span>
                                    <label>
                                        To
                                        <input
                                            v-model="form.endTime"
                                            type="time"
                                            @click="openNativePicker"
                                        />
                                    </label>
                                </div>
                            </section>
                        </div>

                        <div v-else class="voucher-eligibility-step">
                            <div class="voucher-choice-group">
                                <header class="voucher-choice-heading">
                                    <strong>Service type</strong>
                                    <button
                                        type="button"
                                        class="voucher-select-all"
                                        :class="{ active: allSelected('serviceTypes', services) }"
                                        aria-label="Select all service types"
                                        title="Select all service types"
                                        @click="toggleAll('serviceTypes', services)"
                                    >
                                        <i
                                            class="fa-regular"
                                            :class="allSelected('serviceTypes', services) ? 'fa-square-check' : 'fa-square'"
                                        ></i>
                                    </button>
                                </header>
                                <div>
                                    <button
                                        v-for="service in services"
                                        :key="service"
                                        type="button"
                                        :class="{ active: form.serviceTypes.includes(service) }"
                                        @click="toggleListValue('serviceTypes', service)"
                                    >
                                        <i
                                            class="fa-regular"
                                            :class="form.serviceTypes.includes(service) ? 'fa-square-check' : 'fa-square'"
                                        ></i>
                                        {{ service }}
                                    </button>
                                </div>
                            </div>

                            <div class="voucher-choice-group">
                                <header class="voucher-choice-heading">
                                    <strong>Categories</strong>
                                    <button
                                        type="button"
                                        class="voucher-select-all"
                                        :class="{ active: allSelected('allowedCategories', categories) }"
                                        aria-label="Select all categories"
                                        title="Select all categories"
                                        @click="toggleAllCategories"
                                    >
                                        <i
                                            class="fa-regular"
                                            :class="allSelected('allowedCategories', categories) ? 'fa-square-check' : 'fa-square'"
                                        ></i>
                                    </button>
                                </header>
                                <div>
                                    <button
                                        v-for="category in categories"
                                        :key="category"
                                        type="button"
                                        :class="{ active: form.allowedCategories.includes(category) }"
                                        @click="toggleCategory(category)"
                                    >
                                        <i
                                            class="fa-regular"
                                            :class="form.allowedCategories.includes(category) ? 'fa-square-check' : 'fa-square'"
                                        ></i>
                                        {{ category }}
                                    </button>
                                </div>
                            </div>

                            <div class="voucher-choice-group">
                                <header class="voucher-choice-heading">
                                    <strong>Available days</strong>
                                    <button
                                        type="button"
                                        class="voucher-select-all"
                                        :class="{ active: allDaysSelected }"
                                        aria-label="Select all available days"
                                        title="Select all available days"
                                        @click="toggleAllDays"
                                    >
                                        <i
                                            class="fa-regular"
                                            :class="allDaysSelected ? 'fa-square-check' : 'fa-square'"
                                        ></i>
                                    </button>
                                </header>
                                <div class="weekday-choices">
                                    <button
                                        v-for="day in days"
                                        :key="day.value"
                                        type="button"
                                        :class="{ active: form.weekdays.includes(day.value) }"
                                        @click="toggleListValue('weekdays', day.value)"
                                    >
                                        {{ day.label }}
                                    </button>
                                </div>
                            </div>

                            <div class="voucher-product-member-row without-member-rule">
                                <section class="voucher-product-rule">
                                    <header>
                                        <strong>Specific products</strong>
                                        <span>Optional</span>
                                    </header>
                                    <button
                                        type="button"
                                        class="voucher-product-picker-trigger"
                                        @click="openProductPicker"
                                    >
                                        <span>
                                            <i class="fa-solid fa-utensils"></i>
                                            <strong>Choose menu items</strong>
                                            <small
                                                v-if="form.allowedProducts.length"
                                            >
                                                {{
                                                    `${form.allowedProducts.length} selected`
                                                }}
                                            </small>
                                        </span>
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </section>

                            </div>
                        </div>
                    </section>
                </div>

                <p v-if="visibleError" class="module-form-error">
                    {{ visibleError }}
                </p>

                <footer class="voucher-wizard-footer">
                    <button
                        type="button"
                        class="module-secondary-action"
                        :disabled="currentStep === 0"
                        @click="previousStep"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                        Previous
                    </button>
                    <span>{{ currentStep + 1 }} / {{ steps.length }}</span>
                    <button
                        v-if="currentStep < steps.length - 1"
                        type="button"
                        class="module-primary-action"
                        @click="nextStep"
                    >
                        Next
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    <button v-else type="submit" class="module-primary-action">
                        Save voucher
                    </button>
                </footer>
            </form>

            <div v-if="showDeleteConfirm" class="voucher-delete-confirm-layer">
                <section>
                    <span><i class="fa-regular fa-trash-can"></i></span>
                    <h3>Delete this voucher?</h3>
                    <p>{{ form.code }} will be permanently removed.</p>
                    <footer>
                        <button
                            type="button"
                            class="module-secondary-action"
                            @click="showDeleteConfirm = false"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            class="voucher-delete-confirm-button"
                            @click="$emit('delete', form.id)"
                        >
                            Delete
                        </button>
                    </footer>
                </section>
            </div>

            <div
                v-if="showProductPicker"
                class="voucher-product-picker-layer"
                @click.self="closeProductPicker"
            >
                <section class="voucher-product-picker-modal">
                    <header>
                        <div>
                            <span>SPECIFIC PRODUCTS</span>
                            <h3>Choose menu items</h3>
                        </div>
                        <button
                            type="button"
                            aria-label="Close product picker"
                            @click="closeProductPicker"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>

                    <nav class="voucher-product-categories">
                        <button
                            type="button"
                            :class="{ active: productPickerCategory === 'All' }"
                            @click="productPickerCategory = 'All'"
                        >
                            All
                        </button>
                        <button
                            v-for="category in categories"
                            :key="category"
                            type="button"
                            :class="{ active: productPickerCategory === category }"
                            @click="productPickerCategory = category"
                        >
                            {{ category }}
                        </button>
                    </nav>

                    <div class="voucher-product-grid">
                        <button
                            v-for="product in filteredMenuProducts"
                            :key="product.id"
                            type="button"
                            :class="{
                                selected: pendingProducts.includes(product.name),
                            }"
                            @click="togglePendingProduct(product.name)"
                        >
                            <span class="voucher-product-photo">
                                <img
                                    v-if="product.image"
                                    :src="product.image"
                                    :alt="product.name"
                                />
                                <i v-else class="fa-regular fa-image"></i>
                                <i
                                    v-if="pendingProducts.includes(product.name)"
                                    class="fa-solid fa-circle-check"
                                ></i>
                            </span>
                            <strong>{{ product.name }}</strong>
                            <small>{{ product.category }}</small>
                        </button>
                    </div>

                    <footer>
                        <span>{{ pendingProducts.length }} selected</span>
                        <button type="button" @click="confirmProducts">
                            <i class="fa-solid fa-check"></i>
                            Confirm
                        </button>
                    </footer>
                </section>
            </div>
        </section>
    </div>
</template>

<script>
import { ALL_DAYS } from '@/services/pos/vouchers.js'

function emptyVoucherForm() {
    return {
        id: '',
        name: '',
        code: '',
        type: 'fixed',
        value: 5,
        minSpend: 0,
        maxDiscount: 0,
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        serviceTypes: ['Dine In', 'Takeaway'],
        weekdays: [...ALL_DAYS],
        memberOnly: false,
        allowedCategories: [],
        allowedProducts: [],
        totalLimit: 0,
        perMemberLimit: 0,
        status: 'active',
    }
}

function cloneVoucher(voucher) {
    const source = voucher || emptyVoucherForm()
    return {
        ...emptyVoucherForm(),
        ...source,
        serviceTypes: [...(source.serviceTypes || [])],
        weekdays: [...(source.weekdays || [])],
        allowedCategories: [...(source.allowedCategories || [])],
        allowedProducts: [...(source.allowedProducts || [])],
    }
}

export default {
    name: 'VoucherEditorModal',
    props: {
        initialVoucher: {
            type: Object,
            default: null,
        },
        categories: {
            type: Array,
            default: () => [],
        },
        services: {
            type: Array,
            default: () => [],
        },
        days: {
            type: Array,
            default: () => [],
        },
        menuProducts: {
            type: Array,
            default: () => [],
        },
        saveError: {
            type: String,
            default: '',
        },
    },
    emits: ['close', 'delete', 'save'],
    data() {
        const form = cloneVoucher(this.initialVoucher)
        if (!form.allowedCategories.length) {
            form.allowedCategories = [...this.categories]
        }
        return {
            currentStep: 0,
            form,
            localError: '',
            showProductPicker: false,
            showDeleteConfirm: false,
            productPickerCategory: 'All',
            pendingProducts: [],
            steps: [
                {
                    key: 'details',
                    label: 'Voucher information',
                    description: 'Set the code, discount and usage limits.',
                    icon: 'fa-ticket',
                },
                {
                    key: 'schedule',
                    label: 'Date and time',
                    description: 'Choose when this voucher is available.',
                    icon: 'fa-calendar-days',
                },
                {
                    key: 'eligibility',
                    label: 'Conditions',
                    description: 'Choose where and who can use this voucher.',
                    icon: 'fa-sliders',
                },
            ],
        }
    },
    computed: {
        visibleError() {
            return this.localError || this.saveError
        },
        allDaysSelected() {
            return this.days.length > 0 && this.days.every((day) =>
                this.form.weekdays.includes(day.value),
            )
        },
        filteredMenuProducts() {
            if (this.productPickerCategory === 'All') return this.menuProducts
            return this.menuProducts.filter(
                (product) => product.category === this.productPickerCategory,
            )
        },
    },
    methods: {
        uppercaseCode() {
            this.form.code = this.form.code
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
        },
        setLimitFromInput(field, event) {
            const value = Math.floor(Number(event.target.value))
            this.form[field] = Number.isFinite(value)
                ? Math.max(0, value)
                : 0
        },
        openNativePicker(event) {
            const input = event.currentTarget
            try {
                input.showPicker()
            } catch (error) {
                input.focus()
            }
        },
        toggleListValue(field, value) {
            const values = this.form[field]
            const index = values.indexOf(value)
            if (index >= 0) values.splice(index, 1)
            else values.push(value)
        },
        allSelected(field, options) {
            return options.length > 0 && options.every((value) =>
                this.form[field].includes(value),
            )
        },
        toggleAll(field, options) {
            this.form[field] = this.allSelected(field, options)
                ? []
                : [...options]
        },
        toggleAllDays() {
            this.form.weekdays = this.allDaysSelected
                ? []
                : this.days.map((day) => day.value)
        },
        categoryProductNames(category) {
            return this.menuProducts
                .filter((product) => product.category === category)
                .map((product) => product.name)
        },
        toggleCategory(category) {
            const isSelected = this.form.allowedCategories.includes(category)
            const categoryProducts = this.categoryProductNames(category)
            if (isSelected) {
                this.form.allowedCategories = this.form.allowedCategories.filter(
                    (value) => value !== category,
                )
                this.form.allowedProducts = this.form.allowedProducts.filter(
                    (name) => !categoryProducts.includes(name),
                )
                return
            }
            this.form.allowedCategories.push(category)
            this.form.allowedProducts = [
                ...new Set([...this.form.allowedProducts, ...categoryProducts]),
            ]
        },
        toggleAllCategories() {
            if (this.allSelected('allowedCategories', this.categories)) {
                this.form.allowedCategories = []
                this.form.allowedProducts = []
                return
            }
            this.form.allowedCategories = [...this.categories]
            this.form.allowedProducts = this.menuProducts.map(
                (product) => product.name,
            )
        },
        adjustNumber(field, change) {
            this.form[field] = Math.max(0, Number(this.form[field] || 0) + change)
        },
        openProductPicker() {
            this.pendingProducts = [...this.form.allowedProducts]
            this.productPickerCategory = 'All'
            this.showProductPicker = true
        },
        closeProductPicker() {
            this.form.allowedProducts = [...this.pendingProducts]
            this.form.allowedCategories = this.categories.filter((category) => {
                const productNames = this.categoryProductNames(category)
                return (
                    productNames.length > 0 &&
                    productNames.every((name) =>
                        this.form.allowedProducts.includes(name),
                    )
                )
            })
            this.showProductPicker = false
        },
        togglePendingProduct(productName) {
            const index = this.pendingProducts.indexOf(productName)
            if (index >= 0) this.pendingProducts.splice(index, 1)
            else this.pendingProducts.push(productName)
        },
        confirmProducts() {
            this.closeProductPicker()
        },
        previousStep() {
            this.localError = ''
            this.currentStep = Math.max(0, this.currentStep - 1)
        },
        nextStep() {
            this.localError = ''
            this.currentStep = Math.min(this.steps.length - 1, this.currentStep + 1)
        },
        submitVoucher() {
            this.localError = ''
            if (!this.form.serviceTypes.length) {
                this.currentStep = 2
                this.localError = 'Choose at least one service type.'
                return
            }
            if (!this.form.weekdays.length) {
                this.currentStep = 2
                this.localError = 'Choose at least one available day.'
                return
            }

            this.$emit('save', {
                ...this.form,
                name: this.form.code,
                allowedProducts: [...this.form.allowedProducts],
            })
        },
    },
}
</script>
