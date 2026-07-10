<template>
    <header class="shop-headerbar">
        <div class="shop-container shop-header-inner">
            <div class="shop-logo" @click="$router.push('/shop')">
                <div class="shop-logo-icon">🛒</div>
                <div>
                    <div class="shop-logo-main">Demo</div>
                    <div class="shop-logo-sub">Online Shopping Mall</div>
                </div>
            </div>

            <div class="shop-search-box">
                <span class="shop-search-icon">⌕</span>
                <input type="text" placeholder="找货源/商品/供应商/求购">
                <button>搜索</button>
            </div>

            <div class="shop-header-actions">
                <span class="shop-user-icon">♙</span>
                <span class="shop-action-text">登录</span>
                <span>或者</span>
                <span class="shop-action-text">注册</span>
                <button class="shop-icon-button">♫</button>
                <button class="shop-icon-button">☏</button>
                <span class="shop-language-dot">●</span>
                <span class="shop-language-arrow">⌄</span>
            </div>
        </div>
    </header>
</template>

<script>
export default {
    name: 'ShopHeaderBar',
}
</script>
