<template>
    <h2>Добро пожаловать.</h2>
    <h3>Мои активные заказы:</h3>
    <h4>По поводу вопросов и багов: +7 (707) 2002-940 Темирлан</h4>
    <div class="rauza-innercontent">
        <OrdersList origin="getActiveOrders"/>
    </div>
</template>

<script>
import OrdersList from '../components/OrdersList'
export default {
    components: {
        OrdersList
    }
}
</script>

<style scoped>
    h3 {
        font-weight: 400;
        margin-top: 10px;
    }
</style>