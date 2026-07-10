<template>
    <main class="shop-dashboard-page">
        <div class="shop-container shop-dashboard-container">
            <section class="shop-mobile-search-wrap">
                <div class="shop-search-box shop-mobile-search-box">
                    <span class="shop-search-icon">⌕</span>
                    <input type="text" placeholder="找货源/商品/供应商/求购">
                    <button>搜索</button>
                </div>
            </section>

            <section class="shop-hero-section">
                <Swiper
                    navigation
                    loop
                    :autoplay="{ delay: 3500, disableOnInteraction: false }"
                    class="shop-hero-swiper"
                >
                    <SwiperSlide v-for="banner in banners" :key="banner">
                        <img :src="banner" alt="Shopping Banner">
                    </SwiperSlide>
                </Swiper>
            </section>

            <section class="shop-promo-grid">
                <div class="shop-promo-card shop-promo-sport">
                    <div class="shop-promo-sport-person"></div>
                    <div class="shop-promo-content">
                        <h2>各式各样的运动器材</h2>
                        <button>查看全部</button>
                    </div>
                    <div class="shop-promo-sport-ski"></div>
                </div>

                <div class="shop-promo-card shop-promo-yellow">
                    <div class="shop-promo-lamp"></div>
                    <div class="shop-promo-tags">
                        <span>手工制作的</span>
                        <span>花园</span>
                    </div>
                    <p>查看所有类别</p>
                </div>

                <div class="shop-promo-card shop-promo-product">
                    <div class="shop-promo-arrow">↗</div>
                    <div class="shop-chair-shape"></div>
                    <p>家具</p>
                    <h3>最小的玫瑰扶手椅</h3>
                </div>

                <div class="shop-promo-card shop-promo-product">
                    <div class="shop-promo-arrow">↗</div>
                    <div class="shop-camera-shape"></div>
                    <p>家具</p>
                    <h3>Fujifilm Instax Mini 11</h3>
                </div>

                <div class="shop-promo-card shop-promo-code">
                    <div>
                        <h2>写代码?</h2>
                        <h2>欢迎购物</h2>
                        <p>现在购物</p>
                    </div>
                    <div class="shop-laptop-shape"></div>
                </div>

                <div class="shop-promo-card shop-promo-orange">
                    <div>
                        <h2>找到最好的</h2>
                        <h2>家具!</h2>
                        <button>现在购物</button>
                    </div>
                    <div class="shop-gray-chair-shape"></div>
                </div>
            </section>

            <SectionTitle title="推荐分类" show-more />

            <section class="shop-category-grid">
                <div v-for="category in categories" :key="category.name" class="shop-category-card">
                    <div class="shop-category-img-box">
                        <img :src="category.image" :alt="category.name">
                    </div>
                    <div class="shop-category-name">{{ category.name }}</div>
                </div>
            </section>

            <section class="shop-feature-grid">
                <div class="shop-feature-card shop-feature-purple">
                    <h2>个人的</h2>
                    <h2>卫生用品</h2>
                    <button>现在购物</button>
                </div>

                <div class="shop-feature-card shop-feature-orange">
                    <h2>化妆品</h2>
                    <h2>来自韩国</h2>
                    <button>现在购物</button>
                </div>
            </section>

            <SectionTitle title="推荐产品" />

            <section class="shop-product-grid">
                <ProductCard
                    v-for="product in recommendedProducts"
                    :key="product.id"
                    :product="product"
                />
            </section>

            <SectionTitle title="推荐店铺" />

            <section class="shop-merchant-card">
                <div class="shop-merchant-logo">amazon</div>
                <div class="shop-merchant-info">
                    <h3>Amazon</h3>
                    <p>商品: 560</p>
                    <p>销量 : 0</p>
                    <p>好评率: 100%</p>
                </div>
                <button>访问商店 ›</button>
            </section>

            <SectionTitle title="热销推荐" />

            <section class="shop-product-grid">
                <ProductCard
                    v-for="product in hotProducts"
                    :key="product.id"
                    :product="product"
                />
            </section>

            <section class="shop-bottom-banner-grid">
                <div class="shop-bottom-banner-left">
                    <h2>跨境电商批发商场</h2>
                    <p>品牌特卖 / 折扣不停</p>
                </div>

                <div class="shop-bottom-banner-right">
                    <h2>成为业务分享佣金最高$ 100,000</h2>
                    <p>通过推荐卖家赚取佣金 - 顶级合作伙伴最多可支付100,000美元</p>
                    <button>立即加入</button>
                </div>
            </section>
        </div>

        <button class="shop-scroll-top" @click="scrollTop">▲</button>
    </main>
</template>

<script>
import { Swiper, SwiperSlide } from 'swiper/vue'
import SwiperCore, { Navigation, Autoplay } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'

SwiperCore.use([Navigation, Autoplay])

