<template>
    <div
        ref="grid"
        class="tables-grid"
        :class="{ 'long-sort-enabled': sortable }"
    >
        <button
            v-for="table in tables"
            :key="table.number"
            type="button"
            class="table-card"
            :data-sort-id="table.number"
            :aria-label="
                sortable
                    ? `${table.number}, hold for one second to move`
                    : table.number
            "
            :class="[
                table.status,
                `seats-${table.seats}`,
                {
                    selected:
                        selectedTable && selectedTable.number === table.number,
                },
            ]"
            @click="selectTable(table)"
        >
            <div class="table-art">
                <span class="chair top one"></span
                ><span v-if="table.seats === 6" class="chair top two"></span>
                <span class="chair left"></span
                ><span class="chair right"></span>
                <span class="chair bottom one"></span
                ><span v-if="table.seats === 6" class="chair bottom two"></span>
                <div class="table-shape">
                    <strong>{{ table.number }}</strong
                    ><span v-if="table.status === 'vacant'">-</span
                    ><span v-else-if="table.status === 'service'"
                        ><i class="fa-solid fa-screwdriver-wrench"></i></span
                    ><span v-else
                        ><i class="fa-solid fa-user"></i
                        >{{ table.guests || '-' }}</span
                    >
                </div>
            </div>
            <span v-if="table.status === 'served'" class="payment-strip served"
                ><i class="fa-solid fa-xmark"></i>UNPAID</span
            >
        </button>
        <button
            v-if="showAdd"
            type="button"
            class="add-table-card"
            aria-label="Add the next table"
            @click="$emit('add')"
        >
            <i class="fa-solid fa-plus"></i>
        </button>
    </div>
</template>

<script>
import { createLongPressSortable } from '@/utils/sortable.js'

export default {
    name: 'TableGrid',
    props: {
        tables: { type: Array, default: () => [] },
        selectedTable: { type: Object, default: null },
        showAdd: { type: Boolean, default: false },
        sortable: { type: Boolean, default: false },
    },
    emits: ['select', 'add', 'reorder'],
    data() {
        return {
            sortController: null,
        }
    },
    watch: {
        sortable(enabled) {
            this.sortController?.setDisabled(!enabled)
        },
    },
    mounted() {
        this.sortController = createLongPressSortable(this.$refs.grid, {
            disabled: !this.sortable,
            draggable: '.table-card',
            onReorder: (event) => this.$emit('reorder', event),
        })
    },
    beforeUnmount() {
        this.sortController?.destroy()
        this.sortController = null
    },
    methods: {
        selectTable(table) {
            if (!this.sortController?.shouldSuppressClick())
                this.$emit('select', table)
        },
    },
}
</script>
