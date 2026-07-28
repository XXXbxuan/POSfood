<template>
    <div class="modal-backdrop tool-picker-backdrop" @click.self="$emit('close')">
        <section class="tool-picker">
            <header>
                <span :class="direction">
                    <i class="fa-solid" :class="direction === 'in' ? 'fa-arrow-down' : 'fa-arrow-up'"></i>
                </span>
                <div>
                    <small>{{ direction === 'in' ? 'ADD INVENTORY' : 'DEDUCT INVENTORY' }}</small>
                    <h2>{{ direction === 'in' ? 'Stock In' : 'Stock Out' }}</h2>
                </div>
                <button class="icon-button" type="button" aria-label="Close" @click="$emit('close')">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>
            <label class="search-field">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input v-model.trim="search" type="search" autofocus placeholder="Search product or SKU" />
            </label>
            <div class="tool-picker-list">
                <button
                    v-for="product in filteredProducts"
                    :key="product.id"
                    type="button"
                    @click="$emit('select', product)"
                >
                    <span>{{ product.name.slice(0, 2).toUpperCase() }}</span>
                    <div>
                        <strong>{{ product.name }}</strong>
                        <small class="mono">{{ product.sku }} &middot; {{ product.location || 'No location' }}</small>
                    </div>
                    <b>{{ product.currentStock }} <small>{{ product.unit }}</small></b>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div v-if="!filteredProducts.length" class="empty-state compact">
                    <i class="fa-solid fa-box-open"></i>
                    <strong>No products found</strong>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'SidebarActionPicker',
    props: {
        direction: { type: String, required: true },
    },
    emits: ['close', 'select'],
    data() {
        return {
            store: inventoryStore,
            search: '',
        }
    },
    computed: {
        filteredProducts() {
            const search = this.search.toLowerCase()
            return this.store.state.products.filter(
                (product) =>
                    product.active &&
                    (!search ||
                        [product.name, product.sku, product.barcode].some((value) =>
                            String(value).toLowerCase().includes(search),
                        )),
            )
        },
    },
}
</script>
