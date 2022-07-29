<template>
    <div class="filters">
        <span>Показывать: </span>
        <el-select style="width: 150px; margin-right: 20px;" v-model="filter.state" @change="filter.med_id = ''; filter.med_name = ''; sync(true)">
            <el-option value="0" label="Все"></el-option>
            <el-option value="1" label="С карточкой"></el-option>
            <el-option value="2" label="Без карточки"></el-option>
            <el-option value="3" label="Карточки без изображений"></el-option>
            <el-option value="4" label="Карточки без описания"></el-option>
        </el-select>
        <span>Название товара: </span>
        <el-input style="width: 150px;" type="text" v-model="filter.med_name" placeholder="Амбробене" @keydown.enter.prevent="filter.med_id = ''; filter.state='0'; sync(true)"/>
        <span>Артикул товара: </span>
        <el-input style="width: 150px;" type="text" v-model="filter.med_id" placeholder="000000" @keydown.enter.prevent="filter.state='0'; filter.med_name = ''; sync(true)"/>
    </div>
    <div class="boxrow">
        <div class="header-item">
            <div class="item-col">
                <div class="row" :style="{width: '32px', display: 'flex', alignItems: 'center'}"><i class="fi fi-rs-bell"></i></div>
                <div class="row" v-for="(i, ind) in rows" :key="ind" :style="{width: i.width}">{{i.name}}</div>
            </div>
        </div>
        <div class="stock-list" v-if="ready" @scroll="listScroll" ref="list">
            <div :class="{'item': true, 'selected': activeMember==ind}"
                v-for="(i, ind) in stock" :key="ind"
                @click="activeMember==ind ? openItem(i.med_id) : activeMember=ind"
            >
                <div class="line" :style="{background: 'var(--blue)'}"></div>
                <div class="item-row">
                    <div class="watched-circle" :style="{opacity: getIfWatched(i) ? 0 : 0.5}"></div>
                    <div class="conv-title" v-for="(j, jind) in rows" :key="jind" :style="{width: j.width}" v-html="j.return(i)"></div>
                </div>
                <div class="item-data" v-if="activeMember==ind">
                    <div class="item-row">
                        <span>IID: <b>{{i.iid}}</b></span>
                    </div>
                    <div class="item-row">
                        <span>Страна производитель: <b>{{i.country_name}}</b></span>
                    </div>
                    <div class="item-row">
                        <span>Цена в аптеке: <b>{{i.price}}</b> тг.</span>
                    </div>
                </div>
            </div>
            <div class="item itemloading" v-show="loading"></div>
            <div class="lazyload" v-if="!loading" @click="lazyLoad">Показать больше...</div>
        </div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import moment from 'moment';