const SectionTitle = {
    name: 'SectionTitle',

    props: {
        title: {
            type: String,
            required: true,
        },
        showMore: {
            type: Boolean,
            default: false,
        },
    },

    template: `
        <div class="shop-section-title">
            <h2>{{ title }}</h2>
            <span v-if="showMore">全部 ›</span>
        </div>
    `,
}

const ProductCard = {
    name: 'ProductCard',

    props: {
        product: {
            type: Object,
            required: true,
        },
    },

    template: `
        <div class="shop-product-card">
            <button class="shop-heart-button">♡</button>

            <div class="shop-product-img-box">
                <img :src="product.image" :alt="product.name">
            </div>

            <div class="shop-product-price">\${{ product.price }}</div>
            <div class="shop-product-name">{{ product.name }}</div>

            <button class="shop-buy-button">
                <span>立即购买</span>
                <span>🛒</span>
            </button>
        </div>
    `,
}

export default {
    name: 'DashboardPage',

    components: {
        Swiper,
        SwiperSlide,
        SectionTitle,
        ProductCard,
    },

    data() {
        return {
            banners: [
                'https://gallery.shopdemoai.xyz/images/news/2026-02-07/KFuQlSu6EeOYttDvUXIKxSDjFbjYqVWtYVItywvR.jpg',
                'https://gallery.shopdemoai.xyz/images/news/2026-02-07/x0RbJxAEX4lkyg9Gp5Q8TLAX9uV6KGZHFvfUVQhf.jpg',
                'https://gallery.shopdemoai.xyz/images/news/2026-02-07/TsWYMyshL0Ck9kYNPof7M7CUiiYemT2LvPWPBrLe.jpg',
            ],

            categories: [
                {
                    name: '男士服装',
                    image: 'https://gallery.shopdemoai.xyz/images/category/2026-02-07/m4jxFuOq2N1olcBupobm9c5yVhCOOoNlfxMIvabB.jpg',
                },
                {
                    name: '女士服装',
                    image: 'https://gallery.shopdemoai.xyz/images/category/2026-02-07/ikpgLk1e7pIUbVcQxaQxhOiU8Ep2bL6DBdsvT720.jpg',
                },
                {
                    name: '手机配件',
                    image: 'https://gallery.shopdemoai.xyz/images/category/2026-02-07/fQRleG5OGf7vuCEaeRF3hlXjxlwjRIifPHtVGAIw.webp',
                },
                {
                    name: '电脑配件',
                    image: 'https://gallery.shopdemoai.xyz/images/category/2026-02-07/G21GOOPTxbesbhODmw4mK0PDou7xl26Wu0UIh27d.jpg',
                },
            ],

            recommendedProducts: [
                {
                    id: 1,
                    price: '9.20',
                    name: '茉莉花茶 9601 Jasmine Tea 9601 【1kg】',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860de63b00e.jpg',
                },
                {
                    id: 2,
                    price: '45.88',
                    name: 'Wine Of Spain Marcaux Merlot 2016 750ml',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860c037d87c.jpg',
                },
                {
                    id: 3,
                    price: '35.07',
                    name: 'Roceni Reserva Merlot Red Wine 梅洛红酒 500ml',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860c076af98.jpg',
                },
                {
                    id: 4,
                    price: '14.37',
                    name: 'All Kind Of Chinese Tea 大红袍 乌龙茶 茉莉花茶',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860de077bef.jpg',
                },
                {
                    id: 5,
                    price: '41.17',
                    name: 'Red Wine Merlot 750ml Clara Rosy Baron',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860c0517d54.jpg',
                },
                {
                    id: 6,
                    price: '4.02',
                    name: 'HALAL Malaysia Glinter Sparkling Beverage Soft Drink',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860e9799104.jpg',
                },
                {
                    id: 7,
                    price: '11.38',
                    name: '[SINGLE PACK] TAIWAN GABA TEA',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860df799737.jpg',
                },
                {
                    id: 8,
                    price: '1.26',
                    name: 'Sprite Soft Drink Soda 250ml Sprite Lemon Lime',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860e92afba0.jpg',
                },
                {
                    id: 9,
                    price: '2.07',
                    name: '茶叶 中国茶叶 Chinese Tea Series',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860df1a8183.jpg',
                },
                {
                    id: 10,
                    price: '38.52',
                    name: 'Vital Tea Ready Stock 400G / 900G / 1.8KG',
                    image: 'https://gallery.shopdemoai.xyz/images/models/2025-07-09/69860ddf6d734.jpg',
                },
            ],
        }
    },

    computed: {
        hotProducts() {
            return [
                ...this.recommendedProducts,
                ...this.recommendedProducts.map((item) => ({
                    ...item,
                    id: item.id + 100,
                })),
            ]
        },
    },

    methods: {
        scrollTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            })
        },
    },
}
</script>
