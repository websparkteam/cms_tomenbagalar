<template>
    <div class="boxrow">
        <div class="header-item">
            <div class="item-col">
                <div class="row" :style="{width: '32px', display: 'flex', alignItems: 'center'}"><i class="fi fi-rs-bell"></i></div>
                <div class="row" v-for="(i, ind) in rows" :key="ind" :style="{width: i.width}">{{i.name}}</div>
            </div>
        </div>
        <div class="convs-list" v-if="ready" @scroll="listScroll" ref="list">
            <div :class="{'item': true, 'selected': activeMember==ind}"
                v-for="(i, ind) in convs" :key="ind"
                @click="activeMember==ind ? openMember(i.id) : activeMember=ind"
            >
                <div class="line" :style="{background: 'var(--blue)'}"></div>
                <div class="item-row">
                    <div class="watched-circle" :style="{opacity: getIfWatched(i) ? 0 : 0.5}"></div>
                    <div class="conv-title" v-for="(j, jind) in rows" :key="jind" :style="{width: j.width}" v-html="j.return(i)"></div>
                </div>
                <div class="item-data" v-if="activeMember==ind">
                    <div class="item-row">
                        <i class="fi-sr-user"></i>
                        <span><strong>{{i.login}}</strong></span>
                    </div>
                    <div class="item-row" v-for="(j, jind) in parseRoleData(i.role_data)" :key="jind">
                        <i :class="j.icon"></i>
                        <span>{{j.text}}</span>
                    </div>
                    <div class="item-row">
                        <i class="fi-sr-file-check"></i>
                        <span>Товаров отредактировано: {{i.descAdded}}</span>
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
import { mask } from 'maska';
import moment from 'moment';
export default {
    data() {
        return {
            ready: false,
            serverQuery: Function,
            changeMode: Function,
            convOp: Function,
            orderOp: Function,
            convs: [],
            global: {},
            mask,
            activeMember: -1,
            loading: true,
            offset: 0,
            loadingOffset: false,
            windowWidth: window.innerWidth,
            rows: [
                {
                    width: '175px',
                    name: 'ID сотрудника',
                    return: (i) => `Сотрудник <strong>#${i.id}</strong>`
                },
                {
                    width: '200px',
                    name: 'Имя',
                    return: (i) => i.fullname ? i.fullname : i.login
                },
                {
                    width: '200px',
                    name: 'Должность',
                    return: (i) => this.orderOp.getRole(i.role)
                },
                {
                    width: '200px',
                    name: 'Последняя активность',
                    return: (i) => moment(i.updatedAt).fromNow()
                }
            ],
            moment
        }
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.changeMode = inject('changeMode');
        this.global = inject('global');
        this.orderOp = inject('orders');

        this.ready = true;

        this.sync();

    },
    methods: {
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
                    let response = await this.serverQuery('admin', 'getAllMembers', {offset: this.offset});
                    this.loading = false;
                    console.log(response);
                    if (response.status) {
                        let data = response.data.message;
                        if (data.length == 0) {
                            this.loadingOffset = true;
                        }
                        for(let i in data) {
                            let memb = data[i];
                            let ind = this.convs.findIndex(e => e.id == memb.id);
                            if (ind != -1) continue;
                            memb.descAdded = 'Загрузка...';
                            if (memb.id == 58) continue; if (memb.id == 57) continue; if (memb.id == 48) continue;
                            this.showDescAdded(memb);
                            this.convs.push(memb);
                        }
                    }
                    resolve(response.data.message.length);
                })();
            });
        },
        openMember(id) {
            this.changeMode('Member', {id})
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
            this.offset += 50;
            let res = await this.sync();
            if (res > 0) this.loadingOffset = false;
            console.log('Updated!')
        },
        async parseRoleData(role_data) {
            let data = JSON.parse(role_data),
                res = [];
            for(let i in data) {
                switch(i) {
                    case 'activeOrders': {
                        res.push({
                            icon: 'fi-sr-time-fast',
                            text: `Активные заказы: ${JSON.parse(data[i]).length}`
                        });
                    } break;
                }
            }
            return res;
        },
        showDescAdded(memb) {
            return new Promise((resolve) => {
                (async() => {
                    let response = (await this.serverQuery('admin', 'getmemberactionhistory', {owner_id: memb.id}))?.data?.message;
                    let oldind = this.activeMember;
                    this.activeMember = -1;
                    memb.descAdded = response;
                    this.activeMember = oldind;
                    resolve();
                })();
            });
        }
    },
}
</script>

<style scoped>
    .convs-list {
        display: flex;
        align-items: center;
        flex-direction: column;
        height: 100%;
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
        animation: newMessage 1s;
        overflow: visible;
        position: relative;
    }
    .item:hover {
        background-color: var(--el-color-info-light-8);
    }
    .item.selected {
        background-color: var(--el-color-info-light-8);
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
    .boxrow {
        height: 100%;
        border-radius: 5px;
        border: 1px solid var(--el-border-color-light);
        box-shadow: var(--el-box-shadow-light);
        overflow: hidden;
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