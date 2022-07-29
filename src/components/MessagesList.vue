<template>
    <div class="rauza-header">
        <h2>Сообщения</h2>
        <h3>Список всех сообщений</h3>
    </div>
    <div class="header-item">
        <div class="item-col">
            <div class="row" :style="{width: '32px', display: 'flex', alignItems: 'center'}"><i class="fi fi-rs-bell"></i></div>
            <div class="row" v-for="(i, ind) in rows" :key="ind" :style="{width: i.width}">{{i.name}}</div>
        </div>
        <div class="line"></div>
    </div>
    <div class="convs-list" v-if="ready" @scroll="listScroll" ref="list">
        <div :class="{'item': true, 'selected': activeConv==ind}"
            v-for="(i, ind) in convs" :key="ind"
            @click="openConv(i)"
        >
            <div class="line" :style="{background: 'var(--blue)'}"></div>
            <div class="item-row">
                <div class="watched-circle" :style="{opacity: getIfWatched(i) ? 0 : 0.5}"></div>
                <div class="conv-title" v-for="(j, jind) in rows" :key="jind" :style="{width: j.width}" v-html="j.return(i)"></div>
            </div>
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
            convOp: Function,
            convs: [],
            global: {},
            mask,
            activeConv: -1,
            loading: true,
            offset: 0,
            loadingOffset: false,
            windowWidth: window.innerWidth,
            rows: [
                {
                    width: '130px',
                    name: 'Номер беседы',
                    return: (i) => `Беседа <strong>#${i.id}</strong>`
                },
                {
                    width: '200px',
                    name: 'Данные',
                    return: (i) => i.fullname ? i.fullname : i.ip
                },
                {
                    width: '300px',
                    name: 'Последнее сообщение',
                    return: (i) =>  i.last_message ? (i.last_message.sender == 1 ? '<div class="last-read"><i class="fi-sr-check"></i>Отвечено</div>' : '<b>'+i.last_message.message+'</b>') : '<div class="last-empty">Нет сообщений...</div>'
                },
                {
                    width: '200px',
                    name: 'Время',
                    return: (i) =>  moment(i.updatedAt).add(6, 'hours').fromNow()
                }
            ],
            moment
        }
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.changeMode = inject('changeMode');
        this.socket = inject('socket');
        this.global = inject('global');

        this.ready = true;

        this.sync();

        this.socket.addEventListener('message', this.socketOnMessage);
    },
    beforeUnmount() {
        // this.socket.removeEventListener('message', this.socketOnMessage);
    },
    methods: {
        socketOnMessage(json) {
            json
            // let response = JSON.parse(json.data);
            // console.log(response);
            // switch(response.query) {
                
            // }
        },
        findLastIndex(array, searchKey, searchValue) {
            let index = array.slice().reverse().findIndex(x => x[searchKey] === searchValue),
                count = array.length - 1,
                finalIndex = index >= 0 ? count - index : index;
            return finalIndex;
        },
        async sync() {
            return new Promise((resolve) => {
                (async () => {
                    this.loading = true;
                    let response = await this.serverQuery('admin', 'getAllConversations', {offset: this.offset});
                    console.log('getAllConversations', response);
                    this.loading = false;
                    if (response.status) {
                        let data = response.data.message;
                        if (data.length == 0) {
                            this.loadingOffset = true;
                        }
                        for(let i in data) {
                            let conv = data[i];
                            let ind = this.convs.findIndex(e => e.id == conv.id);
                            if (ind != -1) continue;
                            this.convs.push(conv);
                        }
                    }
                    resolve(response.data.message.length);
                })();
            });
        },
        openConv(i) {
            let list = JSON.parse(localStorage.getItem('rauza_watched_convs'));
            let ind = list.findIndex(e => e.id == i.id);
            console.log(list);
            if (ind == -1) {
                list.push({id: i.id, updatedAt: i.updatedAt});
                localStorage.setItem('rauza_watched_convs', JSON.stringify(list));
            }
            this.changeMode('Conversation', {id: i.id})
        },
        getIfWatched(i) {
            let list = JSON.parse(localStorage.getItem('rauza_watched_convs'));
            let ind = list.findIndex(e => e.id == i.id);
            if (ind == -1) return false;
            else {
                if (list[ind].updatedAt == i.updatedAt) return true;
                else {
                    list.splice(ind, 1);
                    localStorage.setItem('rauza_watched_convs', JSON.stringify(list));
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

<style>
    .last-read {
        display: flex;
        align-items: center;
        color: #008759;
    }
    .last-read i{
        display: flex;
        align-items: center;
        margin-right: 5px;
    }
    .last-empty {
        display: flex;
        align-items: center;
        color: #8B8B8B;
        font-style: italic;
    }
</style>
<style scoped>
    .convs-list {
        display: flex;
        align-items: center;
        flex-direction: column;
        height: calc(100% - 170px);
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
    .conv-title:nth-child(2){
        margin-left: 0;
    }
    .convs-list .item {
        width: 100%;
        height: max-content;
        padding: 10px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
        box-sizing: border-box;
        cursor: pointer;
        animation: opacityMessage .7s;
        overflow: visible;
        position: relative;
    }
    @keyframes opacityMessage {
        0% {opacity: 0.5;}
        100% {opacity: 1;}
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
    .conv-report {
        width: 12px;
        height: 12px;
        min-height: 12px;
        margin-right: 20px;
        color: var(--red);
    }
    .itemloading {
        width: 100%;
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
    .conv-title {
        margin-left: 20px;
        font-weight: 500;
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
        .convs-list {
            width: max-content;
        }
    }
</style>