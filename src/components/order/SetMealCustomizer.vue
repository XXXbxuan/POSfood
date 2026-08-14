<template>
    <div class="set-meal-customizer">
        <aside class="set-meal-dish-list">
            <header>
                <strong>Set items</strong>
                <small>Choose each dish to set its options.</small>
            </header>
            <button
                v-for="entry in orderedSelections"
                :key="entry.selection.key"
                type="button"
                :class="{
                    active: entry.index === activeIndex,
                    'has-return-issue': Boolean(entry.selection.returnIssue),
                    'active-return-issue':
                        entry.index === activeIndex &&
                        Boolean(entry.selection.returnIssue),
                }"
                @click="$emit('update:activeIndex', entry.index)"
            >
                <img
                    v-if="entry.selection.product.image"
                    :src="entry.selection.product.image"
                    :alt="entry.selection.product.name"
                />
                <span class="set-item-copy">
                    <span class="set-item-title-row">
                        <strong>{{ entry.selection.product.name }}</strong>
                        <em v-if="entry.selection.returnIssue">
                            {{ issueBadge(entry.selection.returnIssue) }}
                        </em>
                    </span>
                    <small>{{ selectionSummary(entry.selection) }}</small>
                </span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </aside>

        <section v-if="activeSelection" class="set-meal-dish-options">
            <aside
                v-if="activeSelection.returnIssue"
                class="set-return-note-panel"
            >
                <span>{{ issueBadge(activeSelection.returnIssue) }}</span>
                <strong>{{ issueReason(activeSelection.returnIssue) }}</strong>
                <p v-if="activeSelection.returnIssue.replacement">
                    Replace with: {{ activeSelection.returnIssue.replacement }}
                </p>
            </aside>

            <header>
                <div>
                    <span>{{ activeSelection.product.category }}</span>
                    <h3>{{ activeSelection.product.name }}</h3>
                </div>
                <img
                    v-if="activeSelection.product.image"
                    :src="activeSelection.product.image"
                    :alt="activeSelection.product.name"
                />
            </header>

            <div
                v-if="activeSelection.product.sizes?.length"
                class="set-option-group"
            >
                <strong>Size</strong>
                <button
                    v-for="size in activeSelection.product.sizes"
                    :key="size.name"
                    type="button"
                    :class="{ active: activeSelection.state.size === size.name }"
                    @click="updateField('size', size.name)"
                >
                    <i
                        :class="
                            activeSelection.state.size === size.name
                                ? 'fa-solid fa-circle-check'
                                : 'fa-regular fa-circle'
                        "
                    ></i>
                    {{ size.name }}
                    <small v-if="size.price">+RM {{ money(size.price) }}</small>
                </button>
            </div>

            <div
                v-for="group in activeSelection.product.modifierGroups || []"
                :key="group.name"
                class="set-option-group"
            >
                <strong>{{ group.name }}</strong>
                <button
                    v-for="option in group.options || []"
                    :key="option.name"
                    type="button"
                    :class="{
                        active:
                            activeSelection.state.modifiers[group.name] ===
                            option.name,
                    }"
                    @click="updateModifier(group.name, option.name)"
                >
                    <i
                        :class="
                            activeSelection.state.modifiers[group.name] ===
                            option.name
                                ? 'fa-solid fa-circle-check'
                                : 'fa-regular fa-circle'
                        "
                    ></i>
                    {{ option.name }}
                    <small v-if="option.price">
                        +RM {{ money(option.price) }}
                    </small>
                </button>
            </div>

            <div
                v-if="activeSelection.product.removable?.length"
                class="set-option-group checkbox-options"
            >
                <strong>Remove</strong>
                <button
                    v-for="ingredient in activeSelection.product.removable"
                    :key="ingredient"
                    type="button"
                    :class="{
                        active: activeSelection.state.removedIngredients.includes(
                            ingredient,
                        ),
                    }"
                    @click="toggleListValue('removedIngredients', ingredient)"
                >
                    <i
                        :class="
                            activeSelection.state.removedIngredients.includes(
                                ingredient,
                            )
                                ? 'fa-solid fa-square-check'
                                : 'fa-regular fa-square'
                        "
                    ></i>
                    No {{ ingredient }}
                </button>
            </div>

            <div
                v-if="activeSelection.product.addons?.length"
                class="set-option-group checkbox-options"
            >
                <strong>Add-ons</strong>
                <button
                    v-for="addon in activeSelection.product.addons"
                    :key="addon.name"
                    type="button"
                    :class="{
                        active: activeSelection.state.addons.includes(addon.name),
                    }"
                    @click="toggleListValue('addons', addon.name)"
                >
                    <i
                        :class="
                            activeSelection.state.addons.includes(addon.name)
                                ? 'fa-solid fa-square-check'
                                : 'fa-regular fa-square'
                        "
                    ></i>
                    {{ addon.name }}
                    <small>+RM {{ money(addon.price) }}</small>
                </button>
            </div>

            <label class="set-dish-note">
                Note
                <textarea
                    :value="activeSelection.state.remark"
                    rows="2"
                    placeholder="Note for this dish..."
                    @input="updateField('remark', $event.target.value)"
                ></textarea>
            </label>
        </section>
    </div>
</template>

<script>
import { productOptionLines } from '@/utils/productOptions.js'

export default {
    name: 'SetMealCustomizer',
    props: {
        selections: { type: Array, default: () => [] },
        activeIndex: { type: Number, default: 0 },
    },
    emits: ['update:activeIndex', 'update:selections'],
    computed: {
        activeSelection() {
            return this.selections[this.activeIndex] || null
        },
        orderedSelections() {
            return this.selections
                .map((selection, index) => ({ selection, index }))
                .sort((a, b) => {
                    const aPriority = a.selection.returnIssue ? 0 : 1
                    const bPriority = b.selection.returnIssue ? 0 : 1
                    return aPriority - bPriority || a.index - b.index
                })
        },
    },
    methods: {
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        selectionSummary(selection) {
            return (
                productOptionLines(selection.product, selection.state).join(
                    ' · ',
                ) || 'Regular'
            )
        },
        issueBadge(issue) {
            return String(issue?.requestType || '')
                .toLowerCase()
                .includes('replacement')
                ? 'Replacement'
                : 'Return'
        },
        issueReason(issue) {
            return (
                String(issue?.reason || '').trim() ||
                'Chef returned this dish.'
            )
        },
        updateSelection(nextState) {
            const selections = this.selections.map((selection, index) =>
                index === this.activeIndex
                    ? { ...selection, state: nextState }
                    : selection,
            )
            this.$emit('update:selections', selections)
        },
        updateField(field, value) {
            this.updateSelection({
                ...this.activeSelection.state,
                [field]: value,
            })
        },
        updateModifier(groupName, optionName) {
            this.updateSelection({
                ...this.activeSelection.state,
                modifiers: {
                    ...this.activeSelection.state.modifiers,
                    [groupName]: optionName,
                },
            })
        },
        toggleListValue(field, value) {
            const current = this.activeSelection.state[field] || []
            const values = current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value]
            this.updateField(field, values)
        },
    },
}
</script>
