<template>
    <Teleport to="body" :disabled="!isZoomed">
        <section
            class="table-layout-inline-preview"
            :class="{ zoomed: isZoomed }"
            aria-label="Saved table layout"
            @click.self="isZoomed = false"
        >
            <div class="inline-layout-dialog">
                <button
                    type="button"
                    class="inline-layout-print-button"
                    aria-label="Print table layout"
                    title="Print"
                    @click.stop="printLayout"
                >
                    <i class="fa-solid fa-print"></i>
                </button>
                <button
                    v-if="isZoomed"
                    type="button"
                    class="inline-layout-zoom-button"
                    :aria-label="isZoomed ? 'Close large view' : 'View larger'"
                    :title="isZoomed ? 'Close large view' : 'View larger'"
                    @click.stop="isZoomed = false"
                >
                    <i
                        class="fa-solid"
                        :class="isZoomed ? 'fa-xmark' : 'fa-expand'"
                    ></i>
                </button>
                <div
                    ref="floor"
                    class="inline-layout-floor"
                    role="button"
                    tabindex="0"
                    aria-label="Open large table layout view"
                    @click="openZoom"
                    @keydown.enter="openZoom"
                >
                    <article
                        v-for="item in placedItems"
                        :key="item.number"
                        class="inline-layout-table"
                        :class="`seats-${tableFor(item.number).seats}`"
                        :style="tablePosition(item)"
                    >
                        <span class="inline-chair top one"></span>
                        <span
                            v-if="tableFor(item.number).seats === 6"
                            class="inline-chair top two"
                        ></span>
                        <span class="inline-chair left"></span>
                        <span class="inline-chair right"></span>
                        <span class="inline-chair bottom one"></span>
                        <span
                            v-if="tableFor(item.number).seats === 6"
                            class="inline-chair bottom two"
                        ></span>
                        <strong>{{ item.number }}</strong>
                        <small
                            >({{ coordinateX(item) }},
                            {{ coordinateY(item) }})</small
                        >
                    </article>

                    <div v-if="!placedItems.length" class="inline-layout-empty">
                        <i class="fa-solid fa-table-cells-large"></i>
                        <strong>No tables in this layout</strong>
                    </div>
                </div>
            </div>
        </section>
    </Teleport>
</template>

<script>
import { printElement } from '@/utils/printElement.js'

const DESIGN_SIZE = 600
const TABLE_SIZE = 96

export default {
    name: 'TableLayoutPreview',
    props: {
        layout: { type: Object, required: true },
        tables: { type: Array, default: () => [] },
    },
    data() {
        return {
            isZoomed: false,
        }
    },
    computed: {
        placedItems() {
            return (this.layout.items || []).filter((item) => item.placed)
        },
        tableMap() {
            return new Map(this.tables.map((table) => [table.number, table]))
        },
        sourceWidth() {
            return Number(this.layout.canvas?.width) || DESIGN_SIZE
        },
        sourceHeight() {
            return Number(this.layout.canvas?.height) || DESIGN_SIZE
        },
    },
    mounted() {
        window.addEventListener('keydown', this.handleKeydown)
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydown)
    },
    methods: {
        async printLayout() {
            await printElement(this.$refs.floor, {
                variant: 'table-layout-preview-print',
            })
        },
        openZoom() {
            if (!this.isZoomed) this.isZoomed = true
        },
        handleKeydown(event) {
            if (event.key === 'Escape') this.isZoomed = false
        },
        tableFor(number) {
            return this.tableMap.get(number) || { number, seats: 4 }
        },
        rounded(value) {
            return Math.round(Number(value) || 0)
        },
        tablePosition(item) {
            return {
                left: `${(this.rounded(item.x) / this.sourceWidth) * 100}%`,
                top: `${(this.rounded(item.y) / this.sourceHeight) * 100}%`,
                width: `${(TABLE_SIZE / this.sourceWidth) * 100}%`,
            }
        },
        coordinateX(item) {
            return this.rounded(item.x)
        },
        coordinateY(item) {
            return this.rounded(item.y)
        },
    },
}
</script>
