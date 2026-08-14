<template>
    <div class="modal-backdrop" @click.self="$emit('close')">
        <section class="new-item-picker" role="dialog" aria-modal="true" aria-label="Create inventory record">
            <header class="modal-header">
                <div><span class="eyebrow">NEW INVENTORY</span><h2>What do you want to create?</h2></div>
                <button class="icon-button" type="button" aria-label="Close" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
            </header>
            <div class="new-item-picker__grid">
                <button type="button" @click="$emit('product')">
                    <span><i class="fa-solid fa-box"></i></span>
                    <div><strong>Register Product</strong></div>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <button type="button" @click="$emit('batch')">
                    <span><i class="fa-solid fa-layer-group"></i></span>
                    <div><strong>Register Batch</strong></div>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        </section>
    </div>
</template>

<script>
export default {
    name: 'NewInventoryItemPicker',
    emits: ['close', 'product', 'batch'],
}
</script>

<style scoped src="@/assets/css/components/new-inventory-item-picker.css"></style>
