<template>
    <div class="shop-layout">
        <HeaderBar />
        <SubHeaderBar />

        <RouterView />

        <FooterBar />
    </div>
</template>

<script>
import '@/assets/css/shop.css'
import HeaderBar from './headerbar/index.vue'
import SubHeaderBar from './subheaderbar/index.vue'
import FooterBar from './footerbar/index.vue'

export default {
    name: 'ShopLayout',

    components: {
        HeaderBar,
        SubHeaderBar,
        FooterBar,
    },
}
</script>
