<template>
    <div class="rauza-header">
        <h3>Список всех сотрудников</h3>
    </div>
    <div class="rauza-innercontent">
        <MembersList/>
    </div>
</template>

<script>
import MembersList from '../components/MembersList'
export default {
    components: {
        MembersList
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