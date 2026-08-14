<template>
    <div class="module-form-grid member-form-fields">
        <label>
            Customer name
            <input
                :value="modelValue.name"
                type="text"
                placeholder="Full name"
                @input="update('name', $event.target.value)"
            />
        </label>
        <label>
            Phone number
            <input
                :value="modelValue.phone"
                type="tel"
                placeholder="01X-XXXXXXX"
                @input="update('phone', $event.target.value)"
            />
        </label>
        <label>
            Email
            <input
                :value="modelValue.email"
                type="email"
                placeholder="Optional"
                @input="update('email', $event.target.value)"
            />
        </label>
        <label>
            Birthday
            <input
                :value="modelValue.birthday"
                type="date"
                @click="openBirthdayPicker"
                @input="update('birthday', $event.target.value)"
            />
        </label>
        <label v-if="showPoints">
            Points
            <input
                :value="modelValue.points"
                type="number"
                min="0"
                step="1"
                @input="update('points', Number($event.target.value || 0))"
            />
        </label>
        <label class="full">
            Note
            <textarea
                :value="modelValue.note"
                rows="3"
                placeholder="Allergy, preference or staff note"
                @input="update('note', $event.target.value)"
            ></textarea>
        </label>
    </div>
</template>

<script>
export default {
    name: 'MemberFormFields',
    props: {
        modelValue: { type: Object, required: true },
        showPoints: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    methods: {
        openBirthdayPicker(event) {
            const input = event.currentTarget
            input.focus({ preventScroll: true })
            try {
                input.showPicker?.()
            } catch (error) {
                // Browsers without showPicker still open their native date field.
            }
        },
        update(field, value) {
            this.$emit('update:modelValue', {
                ...this.modelValue,
                [field]: value,
            })
        },
    },
}
</script>
