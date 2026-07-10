<template>
    <main class="pos-dashboard">
        <section class="pos-hero">
            <p>POSFOOD SYSTEM</p>
            <h1>Food Ordering POS</h1>
            <span>Manage orders, menu items, tables and daily sales from one clean workspace.</span>
        </section>

        <section class="pos-grid">
            <article>
                <strong>Orders</strong>
                <span>Track new and completed orders.</span>
            </article>

            <article>
                <strong>Menu</strong>
                <span>Manage food items and availability.</span>
            </article>

            <article>
                <strong>Tables</strong>
                <span>Monitor dine-in table status.</span>
            </article>

            <article>
                <strong>Sales</strong>
                <span>View today revenue summary.</span>
            </article>
        </section>
    </main>
</template>

<script>
export default {
    name: 'POSDashboard',
}
</script>

<style scoped>
.pos-dashboard {
    min-height: 100vh;
    padding: 2rem;
    background: #f7f4ef;
    color: #151515;
    font-family: Arial, sans-serif;
}

.pos-hero {
    padding: 2rem;
    border-radius: 1rem;
    background: #ffffff;
    box-shadow: 0 1rem 2.5rem rgba(20, 20, 20, .08);
}

.pos-hero p {
    margin: 0 0 .5rem;
    color: #f97316;
    font-weight: 900;
    letter-spacing: .16em;
}

.pos-hero h1 {
    margin: 0;
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 1;
}

.pos-hero span {
    display: block;
    margin-top: 1rem;
    color: #666;
}

.pos-grid {
    margin-top: 1rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
}

.pos-grid article {
    min-height: 9rem;
    padding: 1.25rem;
    border-radius: 1rem;
    background: #ffffff;
    box-shadow: 0 .8rem 2rem rgba(20, 20, 20, .06);
}

.pos-grid strong,
.pos-grid span {
    display: block;
}

.pos-grid strong {
    font-size: 1.25rem;
}

.pos-grid span {
    margin-top: .5rem;
    color: #777;
}

@media (max-width: 48rem) {
    .pos-dashboard {
        padding: 1rem;
    }

    .pos-grid {
        grid-template-columns: 1fr 1fr;
    }
}
</style>
