<template>
    <Teleport to="body">
        <div class="sir-modal-backdrop" @mousedown.self="$emit('close')">
            <section class="sir-modal" role="dialog" aria-modal="true" :aria-label="confirmation ? 'Stock In Confirmation' : 'Stock In Request'">
                <header class="sir-modal__head">
                    <div><span>{{ confirmation ? 'CONFIRMED STOCK IN' : 'STOCK IN REQUEST' }}</span><h2>{{ confirmation ? request.confirmationId : (request.requestNumber || request.id) }}</h2></div>
                    <div class="sir-modal__head-actions">
                        <button type="button" aria-label="Close" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </header>
                <div class="sir-modal__scroll"><StockInRequestDocument :request="request" :confirmation="confirmation" /></div>
                <footer class="sir-modal__actions">
                    <button class="button secondary" type="button" @click="$emit('close')">Close</button>
                    <span></span>
                    <button v-if="confirmable && !confirmation && request.status === 'pending'" class="button primary" type="button" @click="$emit('receive')"><i class="fa-solid fa-check"></i>Confirm Stock In</button>
                    <button class="button primary" type="button" @click="printDocument"><i class="fa-solid fa-print"></i>Print</button>
                </footer>
            </section>
        </div>
    </Teleport>
</template>

<script>
import StockInRequestDocument from '@/components/stock/StockInRequestDocument.vue'

export default {
    name: 'StockInRequestModal',
    components: { StockInRequestDocument },
    props: {
        request: { type: Object, required: true },
        confirmation: { type: Boolean, default: false },
        confirmable: { type: Boolean, default: false },
    },
    emits: ['close', 'receive'],
    beforeUnmount() { this.finishPrint() },
    methods: {
        printDocument() {
            document.body.classList.add('printing-stock-in-request')
            window.removeEventListener('afterprint', this.finishPrint)
            window.addEventListener('afterprint', this.finishPrint, { once: true })
            this.$nextTick(() => window.print())
        },
        finishPrint() {
            window.removeEventListener('afterprint', this.finishPrint)
            document.body.classList.remove('printing-stock-in-request')
        },
    },
}
</script>

<style src="@/assets/css/components/stock-in-request.css"></style>
