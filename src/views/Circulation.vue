<template>
    <div class="rauza-header">
        <h2>Товарооборот</h2>
        <h3>Список всего движения (счет начат с 21 января 2022 13:30)</h3>
    </div>
    <div class="rauza-innercontent">
        <CirculationList/>
    </div>
</template>

<script>
import CirculationList from '../components/CirculationList'
export default {
    components: {
        CirculationList
    },
}
</script>

<style scoped>
    h2 {
        font-weight: bold;
        letter-spacing: .1px;
        display: flex;
        align-items: center;
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