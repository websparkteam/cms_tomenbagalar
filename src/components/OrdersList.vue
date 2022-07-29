<template>
    <el-table :data="orders" stripe style="width: 100%;" height="100%" @cell-click="cellClick" v-loading="loading" ref="list">
        <template #empty>
            <el-empty description="Заказов по указанным фильтрам не найдено." v-show="!loading"/>
        </template>
        <template #append>
            <el-button plain type="warning" size="small" style="margin-top: 5px;" @click="lazyLoad" :loading="loading">Показать больше...</el-button>
        </template>
        <el-table-column prop="id" width="200">
            <template #header>
                <div class="header-flex">
                    <div class="header-col">
                        <span>Номер заказа</span>
                        <el-input size="small" placeholder="Поиск..." v-model="filter.orderid" @keydown.enter.prevent="sync(true)"/>
                    </div>
                    <el-button :loading="loadingResetSync" @click="sync(true)" :icon="Refresh" size="medium" circle/>
                </div>
            </template>
            <template #default="scope">
                <div class="row">
                    <img v-if="scope.row.delivery_type==1" width="20" style="margin-right: 10px; border-radius: 5px;" src="../assets/icons/yandex.jpg"/>
                    <img v-else-if="scope.row.delivery_type==2" width="20" style="margin-right: 10px;" src="https://static.tildacdn.com/tild3333-3661-4534-a638-643766356433/favicon.ico"/>
                    <div class="empty" v-else style="width: 30px;"></div>
                    <i class="fi fi-sr-package" v-if="scope.row.type=='2'" style="width: 20px; margin-right: 10px;" title="Самовывоз"></i>
                    <i class="fi fi-sr-truck-side" v-else style="width: 20px; margin-right: 10px;" title="Доставка"></i>
                    <b>#{{scope.row.id}}</b>
                </div>
            </template>
        </el-table-column>
        <el-table-column prop="id" width="180">
            <template #header>
                <span>Статус</span>
                <el-select size="small" v-model="filter.state" @change="filter.orderid = ''; sync(true)">
                    <el-option label="Все" value="100"/>
                    <el-option label="У оператора" value="0"/>
                    <el-option label="На кассе" value="1"/>
                    <el-option label="Приняты кассой" value="2"/>
                    <el-option label="Ожидающие самовывоза" value="4"/>
                    <el-option label="Завершенные" value="5"/>
                    <el-option label="Отмененные" value="-1"/>
                </el-select>
            </template>
            <template #default="scope">
                <el-tag :type="getState(scope.row.state).type" disable-transitions>{{getState(scope.row.state).name}}</el-tag>
            </template>
        </el-table-column>
        <el-table-column prop="fullname" width="250">
            <template #header>
                <span>Имя клиента</span>
                <el-input size="small" v-maska="'+7 (###) ### ##-##'"  placeholder="Поиск по номеру телефона" v-model="filter.phone" @keydown.enter.prevent="sync(true)"/>
            </template>
        </el-table-column>
        <el-table-column prop="creationdate" width="180">
             <template #header>
                <span>Дата создания</span>
                <el-date-picker
                    v-model="filter.timeFrom"
                    size="small"
                    style="width: 100%;"
                    type="date"
                    placeholder="Дата от"
                    :shortcuts="shortcuts"
                    @change="filter.orderid = ''; sync(true)"
                />
            </template>
        </el-table-column>
        <el-table-column label="Итого" width="180">
            <template #default="scope">
                <el-tag :type="'info'" disable-transitions>
                    {{'≈'+((this.orderOp.getOrderTotalPrice(scope.row.cart)+scope.row.delivery_price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')+' ₸')}}
                </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="Комментарии">
            <template #default="scope">
                <template v-if="scope.row?.comments[0]">
                    {{scope.row?.comments[0]?.owner_login}}: <b>{{scope.row?.comments[0]?.text}}</b>
                </template>
                <template v-else></template>
            </template>
        </el-table-column>
    </el-table>
    <div class="filters" v-show="false">
        <i class="fi fi-sr-refresh refreshOrders" ref="refreshOrders" @click="refreshOrders"></i>
        <el-select v-model="filter.state" @change="filter.orderid = ''; sync(true)">
            <el-option label="Все" value="100"/>
            <el-option label="У оператора" value="0"/>
            <el-option label="На кассе" value="1"/>
            <el-option label="Приняты кассой" value="2"/>
            <el-option label="Ожидающие самовывоза" value="4"/>
            <el-option label="Завершенные" value="5"/>
            <el-option label="Отмененные" value="-1"/>
        </el-select>
        <span style="margin-right: 7.5px;">Время: </span>
        с
        <input type="date" placeholder="С" v-model="filter.timeFrom" @change="filter.orderid = ''; sync(true)">
        <span style="margin-right: 7.5px;">по</span>
        <input type="date" placeholder="ПО" v-model="filter.timeTo" @change="filter.orderid = ''; sync(true)">
        <!-- <select v-model="filter.time" @change="filter.orderid = ''; sync(true)">
            <option value="today">За сегодня</option>
            <option value="week">За неделю</option>
            <option value="month">За месяц</option>
            <option value="all">За все время</option>
        </select> -->
        <span>Номер заказа: </span>
        <input style="width: 100px;" type="text"  placeholder="# заказа" >
        <span>Номер телефона: </span>
        <input type="text" >
    </div>
    <div class="header-item" v-show="false">
        <div class="item-col">
            <div class="row" :style="{width: '105px', display: 'flex', alignItems: 'center'}"><i class="fi fi-rs-bell"></i></div>
            <div class="row" :style="{width: w200+'px'}">Статус</div>
            <div class="row" v-for="(i, ind) in rows" :key="ind" :style="{width: i.width}">{{i.name}}</div>
        </div>
        <div class="line"></div>
    </div>
    <div class="orders-list" v-show="false" v-if="ready" @scroll="listScroll">
        <span class="orders-empty" v-if="!orders.length && !loading"><i class="fi fi-sr-expand"></i>Пока что пусто. Обратите внимание на вышестоящий фильтр.</span>
        <div :class="{'item': true, 'selected': activeOrder==ind, 'item-report': i.comments.findIndex(e => e.isReport)!=-1}"
            style="bord"
            :ref="`convitemid${ind}`"
            v-for="(i, ind) in orders" :key="ind"
            @click="activeOrder==ind ? openOrder(i.id) : activeOrder=ind"
            v-on:dblclick="openOrder(i.id)"
        >
            <div class="line" :style="{background: getState(i.state).backgroundColor}"></div>
            <div class="item-row">
                <i v-if="i.comments.findIndex(e => e.isReport)!=-1" :class="{'order-report': true, 'fi-sr-shield-exclamation': getIfWatched(i.id), 'fi-sr-shield-exclamation': !getIfWatched(i.id)}"></i>
                <i v-if="i.reasons.findIndex(e => e.reason_id==3)!=-1 && i.state == 0" :style="{color: 'var(--blue)'}" :class="{'order-report': true, 'fi-sr-undo': true}"></i>
                <div v-else :class="{'watched-circle': true, 'halyk': i.payment_type=='2'}" :style="{opacity: (getState(i.state).role==global.account.role && !getIfWatched(i.id)) ? 0.5 : 0}"></div>
                <img v-if="i.delivery_type==1" width="20" style="margin-right: 10px; border-radius: 5px;" src="../assets/icons/yandex.jpg"/>
                <img v-else-if="i.delivery_type==2" width="20" style="margin-right: 10px;" src="https://static.tildacdn.com/tild3333-3661-4534-a638-643766356433/favicon.ico"/>
                <div class="empty" v-else style="width: 36px;"></div>
                <i class="fi fi-sr-package" v-if="i.type=='2'" style="width: 20px; margin-right: 10px;" title="Самовывоз"></i>
                <i class="fi fi-sr-truck-side" v-else style="width: 20px; margin-right: 10px;" title="Доставка"></i>
                <OrderState :data="i" width="250px" :mobile="true"/>
                <div class="order-title" v-for="(j, jind) in rows" :key="jind" :style="{width: j.width}" v-html="j.return(i)"></div>
            </div>
            <div class="item-data" v-if="activeOrder==ind">
                <div class="item-row" v-if="i.comments.findIndex(e => e.isReport)!=-1">
                    <i class="fi-sr-shield-exclamation"></i>
                    <span>Жалоба от {{i.comments[i.comments.findIndex(e => e.isReport)].owner_login}} ({{orderOp.getRole(i.comments[i.comments.findIndex(e => e.isReport)].owner_role)}}):<strong style="margin-left:5px;">{{i.comments[i.comments.findIndex(e => e.isReport)].text}}</strong></span>
                </div>
                <div class="item-row">
                    <OrderState :data="i" width="250px"/>
                </div>
                <div class="item-row">
                    <template v-if="i.type=='1'">
                        <i class="fi-sr-box-alt"></i>
                        <span>Доставка</span>
                    </template>
                    <template v-else>
                        <i class="fi-sr-location-alt"></i>
                        <span>Самовынос</span>
                    </template>
                </div>
                <div class="item-row">
                    <i class="fi-sr-smartphone"></i>
                    <span><strong>{{mask(i.phone, '+7 (7##) ### ##-##')}}</strong></span>
                </div>
                <div class="item-row">
                    <i class="fi-sr-user"></i>
                    <span>{{i.fullname}} <template v-if="getAge(i.owner_birthday)!=null">({{getAge(i.owner_birthday)}} лет)</template></span>
                </div>
                <div class="item-row">
                    <i class="fi-sr-clock"></i>
                    <span>{{moment(i.createdAt).calendar()}}</span>
                </div>
                <div class="item-row">
                    <i class="fi-sr-shopping-cart"></i>
                    <span>{{i.cart.length}} {{i.cart.length == 1 ? 'товар' : (i.cart.length >= 5 ? 'товаров': 'товара')}} на <strong>{{orderOp.getOrderTotalPrice(i.cart).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</strong></span>
                </div>
            </div>
        </div>
        <div class="item itemloading" v-show="loading"></div>
        <div class="lazyload" v-if="!loading" @click="lazyLoad">Показать больше...</div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import { mask } from 'maska';
import OrderState from './OrderState.vue';
import moment from 'moment';
import {
  Refresh,
} from '@element-plus/icons-vue'
export default {
    data() {
        return {
            ready: false,
            Refresh,
            serverQuery: Function,
            changeMode: Function,
            orderOp: Function,
            orders: [],
            announce: [],
            global: {},
            mask,
            activeOrder: -1,
            loading: true,
            offset: 0,
            loadingOffset: false,
            windowWidth: window.innerWidth,
            rows: [],
            moment,
            w200: 250,
            filter: {
                state: '100',
                timeFrom: moment().format('YYYY-MM-DD'),
                timeTo: moment().format('YYYY-MM-DD'),
                orderid: '',
                phone: ''
            },
            maxOffset: false,
            cartAlternatives: [],
            shortcuts: [
                {
                    text: 'Сегодня',
                    value: moment()
                },
                {
                    text: 'Вчера',
                    value: moment().subtract(1, 'days')
                },
                {
                    text: 'Позавчера',
                    value: moment().subtract(2, 'days')
                },
                {
                    text: '7 дней назад',
                    value: moment().subtract(1, 'weeks')
                },
                {
                    text: 'Месяц назад',
                    value: moment().subtract(1, 'months')
                },
            ],
            tableWrapper: null
        }
    },
    props: ['origin'],
    components: {
        OrderState  
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.changeMode = inject('changeMode');
        this.global = inject('global');
        this.orderOp = inject('orders');
        this.announce = inject('announce');

        this.filter.state = ''+this.roleOrder(this.global?.account?.role);
        this.ready = true;

        this.sync();


        this.updateScreen();
        window.addEventListener('resize', this.updateScreen);
        document.addEventListener('keydown', this._onkeydown);

        let preload_order = new URLSearchParams(window.location.search).get('order');
        if (preload_order) {
            this.openOrder(preload_order);
        }

        this.$nextTick(() => {
            this.tableWrapper = document.querySelector('.el-table__body-wrapper .el-scrollbar__wrap');
            console.log('this.tableWrapper', this.tableWrapper);
            this.tableWrapper.addEventListener('scroll', this.listScroll, false);
        });
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this._onkeydown);
        this.tableWrapper.removeEventListener('scroll', this.listScroll, false);
    },
    methods: {
        _onkeydown(e) {
             console.log(this.activeOrder, this.orders.length)
            if(e.key == 'ArrowDown') {
                e.preventDefault();
                if (this.activeOrder < this.orders.length) {
                    this.activeOrder++;
                }
                if (this.activeOrder == -1) this.activeOrder = 0;
            }
            else if(e.key == 'ArrowUp') {
                e.preventDefault();
                if (this.activeOrder > 0) {
                    this.activeOrder--;
                }
            }
            else if (e.key == 'Enter') {
                this.openOrder(this.orders[this.activeOrder].id);
            }

            if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
                if (this.$refs[`convitemid${this.activeOrder}`]) {
                    let listy = this.$refs.list.scrollTop+this.$refs.list.offsetHeight,
                        y = this.$refs[`convitemid${this.activeOrder}`].offsetTop;
                    console.log(this.$refs.list.scrollTop, y)
                    if ((y > listy) || (y-this.$refs.list.scrollTop) < 120) {
                        this.$refs[`convitemid${this.activeOrder}`].scrollIntoView();
                    }
                }
            }
        },
        updateScreen() {
            if (window.innerWidth < 768) {
                this.w200 = 48;
                this.rows = [
                    {
                        width: '175px',
                        name: 'Номер заказа',
                        return: (i) => `Заказ <strong>#${i.id}</strong>`
                    },
                ];
            }
            else {
                this.w200 = 250;
                this.rows = [
                    {
                        width: '150px',
                        name: 'Номер заказа',
                        return: (i) => `Заказ <strong>#${i.id}</strong>`
                    },
                    {
                        width: '180px',
                        name: 'Заказчик',
                        return: (i) => i.fullname
                    },
                    {
                        width: '160px',
                        name: 'Дата создания',
                        return: (i) => i.creationdate
                    },
                    {
                        width: '120px',
                        name: 'Итого',
                        return: (i) => '≈'+((this.orderOp.getOrderTotalPrice(i.cart)+i.delivery_price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')+' ₸')
                    },
                    {
                        width: '370px',
                        name: 'Комментарии',
                        return: (i) => {
                            let e = i.comments[0];
                            if (!e) return '';
                            return `<span>${e.owner_login}:<b style="margin-left: 5px;">${e.text}</b></span>`;
                        }
                    }
                ];
            }
        },
        cellClick(cell) {
            this.openOrder(cell.id);
        },
        addNewOrder(newOrder) {
            this.orderOp.parseOrder(newOrder);
            if (newOrder.kaspi_id) return;
            if (this.filter.state != '100' && parseInt(this.filter.state) != newOrder.state) return;
            let ind = this.findLastIndex(this.orders, 'state', newOrder.state);
            this.orders.splice(ind+1, 0, newOrder);
        },
        findLastIndex(array, searchKey, searchValue) {
            let index = array.slice().reverse().findIndex(x => x[searchKey] === searchValue),
                count = array.length - 1,
                finalIndex = index >= 0 ? count - index : index;
            return finalIndex;
        },
        async sync(reset) {
            console.log('sync');
            return new Promise((resolve) => {
                (async () => {
                    if (reset) {
                        this.orders.splice(0, this.orders.length);
                        this.offset = 0;
                        this.maxOffset = false;
                    }
                    this.loading = true;
                    let response = await this.serverQuery('admin', 'getOrders', {state: this.filter.state, timeFrom: moment(this.filter.timeFrom).format('YYYY-MM-DD'), timeTo: moment(this.filter.timeTo).format('YYYY-MM-DD'), orderid: this.filter.orderid, phone: this.filter.phone});
                    this.loading = false;
                    if (response.status) {
                        let data = response.data.message;
                        if (data.length <= 0) {
                            this.maxOffset = true;
                        }
                        for(let i in data) {
                            let order = data[i];
                            this.orderOp.parseOrder(order);
                            let ind = this.orders.findIndex(e => e.id == order.id);
                            if (ind != -1) continue;
                            this.orders.push(order);
                        }
                    }
                    resolve(response.data.message.length);
                })();
            });
        },
        openOrder(id) {
            let list = JSON.parse(localStorage.getItem('rauza_watched_list'));
            let ind = list.findIndex(e => e == id);
            if (ind == -1) {
                list.push(id);
                localStorage.setItem('rauza_watched_list', JSON.stringify(list));
            }
            this.global.order_id = id;
            // this.changeMode('Order', {id});
        },
        listScroll(e) {
            let scrollBottom = e.target.scrollTop+e.target.offsetHeight;
            if(scrollBottom > (e.target.scrollHeight-10)) {
                this.lazyLoad();
            }
        },
        async lazyLoad() {
            if (this.loadingOffset || this.maxOffset) return;
            this.loadingOffset = true;
            this.offset += 5;
            console.log('lazy load')
            await this.sync();
            this.loadingOffset = false;
            console.log('Updated!')
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
                case 0: return 0;
                case 1: return 2;
                case 2: return 1;
                case 3: return 0;
                case 4: return 0;
                default: return -2;
            }
        },
        getState(state) {
            switch(state) {
                case 0: return {
                    name: 'У оператора',
                    backgroundColor: 'rgba(252, 137, 71, 0.2)',
                    color: 'rgb(252, 137, 71)',
                    icon: 'fi-sr-headset',
                    role: 3,
                    type: ''
                };
                case 1: return {
                    name: 'На кассе',
                    backgroundColor: 'rgba(251, 81, 165, 0.2)',
                    color: 'rgb(251, 81, 165)',
                    icon: 'fi-sr-box-alt',
                    role: 2,
                    type: 'warning'
                };
                case 2: return {
                    name: 'Ожидает курьера',
                    backgroundColor: 'rgba(77, 16, 254, 0.2)',
                    color: 'rgb(77, 16, 254)',
                    icon: 'fi-sr-ambulance',
                    role: 1,
                    type: 'warning'
                };
                case 3: return {
                    name: 'Доставляется',
                    backgroundColor: 'rgba(216, 255, 0, 1)',
                    color: 'rgb(0, 103, 13)',
                    icon: 'fi-sr-ambulance',
                    type: 'info'
                };
                case 4: return {
                    name: 'Ожидает самовывоза',
                    backgroundColor: 'rgba(216, 255, 0, 1)',
                    color: 'rgb(0, 103, 13)',
                    icon: 'fi-sr-package',
                    type: 'info'
                };
                case 5: return {
                    name: 'Завершен',
                    backgroundColor: 'rgba(1, 128, 15, 0.2)',
                    color: 'rgb(1, 128, 15)',
                    icon: 'fi-sr-check',
                    type: 'success'
                };
                case -1: return {
                    name: 'Отменен',
                    backgroundColor: 'rgba(1, 128, 15, 0.2)',
                    color: 'rgb(1, 128, 15)',
                    icon: 'fi-sr-check',
                    type: 'info'
                };
                default: return {
                    name: 'Заказ поврежден',
                    backgroundColor: 'rgba(251, 81, 81, 0.2)',
                    color: 'rgb(251, 81, 81)',
                    icon: 'fi-sr-cross',
                    role: 3,
                    type: 'danger'
                };
            }
        },
        getIfWatched(id) {
            let list = JSON.parse(localStorage.getItem('rauza_watched_list'));
            let ind = list.findIndex(e => e == id);
            if (ind == -1) return false;
            else return true;
        },
        downloadExcel() {
            document.location.href = 'https://rauza-ade.ru/api/generators/ordersmonth.php?period=today';
        },
        refreshOrders() {
            this.filter.state = ''+this.roleOrder(this.global?.account?.role);
            this.filter.timeFrom = moment().format('YYYY-MM-DD');
            this.filter.timeTo = moment().format('YYYY-MM-DD');
            this.filter.orderid = '';
            this.filter.phone = '';
            this.sync(true);
            this.$refs.refreshOrders.classList.add('animate_refreshOrders');
            setTimeout(() => {
                this.$refs.refreshOrders.classList.remove('animate_refreshOrders');
            }, 500);
        }
    },
}
</script>
<style>
    .el-table__row {
        cursor: pointer;
    }
</style>

<style scoped>
    .orders-list {
        display: flex;
        align-items: center;
        flex-direction: column;
        height: 100%;
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
    .orders-list .item {
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
    .watched-circle.halyk {
        background-image: url('../assets/images/halyk.png');
        background-size: 100%;
        background-color: #FFF;
        transform: scale(1.5);
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
    .filters {
        width: 100%;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
    }
    .filters span {
        margin-left: 20px;
    }
    .filters span:first-child {
        margin-left: 0;
    }
    .orders-empty {
        display: flex;
        align-items: center;
        margin-top: 10px;
        font-weight: bold;
        user-select: none;
    }
    .orders-empty i {
        margin-right: 10px;
    }
    .refreshOrders {
        font-size: 1.3rem; display: flex; align-items: center;
        cursor: pointer;
    }
    .animate_refreshOrders {
        animation: rotate 0.5s;
    }
    @keyframes rotate {
        0% {
            transform: rotate(0);
        }
        100% {
            transform: rotate(360deg);
        }
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
        .filters {
            flex-direction: column;
            align-items: flex-start;
            padding: 0 20px;
            padding-bottom: 5px;
        }
        select {
            margin: 0;
            width: 100%;
            margin-top: 5px;
        }
        .filters span {
            margin-left: 0;
            margin-top: 10px;
        }
        .filters span:first-child {
            margin-top: 0;
        }
        .filters input {
            width: calc(100% - 20px);
            margin-left: 0;
            margin-top: 5px;
        }
        .orders-empty {
            justify-content: center;
            text-align: center;
        }
        .orders-empty i {
            display: none;
        }
    }
    .row {
        width: 100%;
        display: flex;
    }
    .header-flex {
        display: flex;
        align-items: center;
    }
    .header-flex .el-button {
        margin-left: 10px;
    }
    .row img {
        width: 20px;
        height: 20px;
    }
</style>