<template>
    <nav class="shop-subheaderbar">
        <div class="shop-container shop-subheader-inner">
            <a v-for="item in menuList" :key="item">{{ item }}</a>
        </div>
    </nav>
</template>

<script>
export default {
    name: 'ShopSubHeaderBar',

    data() {
        return {
            menuList: [
                '首页',
                '分类',
                '商品',
                '折扣商品',
                '商家入驻',
                '信贷服务',
            ],
        }
    },
}
</script>
