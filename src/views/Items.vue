<template>
    <div class="rauza-header">
        <h3>Список всех товаров</h3>
    </div>
    <div class="rauza-innercontent">
        <ItemsList/>
    </div>
</template>

<script>
import ItemsList from '../components/ItemsList'
export default {
    components: {
        ItemsList
    }
}
</script>

<style scoped>
    h2 {
        font-weight: bold;
        letter-spacing: .1px;
    }
    .rauza-innercontent {
        height: calc(100% - 55px);
        overflow-y: scroll;
        display: flex;
        flex-direction: column;
    }
</style>