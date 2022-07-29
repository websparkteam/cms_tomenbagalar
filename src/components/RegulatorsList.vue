<template>
    <div class="header-item">
        <div class="item-col">
            <div class="row" :style="{width: '32px', display: 'flex', alignItems: 'center'}"><i class="fi fi-rs-bell"></i></div>
            <div class="row" v-for="(i, ind) in rows" :key="ind" :style="{width: i.width}">{{i.name}}</div>
        </div>
        <div class="line"></div>
    </div>
    <div class="regulators-list" v-if="ready" @scroll="listScroll" ref="list">
        <span class="regulators-empty" v-if="!regulators.length && !loading"><i class="fi fi-sr-expand"></i>Пока что пусто. Обратите внимание на вышестоящий фильтр.</span>
        <div :class="{'item': true, 'selected': activeCirc==ind}"
            style="bord"
            :ref="`convitemid${ind}`"
            v-for="(i, ind) in regulators" :key="ind"
            @click="activeCirc==ind ? openCirc(i.id) : activeCirc=ind"
            v-on:dblclick="openCirc(i.id)"
        >
            <div class="line" :style="{background: '#0b2239'}"></div>
            <div class="item-row">
                <div class="watched-circle" :style="{opacity: 0.5}"></div>
                <div class="conv-title" v-for="(j, jind) in rows" :key="jind" :style="{width: j.width}" v-html="j.return(i)"></div>
            </div>
            <!-- <div class="item-data" v-if="activeCirc==ind">
                <div class="item-row">
                    <i class="fi-sr-smartphone"></i>
                    <span><strong></strong></span>
                </div>
                <div class="item-row">
                    <i class="fi-sr-user"></i>
                    <span></span>
                </div>
            </div> -->
        </div>
        <div class="item itemloading" v-show="loading"></div>
        <div class="lazyload" v-if="!loading" @click="lazyLoad">Показать больше...</div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import { mask } from 'maska';
import moment from 'moment';
export default {
    data() {
        return {
            ready: false,
            serverQuery: Function,
            socket: Function,
            changeMode: Function,
            orderOp: Function,
            regulators: [],
            global: {},
            mask,
            activeCirc: -1,
            loading: true,
            offset: 0,
            loadingOffset: false,
            windowWidth: window.innerWidth,
            rows: [],
            moment,
            maxOffset: false
        }
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.changeMode = inject('changeMode');
        this.socket = inject('socket');
        this.global = inject('global');
        this.funcs = inject('funcs');

        this.ready = true;

        this.sync();
        

        this.updateScreen();
        window.addEventListener('resize', this.updateScreen);
    },
    beforeUnmount() {
    },
    methods: {
        updateScreen() {
            if (window.innerWidth < 768) {
                this.rows = [
                    {
                        width: '175px',
                        name: 'Период',
                        return: (i) => `За <strong>${moment(i.period, 'YYYY-MM-DD').format('MMMM YYYY')}</strong>`
                    },
                    {
                        width: '250px',
                        name: 'Название товара',
                        return: (i) => i.item_data.formatted_name ?? 'Неизвестно'
                    },
                ];
            }
            else {
                this.rows = [
                    {
                        width: '150px',
                        name: 'Период',
                        return: (i) => `За <strong>${moment(i.period, 'YYYY-MM-DD').format('DD MMMM YYYY')}</strong>`
                    },
                    {
                        width: '80px',
                        name: 'Артикул',
                        return: (i) => i.med_id ?? 'Неизвестно'
                    },
                ];
            }
        },
        findLastIndex(array, searchKey, searchValue) {
            let index = array.slice().reverse().findIndex(x => x[searchKey] === searchValue),
                count = array.length - 1,
                finalIndex = index >= 0 ? count - index : index;
            return finalIndex;
        },
        async sync(reset) {
            console.log('sync');
            this.updateScreen();
            return new Promise((resolve) => {
                (async () => {
                    if (reset) {
                        this.regulators.splice(0, this.regulators.length);
                        this.offset = 0;
                        this.maxOffset = false;
                    }
                    this.loading = true;
                    let response = await this.socket.emit('regulatorsGet', {offset: this.offset});
                    this.loading = false;
                    if (response.status) {
                        let data = response.response;
                        if (data.length <= 0) {
                            this.maxOffset = true;
                        }
                        for(let i in data) {
                            let order = data[i];
                            this.regulators.push(order);
                        }
                        console.log(this.regulators);
                    }
                    resolve(response.response.length);
                })();
            });
        },
        openCirc(id) {
            // alert('В разработке.');
            id
            // let list = JSON.parse(localStorage.getItem('rauza_watched_list'));
            // let ind = list.findIndex(e => e == id);
            // if (ind == -1) {
            //     list.push(id);
            //     localStorage.setItem('rauza_watched_list', JSON.stringify(list));
            // }
            // this.changeMode('Order', {id});
        },
        listScroll(e) {
            let scrollBottom = e.target.scrollTop+e.target.offsetHeight;
            if(scrollBottom > (e.target.scrollHeight-10)) {
                this.lazyLoad();
            }
        },
        async lazyLoad() {
            // if (this.loadingOffset || this.maxOffset) return;
            // this.loadingOffset = true;
            // this.offset += 15;
            // console.log('lazy load')
            // await this.sync();
            // this.loadingOffset = false;
            // console.log('Updated!')
        },
        getAge(dateString) {
            let today = new Date(),
                birthDate = new Date(dateString),
                age = today.getFullYear() - birthDate.getFullYear(),
                m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return isNaN(age) ? null : age;
        },
        roleOrder(role) {
            switch(role) {
                case 1: return 2;
                case 2: return 1;
                case 3: return 0;
                case 4: return 0;
                default: return -2;
            }
        },
    },
}
</script>

