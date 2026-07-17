<template>
    <section class="menu-workspace">
        <div class="category-tabs">
            <button
                v-for="category in categories"
                :key="category"
                type="button"
                :class="{ active: activeCategory === category }"
                @click="$emit('update:activeCategory', category)"
            >
                {{ category }}
            </button>
        </div>
        <div v-if="products.length" class="product-grid">
            <article
                v-for="product in products"
                :key="product.id"
                class="product-card"
                :class="productStatus(product)"
                role="button"
                :tabindex="productStatus(product) === 'available' ? 0 : -1"
                :aria-disabled="productStatus(product) !== 'available'"
                @click="selectProduct(product)"
                @keydown.enter="selectProduct(product)"
            >
                <div class="dish-wrap">
                    <img v-if="product.image" :src="product.image" :alt="product.name" />
                    <i v-else class="fa-regular fa-image"></i>
                </div>
                <h2>{{ product.name }}</h2>
                <small v-if="product.type === 'set'" class="set-summary">
                    {{ setSummary(product) }}
                </small>
                <strong>RM {{ money(product.price) }}</strong>
                <span
                    v-if="productStatus(product) !== 'available'"
                    class="availability-label"
                >
                    {{ statusLabel(product) }}
                </span>
            </article>
        </div>
        <div v-else class="empty-menu">
            <i class="fa-solid fa-magnifying-glass"></i
            ><strong>No products found</strong>
        </div>
    </section>
</template>

<script>
import {
    productAvailabilityLabel,
    productAvailabilityStatus,
} from '@/utils/menu.js'

export default {
    name: 'ProductMenu',
    props: {
        categories: { type: Array, default: () => [] },
        activeCategory: { type: String, default: '' },
        products: { type: Array, default: () => [] },
    },
    emits: ['update:activeCategory', 'select'],
    methods: {
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        productStatus(product) {
            return productAvailabilityStatus(product)
        },
        statusLabel(product) {
            return productAvailabilityLabel(product)
        },
        setSummary(product) {
            return (product.setItemNames || []).join(' · ') || product.description
        },
        selectProduct(product) {
            if (this.productStatus(product) !== 'available') return
            this.$emit('select', product)
        },
    },
}
</script>
