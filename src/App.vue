<template>
    <Auth v-if="ready && !global.account.login"/>
    <div class="common-layout" v-if="ready && global.account.login">
        <el-container>
            <el-aside width="200px">
                <Menu/>
            </el-aside>
            <el-container>
                <el-header>
                    <h1 class="del__margin-block">{{global.account.fullname ? global.account.fullname : global.account.login}} ({{getRole(global.account.role)}})</h1>
                </el-header>
                <el-main>
                    <router-view/>
                </el-main>
            </el-container>
        </el-container>
        <div class="rauza-confirmer" v-if="confirmer.active">
            <div class="rauza-window">
                <h3 v-html="confirmer.label"></h3>
                <el-input :title="confirmer.valuePlaceholder" v-if="confirmer.needsValue != 'select' && confirmer.needsValue" v-model="confirmer.value" marginTop='20px'/>
                <select v-if="confirmer.needsValue == 'select'" v-model="confirmer.value">
                    <option v-for="(i, ind) in confirmer.valuePlaceholder" :key="ind" :value="i.code">{{i.text}}</option>
                </select>
                <div class="oneliner">
                    <el-button @click="confirmer.func(confirmer.value); confirmer.active = false; confirmer.needsValue = false; confirmer.value = '';">{{confirmer.needsValue ? 'Отправить' : 'Да'}}</el-button>
                    <el-button @click="confirmer.active = false">{{confirmer.needsValue ? 'Закрыть' : 'Нет'}}</el-button>
                </div>
            </div>
        </div>
    </div>
    <!-- <div class="rauza-main" v-if="ready && global.account.login">
       
        <Announces/>
        <div class="rauza-confirmer" v-if="confirmer.active">
            <div class="rauza-window">
                <h3 v-html="confirmer.label"></h3>
                <RauzaInput :title="confirmer.valuePlaceholder" v-if="confirmer.needsValue != 'select' && confirmer.needsValue" v-model="confirmer.value" marginTop='20px'/>
                <select v-if="confirmer.needsValue == 'select'" v-model="confirmer.value">
                    <option v-for="(i, ind) in confirmer.valuePlaceholder" :key="ind" :value="i.code">{{i.text}}</option>
                </select>
                <div class="oneliner">
                    <button @click="confirmer.func(confirmer.value); confirmer.active = false; confirmer.needsValue = false; confirmer.value = '';">{{confirmer.needsValue ? 'Отправить' : 'Да'}}</button>
                    <button @click="confirmer.active = false">{{confirmer.needsValue ? 'Закрыть' : 'Нет'}}</button>
                </div>
            </div>
        </div>
        <div class="rauza-content">
            <div class="header">                
                <div class="user">
                    <h2 class="title">{{global.account.fullname ? global.account.fullname : global.account.login}}</h2>
                    <h4 class="sub-title">{{getRole(global.account.role)}}</h4>
                </div>
            </div>
            
            <div class="padding">
                <Item v-if="global.editingItem.active"/>
                <router-view/>
            </div>
        </div>
    </div> -->
</template>

<script>
import { provide, computed } from 'vue'
import { useRoute } from 'vue-router'
import $axios from 'axios';

import Menu from './components/Menu'
import Auth from './components/Auth'
// import Announces from './components/Announces'
// import RauzaInput from './components/RauzaInput'
// import Item from './components/Item'
// import Technical from './components/Technical.vue';