export default {
    data() {
        return {
            ready: false,
            serverQuery: Function,
            changeMode: Function,
            convOp: Function,
            orderOp: Function,
            stock: [],
            global: {},
            activeMember: -1,
            loading: true,
            offset: 0,
            loadingOffset: false,
            windowWidth: window.innerWidth,
            filter: {
                state: '2',
                med_id: '',
                med_name: '',
            },
            rows: [
                {
                    width: '100px',
                    name: 'Артикул',
                    return: (i) => `<strong>${i.med_id}</strong>`
                },
                {
                    width: '300px',
                    name: 'Название товара',
                    return: (i) => i.med_name
                },
                {
                    width: '200px',
                    name: 'Производитель',
                    return: (i) => i.vendor_name
                },
                {
                    width: '200px',
                    name: 'Тип',
                    return: (i) => i.kind_name
                },
            ],
            moment,
            numbersTotal: null,
            numbersLeft: null
        }
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.changeMode = inject('changeMode');
        this.global = inject('global');
        this.orderOp = inject('orders');

        this.ready = true;

        this.sync();

        if (!localStorage.getItem('watched_stock')) {
            localStorage.setItem('watched_stock', '[]');
        }

        this.getNumbers();
    },
    methods: {
        findLastIndex(array, searchKey, searchValue) {
            let index = array.slice().reverse().findIndex(x => x[searchKey] === searchValue),
                count = array.length - 1,
                finalIndex = index >= 0 ? count - index : index;
            return finalIndex;
        },
        async getNumbers() {
            let response = await this.serverQuery('admin', 'getStockNumbers');
            
            this.numbersTotal = parseInt(response.data.message[0][0]['COUNT(DISTINCT(med_id))']);
            this.numbersLeft = parseInt(response.data.message[1][0]['COUNT(*)']);
            let cardsWithImages = parseInt(response.data.message[2][0]['COUNT(*)']);

            document.querySelector('.rauza-header h3').textContent = `Список всех товаров. ${this.numbersLeft} карточек из ${this.numbersTotal} товаров созданы [${cardsWithImages} карточек с фото]`;
        },
        async sync(reset) {
            return new Promise((resolve) => {
                (async () => {
                    if (reset) {
                        this.stock.splice(0, this.stock.length);
                        this.offset = 0;
                        this.loadingOffset = false;
                    }
                    this.loading = true;
                    let response = await this.serverQuery('admin', 'getStockFilter', {offset: this.offset, state: this.filter.state, med_id: this.filter.med_id, med_name: this.filter.med_name});
                    this.loading = false;
                    console.log(response);
                    if (response.status) {
                        let data = response.data.message;
                        if (data.length == 0) {
                            this.loadingOffset = true;
                        }
                        for(let i in data) {
                            let memb = data[i];
                            this.stock.push(memb);
                        }
                        console.log(this.stock);
                    }
                    resolve(response.data.message.length);
                })();
            });
        },
        openItem(med_id) {
            this.changeMode('Item', {id: med_id})
        },
        getIfWatched(i) {
            let list = JSON.parse(localStorage.getItem('watched_stock'));
            let ind = list.findIndex(e => e.id == i.id);
            if (ind == -1) return false;
            else {
                if (list[ind].updatedAt == i.updatedAt) return true;
                else {
                    list.splice(ind, 1);
                    localStorage.setItem('watched_stock', JSON.stringify(list));
                    return false;
                }
            }
        },
        listScroll(e) {
            let scrollBottom = e.target.scrollTop+e.target.offsetHeight;
            if(scrollBottom > (e.target.scrollHeight-10)) {
                this.lazyLoad();
            }
        },
        async lazyLoad() {
            if (this.loadingOffset) return;
            this.loadingOffset = true;
            this.offset += 20;
            let res = await this.sync();
            if (res > 0) this.loadingOffset = false;
            console.log('Updated!')
        },
    },
}
</script>

<style scoped>
    .stock-list {
        display: flex;
        align-items: center;
        flex-direction: column;
        height: calc(100% - 70px);
        overflow-y: scroll;
        background-color: var(--el-bg-color-overlay);
        color: var(--el-text-color-primary);
        border-radius: 5px;
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
        background-color: var(--el-bg-color-overlay);
        color: var(--el-text-color-primary);
        background-color: var(--el-bg-color-overlay);
        border-top-right-radius: 5px;
        border-top-left-radius: 5px;
        box-shadow: var(--el-box-shadow-lighter);
    }
    .boxrow {
        height: 100%;
        border-radius: 5px;
        border: 1px solid var(--el-border-color-light);
        box-shadow: var(--el-box-shadow-light);
        overflow: hidden;
    }
    .conv-title:nth-child(2){
        margin-left: 0;
    }
    .stock-list .item {
        width: 100%;
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
        background-color: var(--el-color-info-light-8);
    }
    .item[outofstock="true"] {
        background-color: var(--el-color-info-light-8);
        border-radius: 20px;
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
    .conv-report {
        width: 12px;
        height: 12px;
        min-height: 12px;
        margin-right: 20px;
        color: var(--red);
    }
    .itemloading {
        width: 100vw !important;
        height: 254px !important;
        flex-shrink: 0;
        border: 1px solid rgb(166, 57, 254, 0) !important;
        background: linear-gradient(270deg, var(--el-color-info-light-5), var(--el-color-info-light-7), var(--el-color-info-light-5));
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
    .conv-title {
        margin-left: 20px;
        font-weight: 500;
    }
    .filters {
        margin-bottom: 10px;
    }
    .filters .el-input {
        margin-right: 10px;
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
        .header-item {
            width: max-content;
        }
        .stock-list {
            width: max-content;
        }
    }
</style>