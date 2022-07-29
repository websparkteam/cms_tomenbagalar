<template>
    <div class="rauza-header">
        <h3>Список всех клиентов</h3>
    </div>
    <div class="rauza-innercontent">
        <ClientsList/>
    </div>
</template>

<script>
import ClientsList from '../components/ClientsList'
export default {
    components: {
        ClientsList
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