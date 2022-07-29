<template>
    <Order v-if="global.order_id"/>
    <OrdersList/>
</template>

<script>
import { inject } from '@vue/runtime-core'
import OrdersList from '../components/OrdersList'
import Order from '../views/Order.vue'
export default {
    components: {
        OrdersList,
        Order
    },
    data() {
        return {
            global: Object
        }
    },
    mounted() {
        this.global = inject('global');
    }
}
</script>

<style scoped>
    h2 {
        font-weight: bold;
        letter-spacing: .1px;
    }
    .rauza-innercontent {
        height: calc(100% - 62px);
        padding-bottom: 20px;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    @media screen and (max-width: 768px) {
        .rauza-innercontent {
            min-height: calc(100% - 62px);
            height: max-content;
        }
    }
</style>