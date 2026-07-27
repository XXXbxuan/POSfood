<template>
    <div class="inv-toast-stack" aria-live="polite">
        <button
            v-for="toast in store.state.toasts"
            :key="toast.id"
            type="button"
            class="inv-toast"
            :class="`is-${toast.tone}`"
            @click="store.removeToast(toast.id)"
        >
            <i
                class="fa-solid"
                :class="toast.tone === 'danger' ? 'fa-circle-exclamation' : 'fa-circle-check'"
            ></i>
            {{ toast.message }}
        </button>
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'ToastStack',
    data: () => ({ store: inventoryStore }),
}
</script>