<style scoped>
    .regulators-list {
        display: flex;
        align-items: center;
        flex-direction: column;
        height: calc(100% - 210px);
        overflow-y: scroll;
        background-color: #FFF;
        border-radius: 20px;
        border-top-right-radius: 0;
        border-top-left-radius: 0;
        padding: 10px 0;
    }
    .header-item {
        width: 100%;
        height: max-content;
        padding: 15px 20px !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        position: relative;
        background-color: #FFF;
        border-top-right-radius: 20px;
        border-top-left-radius: 20px;
        box-shadow: 0 5px 5px rgba(185, 185, 185, 0.1);
    }
    .header-item .line {
        width: calc(100% - 40px);
        height: 1px;
        background-color: var(--gray);
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translate(-50%);
    }
    .regulators-list .item {
        width: 100%;
        min-height: 50px;
        height: max-content;
        padding: 10px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
        box-sizing: border-box;
        cursor: pointer;
        animation: newMessage 1s;
        overflow: visible;
        position: relative;
    }
    .item:hover {
        background-color: var(--gray);
    }
    .item.selected {
        background-color: rgb(250, 250, 250);
    }
    .item.item-report {
        background-color: rgb(255, 239, 239);
        animation: newMessageRed 1s;
    }
    .item .line {
        width: 5px;
        height: 100%;
        background-color: transparent;
        position: absolute;
        left: 0;
        top: 0;
        opacity: 0;
    }
    .item.selected .line {
        opacity: 1;
    }
    .watched-circle {
        width: 12px;
        height: 12px;
        min-width: 12px;
        min-height: 12px;
        background-color: var(--blue);
        opacity: 0.5;
        border-radius: 50%;
        margin-right: 20px;
    }
    .order-report {
        width: 12px;
        height: 12px;
        min-height: 12px;
        margin-right: 20px;
        color: var(--red);
    }
    .itemloading {
        width: 100% !important;
        height: 254px !important;
        flex-shrink: 0;
        border: 1px solid rgb(166, 57, 254, 0) !important;
        background: linear-gradient(270deg, #cccccc, #e9e9e9, #cccccc);
        background-size: 400% 400%;

        animation: flicker-loading 2s infinite !important;
    }
    .item-data {
        width: 100%;
        margin-top: 10px;
    }
    .item-data i {
        margin-right: 10px;
    }
    .item-data span {
        font-weight: 500;
    }
    .item-data .item-row {
        margin-bottom: 10px;
    }
    .item-row {
        width: 100%;
        align-items: center;
        display: flex;
        flex-direction: row;
    }
    .item-row span {
        letter-spacing: 1px;
    }
    .lazyload {
        width: calc(100% - 40px);
        border-radius: 10px;
        background-color: rgba(166, 57, 254, 0.2);
        color: rgb(166, 57, 254);
        font-weight: bold;
        padding: 5px 10px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        cursor: pointer;
        margin: 20px 0;
    }
    .lazyload:hover {
        background-color: rgba(166, 57, 254, 0.1);
    }
    .ripple {
        position: absolute;
        background-color: rgb(150, 150, 150);
        transform: translate(-50%, -50%);
        pointer-events: none;
        border-radius: 50%;
        animation: animate .9s ease;
        cursor: pointer;
    }
    .order-title {
        margin-left: 20px;
        font-weight: 500;
    }
    .regulators-empty {
        display: flex;
        align-items: center;
        margin-top: 10px;
        font-weight: bold;
        user-select: none;
    }
    .regulators-empty i {
        margin-right: 10px;
    }
    .item-col .row {
        margin: 0;
        margin-left: 10px;
    }
    .item-col .row:first-child {
        margin: 0;
    }
    .conv-title{
        margin: 0;
        margin-left: 10px;
    }
    @keyframes animate {
        0% {
            width: 0px;
            height: 0px;
            opacity: 0.4;
        }
        100% {
            width: 300px;
            height: 300px;
            opacity: 0;
        }
    }
    @media screen and (max-width: 768px){
        .regulators-empty {
            justify-content: center;
            text-align: center;
        }
        .regulators-empty i {
            display: none;
        }
    }
</style>