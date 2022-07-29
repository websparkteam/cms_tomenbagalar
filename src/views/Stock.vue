<template>
    <div class="rauza-header">
        <h2>База данных</h2>
        <h3>Список всех товаров (обновлено, 23.11.2021)</h3>
    </div>
    <div class="rauza-innercontent">
        <StockList/>
    </div>
</template>

<script>
import StockList from '../components/StockList'
export default {
    components: {
        StockList
    }
}
</script>

<style scoped>
    h2 {
        font-weight: bold;
        letter-spacing: .1px;
    }
    .rauza-innercontent {
        height: 100%;
        overflow-y: scroll;
        padding-top: 5px;
        padding-bottom: 20px;
        display: flex;
        flex-direction: column;
    }
</style>