import moment from 'moment';
import localization from 'moment/locale/ru'
export default {
    components: {
        Menu,
        Auth,
        // Announces,
        // RauzaInput,
        // Item,
        // Technical
    },
    data() {
        return {
            ready: false,
            global: {
                account: {},
                order_id: null,
                mode: computed(() => useRoute().name),
                editingItem: {
                    active: false,
                    data: {}
                }
            },
            axios: Object,
            announce: [],
            confirmer: {
                active: false,
                label: '',
                needsValue: false,
                value: '',
                valuePlaceholder: '',
                func: () => {}
            },
            catalogsData: {},
            technical: false,
            pharmacies: [
                {
                    value: '-1',
                    text: 'Не выбрано (Клиент просит ближайший)',
                    short: 'Не выбрано'
                },
                {
                    value: '1',
                    text: 'Аптека Низких Цен на Туркестан, 8/2',
                    short: 'Туркестан, 8/2'
                },
            ],
            sounds: {},
            orderStates: {}
        }
    },
    mounted() {
        let baseURL = 'https://api.tomenbagalar.kz/api/';

        //baseURL = 'http://webspark.beget.tech/api/';
		// if(process.env.NODE_ENV == "development") {
		// 	baseURL = 'http://localhost:8888/zelenka_api/';
		// }
		this.axios = $axios.create({
			baseURL,
			timeout: 40000,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		});
		provide('global', computed(() => this.global));
        provide('announce', computed(() => this.announce));
        provide('catalogsData', computed(() => this.catalogsData));
        provide('orderStates', computed(() => this.orderStates));
        provide('funcs', {arrayify_parse: this.arrayify_parse, chooseImage: this.chooseImage, pharmacies: this.pharmacies});

        provide('serverQuery', this.serverQuery);
        provide('serverFile', this.serverFile);
        provide('sounds', this.sounds);

        provide('changeMode', this.changeMode);
        provide('confirmer', this.showConfirmer);
        provide('orders', {parseOrder: this.parseOrder, getOrderTotalPrice: this.getOrderTotalPrice, getRole: this.getRole, rolesList: this.rolesList});

        if (!localStorage.getItem('rauza_watched_list')) localStorage.setItem('rauza_watched_list', '[]');
        if (!localStorage.getItem('rauza_watched_convs')) localStorage.setItem('rauza_watched_convs', '[]');
        if (!localStorage.getItem('rauza_checked_items')) localStorage.setItem('rauza_checked_items', '[]');

        this.sounds['message'] = new Audio(require('./assets/sounds/message.mp3'));

        this.ready = true;
	},
    methods: {
        changeMode(mode, params) {
			this.$router.push({ name: mode, params });
			window.scrollTo(0, 0);
		},
		serverQuery(url, query, args) {
			if (args === undefined) args = {};
			return new Promise((resolve) => {
				var params = new URLSearchParams();
				params.append('query', query);
                params.append('account_id', this.global.account.id);
                params.append('account_password', this.global.account.password);
				for(let i in args) {
					params.append(i, args[i]);
				}
                let x = `/${url}/`;
                if (url == '/') x = '/';
				this.axios.post(x, params).then(response => {
					let data = response.data;
					console.log(data);
					if (data.status == 'OK') { 
						resolve({status: true, data});
					}
					else {
						resolve({status: false, data});
					}
				}).catch(() => {
					resolve({status: false});
				});
			});
		},
        serverFile(query, files, additional) {
			if (additional === undefined) additional = {};
			return new Promise((resolve) => {
				let sizeMB = files.size / 1024 / 1024;
				if (sizeMB > 500) {
					this.announce.push({type: 'E', message: 'Ограничение по размеру файла: 500 MB.'}); 
					resolve(-1);
					return;
				}

				let formData = new FormData();
				formData.append('query', query);
                formData.append('account_id', this.global.account.id);
                formData.append('account_password', this.global.account.password);
				for(let i in additional) {
					formData.append(i, additional[i]);
				}
			
				formData.append('file', files);

				this.axios({
					url: `/admin/`,
					method: 'POST',
					data: formData,
					headers: {
						'Content-Type': 'multipart/form-data',
					},
					timeout: 0,
					onUploadProgress: (e) => {
						if (additional.progress) additional.progress(e);
					}
				}).then(response => {
					let data = response.data;
					console.log(data);
					if (data.status == 'OK') { 
						resolve({status: true, data: data});
					}
					else {
						for(let i in data.errors) {
							this.announce.push({type: 'E', message: data.errors[i]});
						}
						resolve({status: false});
					}
				});
			});
		},
        // Orders
        parseOrder(order) {
            order.id = parseInt(order.id);
            order.state = parseInt(order.state);
            order.delivery_price = parseInt(order.delivery_price);
            order.delivery_type = parseInt(order.delivery_type);
            
            order.cart = JSON.parse(order.cart);
            order.creationdate = moment(order.creationdate).locale("ru", localization).fromNow();

            order.coords = order.coords == '' ? false : JSON.parse(order.coords);
            order.comments = JSON.parse(order.comments);
            order.reasons = JSON.parse(order.reasons);
            order.promo = order.promo ? JSON.parse(order.promo) : null;
            if(order.servingId) order.servingId = JSON.parse(order.servingId);

            this.orderStates[order.id] = order.state;
        },
        chooseImage(data) {
			let mainImage = '',
				extraImage = '';
			data.item_data?.images.forEach(e => {
				if(e.split('/')[0] == 'https:' || e.split('/')[0] == 'http:') {
					extraImage = e.split('/')[5];
				}
				else {
					mainImage = e;
				}
			});
            let url = 'https://rauza-ade.ru/resources/compressed/';
			if (mainImage) return `${url}${mainImage}`;
			if (!mainImage && extraImage) return `https://rauza-ade.ru/resources/old-products/${extraImage}`;
			if (!mainImage && !extraImage) return require('./assets/images/no-image.jpg');
		},
        getOrderTotalPrice(cart) {
            let total = 0;
            cart.forEach((e) => total+=(parseInt(e.price)*e.amount));
            return total;
        },
        showConfirmer(label, func, needsValue, placeholder) {
            this.confirmer.label = label;
            this.confirmer.needsValue = needsValue;
            this.confirmer.valuePlaceholder = placeholder;
            if (needsValue == 'select') {
                this.confirmer.value = this.confirmer.valuePlaceholder[0].code;
            }
            this.confirmer.func = func;
            this.confirmer.active = true;
        },
        getRole(role) {
            switch(parseInt(role)) {
                case -2: return 'Kaspi';
                case -1: return 'ИнфоАптека';
                case 0: return 'Гость';
                case 1: return 'Курьер';
                case 2: return 'Сборщик';
                case 3: return 'Оператор';
                case 4: return 'Директор';

                case 5: return 'Редактор описаний';
                default: return 'Ошибка в роли';
            }
        },
        logout() {
            delete this.global.account.login;
            localStorage.removeItem('rauzaadmin');
            this.changeMode('Home');
        },
        product_parse(obj) {
			obj.item_data.price = parseInt(obj.item_data.price);
			if (obj.item_data) {
				obj.item_data.images = JSON.parse(obj.item_data?.images);
			}
		},
        arrayify_parse(obj, arr) {
            for(let i in obj) {
                let items = obj[i][0],
                    item_data = obj[i][1];

                let cheapest = Infinity,
                    item = {};
                for(let i in items) {
                    items[i].price = parseInt(items[i].price);
                    if (items[i].price < cheapest) {
                        cheapest = items[i].price;
                        item = items[i];
                    }
                }
                item.item_data = item_data;

                this.product_parse(item);
                arr.push(item);
            }
            arr.sort((a, b) => a.price - b.price);
        },
    },
    computed: {
        rolesList() {
            return [
                {id: 0, name: 'Гость'},
                {id: 1, name: 'Курьер'},
                {id: 2, name: 'Сборщик'},
                {id: 3, name: 'Оператор'},
                {id: 4, name: 'Директор'},
                {id: 5, name: 'Редактор описаний'},
            ]
        },
    }
}
</script>

