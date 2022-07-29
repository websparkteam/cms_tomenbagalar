<template>
  <div v-if="ready" :class="{'state': true, 'mobile': mobile}" :style="{backgroundColor: getState.backgroundColor, color: getState.color, width, marginLeft}">
        <i :class="getState.icon"></i>
        <span v-html="getState.name"></span>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
export default {
    props: ['data', 'width', 'marginLeft', 'mobile'],
    data() {
        return {
            funcs: Object,
            orderStates: {},
            ready: false
        }
    },
    mounted() {
        this.funcs = inject('funcs');
        this.orderStates = inject('orderStates');

        this.ready = true;
    },
    methods: {
        pharmaName(value) {
            let pharma_ind = this.funcs.pharmacies.findIndex(e=>e.value == value);
            if (pharma_ind == -1) return;
            return this.funcs.pharmacies[pharma_ind].short;
        },
    },
    computed: {
        getState() {
            switch(this.orderStates[this.data.id]) {
                case 0: return {
                    name: '<b>У оператора</b>',
                    backgroundColor: 'rgba(252, 137, 71, 0.2)',
                    color: 'rgb(252, 137, 71)',
                    icon: 'fi-sr-headset'
                };
                case 1: return {
                    name: `На кассе <b>${this.pharmaName(this.data.pharmacy)}</b>`,
                    backgroundColor: 'rgb(255 165 209 / 20%)',
                    color: 'rgb(193 0 95)',
                    icon: 'fi-sr-box-alt'
                };
                case 2: return {
                    name: `Принята кассой <b>${this.pharmaName(this.data.pharmacy)}</b>`,
                    backgroundColor: 'rgb(163 131 255 / 20%)',
                    color: 'rgb(77, 16, 254)',
                    icon: 'fi-sr-checkbox'
                };
                case 3: return {
                    name: '<b>Ожидает подтверждения</b>',
                    backgroundColor: 'rgba(216, 255, 0, 1)',
                    color: 'rgb(0, 103, 13)',
                    icon: 'fi-sr-clock'
                };
                case 4: return {
                    name: '<b>Ожидает самовывоза</b>',
                    backgroundColor: 'rgba(216, 255, 0, 1)',
                    color: 'rgb(0, 103, 13)',
                    icon: 'fi-sr-package'
                };
                case 5: return { // Пробит чек
                    name: '<b>Завершен</b>',
                    backgroundColor: 'rgba(1, 128, 15, 0.2)',
                    color: 'rgb(1, 128, 15)',
                    icon: 'fi-sr-check'
                };
                case -1: return {
                    name: '<b>Отменен</b>',
                    backgroundColor: '#e5e5e5',
                    color: 'rgb(124, 124, 124)',
                    icon: 'fi-sr-ban'
                };
                case -2: return {
                    name: '<b>Возвращается</b>',
                    backgroundColor: '#e5e5e5',
                    color: 'rgb(124, 124, 124)',
                    icon: 'fi-sr-ban'
                };
                default: return {
                    name: '<b>Заказ поврежден</b>',
                    backgroundColor: 'rgba(251, 81, 81, 0.2)',
                    color: 'rgb(251, 81, 81)',
                    icon: 'fi-sr-cross'
                };
            }
        },
    },
}
</script>

<style scoped>
    .state {
        border-radius: 10px;
        padding: 5px 10px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
    }
    .state i {
        margin-right: 10px;
    }
    @media screen and (max-width: 768px){
        .mobile {
            width: 36px !important;
        }
        .mobile i {
            margin-right: 0;
        }
        .mobile span {
            display: none;
        }
    }
</style>