<style>
@import url('./assets/icons/uicons-solid-rounded.css?v=1231');
/* @import url('./assets/icons/uicons-regular-straight.css?v=1242'); */
@import url('./assets/styles/uicons-regular-straight.css');
@import url('https://cdn-uicons.flaticon.com/uicons-regular-straight/css/uicons-regular-straight.css');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@200;300;400;700&display=swap');

@import url('./assets/uicons-solid-rounded/css/uicons-solid-rounded.css');
* {
    --main-color: rgb(74,210,149); /* rgb(0,170,81); */
    --alfa-main-color: rgb(239,248,243);
    --border: #e7e9ef;

    --pink: rgba(230, 221, 255);
    --black: #2c3e50;

    --gray: rgb(243, 246, 254);
    --purple: rgb(77, 60, 226);
    --blue: hsl(167deg 66% 50%);
    --red: rgb(251, 83, 127);

    margin-block-start: 0;
    margin-block-end: 0;
}
.common-layout, .el-container {
    height: 100%;
}
.el-aside, .el-menu {
    height: 100%;
}
.el-message__content , .el-scrollbar, .el-picker-panel{
    font-family: Roboto, Helvetica, Arial, sans-serif;
}
.el-header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--el-menu-border-color);
}
.el-header h1 {
    margin: 0;
}
h1, h2, h3, h4, h5, h6 {
    color: var(--el-text-color-regular);
    margin-bottom: 10px;
}
.el-divider__text {
    display: flex;
    align-items: center;
}
.el-divider__text .el-icon {
    margin-right: 5px;
}
body{
    background-color: #e7ebf0;
}
#app {
    width: 100%;
    height: 100%;
    font-family: Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--el-bg-color-page);

    /* Firefox Scroll bar */
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0);
}
body {
    margin: 0;
    width: 100vw;
    height: 100vh;
}
.rauza-main {
    width: 100%;
    overflow: hidden;
    height: 100%;
    display: flex;
}
.rauza-content {
    width: calc(100% - 200px);
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}
.padding {
    width: 100%;
    height: calc(100% - 50px); 
    padding: 10px 20px 0 20px;
    box-sizing: border-box;
    position: relative;
}
.rauza-innercontent {
    margin-top: 10px;
}
.rauza-header {
    display: flex;
    flex-direction: column;
    padding-bottom: 10px;
    box-sizing: border-box;
}
.rauza-header h3 {
    color: rgb(170, 170, 170);
    font-weight: lighter;
}
.rauza-back {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100px;
    height: 35px;
    padding-right: 5px;
    margin-right: 10px;
    border: 2px solid var(--border);
    border-radius: 100px;
    background-color: #fff;
    color: #708088;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
}
.rauza-back:hover{
    color: var(--black);
    border-color: #ccc;
}
i {
    display: flex;
    align-items: center;
    align-content: center;
}
.rauza-confirmer {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000000;
    background-color: rgb(133, 133, 133, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}
.rauza-confirmer .rauza-window {
    background-color: var(--el-bg-color-overlay);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
}
.rauza-confirmer .rauza-window button {
    margin-top: 10px;
}



/*  ==========  ORDER TABLE SECTION  ==========  */
.rauza-table-wrap{
    width: 100%;
    padding: 15px 10px;
    box-sizing: border-box;
    background-color: var(--el-bg-color-overlay);
    border-radius: 4px;
    border-left: 2px solid var(--main-color);
    overflow-x: auto;
}
.rauza-table-header{
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 12px;
    padding-top: 0;
    box-sizing: border-box;
}
.rauza-table-header .title{
    display: flex;
    align-items: center;
    font-size: 14px;
    text-transform: uppercase;
}
.rauza-table{
    width: 100%;
    min-width: 650px;
    white-space: nowrap;
    overflow-x: auto;
}
.rauza-table thead td{
    font-size: 14px;
    font-weight: 600;
    border-top: 1px solid var(--border);
}
.rauza-table td{
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    max-width: 600px;
    word-break: break-all;
}
.excel-button{
    display: flex;
    align-items: center;
    justify-content: center;
    width: 130px;
    height: 33px;
    border: 1px solid var(--border);
    border-radius: 3px;
    font-size: 12px;
    color: #21a366;
    cursor: pointer;
}
.excel-button:hover{border-color: #21a366;}
/*  ==========  END ORDER TABLE SECTION  ==========  */

select {
    padding: 7px;
    border: none;
    border-radius: 3px;
    box-shadow: 0 5px 5px rgba(185, 185, 185, 0.1);
    margin-left: 10px;
    outline: none;
    cursor: pointer;
}
input {
    padding: 7px;
    border: none;
    border-radius: 3px;
    outline: none;
    margin-left: 10px;
}

.header {
    width: 100%;
    padding: 15px 20px;
    box-sizing: border-box;

    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;

    border-left: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background-color: #fff;
}
.header .user {
    display: flex;
    align-items: center;
}
.header .user .title {
    font-size: 22px;
} 
.header .user .sub-title {
    font-weight: 400;
    color: #fff;
    padding: 5px 10px;
    margin-left: 10px;
    background-color: var(--main-color);
    border-radius: 3px;
}
.spaceloading {
    width: 32px;
    height: 32px;
    mask-image: url(./assets/loading.svg);
    mask-size: cover;
    background-color: rgb(133, 133, 133);
}
.newyearsday {
    width: 1500px;
    height: 110px;
    position: absolute;
    top: 15px;
    left: 0;
    background-image: url(https://www.clipartmax.com/png/full/36-367957_christmas-lights-transparent-png-clip-art-image-clipart-christmas-lights-clipart-transparent.png);
    background-size: 30%;
    background-repeat: no-repeat;
    z-index: 0;
}

/*     RAUZAADMIN - TABLES     */
.item-col {
    width: 100%;
    display: flex;
}
.item-col .row:first-child {
    margin-left: 0;
}
.item-col .row:nth-child(2) {
    margin-left: 0;
}
.item-col .row {
    margin-left: 20px;
    cursor: pointer;
    color: #708086;
    font-weight: lighter;
}
/*     END RAUZAADMIN - TABLES     */

.title-icons {
    height: 24px;
    width: 24px;
    margin-left: 12px;
    cursor: pointer;
}

/* scroll-bar */
::-webkit-scrollbar {
    width: 7px;
    height: 7px;
}
::-webkit-scrollbar-track {
    border-radius: 5px;
    background-color: transparent;
}
::-webkit-scrollbar-thumb {
    border-radius: 5px;
    box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: rgb(255, 255, 255);
}
@keyframes flicker-loading {
    0%{background-position:0% 50%}
    25%{background-position:50% 50%}
    50%{background-position:100% 50%}
    75%{background-position:50% 50%}
    100%{background-position:0% 50%}
}
@media screen and (max-width: 780px){
    .rauza-content {
        margin-top: 50px;
        height: 100%;
        width: 100%;
    }
    .padding {
        padding: 20px 0;
        overflow-y: scroll;
    }
    .header {
        padding: 10px 20px;
    }
    .rauza-header {
        padding: 0 20px 10px 20px;
    }
}
@keyframes newMessage {
    0% {background-color: var(--el-color-info-light-7);opacity: 0.8;}
    100% {background-color: var(--el-bg-color-overlay);opacity: 1;}
}
@keyframes newMessageRed {
    0% {background-color: rgb(255, 111, 111);opacity: 0.8;}
    100% {background-color: rgb(255, 239, 239);opacity: 1;}
}
@keyframes newCommentRed {
    0% {background-color: rgb(255, 214, 214);opacity: 0.8;}
    100% {background-color: var(--red);opacity: 1;}
}
</style>