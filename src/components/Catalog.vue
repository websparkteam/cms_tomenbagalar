<template>
    <div class="modal-catalog" v-if="ready">
        <div class="offset">
            <h2>Выберите товары</h2>
            <div class="close-catalog" @click="$parent.openCatalog=false"><i class="fi-sr-cross"></i></div>
            <input type="text" placeholder="Поиск товаров..." v-model="searchInput" @input="searchCatalog">
            <div class="content">
                <div class="search-res">
                    <template v-if="loading">
                        <div class="item-loading" v-for="i in 10" :key="i"></div>
                    </template>
                    <div class="item" v-for="(i, ind) in list" :key="ind" @click="addToCart($event, i)">
                        <img :src="funcs.chooseImage(i)" @error="$event.target.src = require('../assets/images/no-image.jpg');">
                        <div class="brand">{{i.vendor_name}}</div>
                        <div class="name">{{i.item_data ? i.item_data.formatted_name : i.med_name[0].toUpperCase() + i.med_name.toLowerCase().substring(1)}}</div>
                        <div class="price"><small class="t-sym">от </small>{{i?.price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}}<small class="t-sym">₸</small></div>
                        <div class="added" v-if="data.cart.findIndex(e=>e.med_id==i.med_id)!=-1">
                            <i class="fi-sr-shopping-cart-check"></i>
                            <div class="amount">
                                <div class="amount-button" @click="changeAmount(i, false)">-</div>
                                <input type="number" v-model.number="data.cart[data.cart.findIndex(e=>e.med_id==i.med_id)].amount" @input="changeAmount(i)">
                                <div class="amount-button" @click="changeAmount(i, true)">+</div>
                            </div>
                            <span class="deletebutton" @click="data.cart.splice(data.cart.findIndex(e=>e.med_id==i.med_id), 1)">Удалить</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
export default {
    data() {
        return {
            ready: false,
            serverQuery: Function,
            funcs: Object,
            searchInput: '',
            list: [],
            catalogsData: {},
            waitforinput: false,
            loading: false
        }
    },
    props: ['myCatalog'],
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.catalogsData = inject('catalogsData');
        this.funcs = inject('funcs');
        this.ready = true;
    },
    computed: {
        data() {
            return this.catalogsData[this.myCatalog];
        }
    },
    methods: {
        async searchCatalog() {
            if (this.waitforinput) return;
            this.waitforinput = true;
            clearTimeout(this.waitinginput);
            this.waitinginput = setTimeout(() => this.waitforinput = false, 500);
			this.list.splice(0, this.list.length);
            this.loading = true;
            let response = (await this.serverQuery('products', 'itemSearch', {name: this.searchInput, cat_id: -1, sort: '', offset: 0})).data.message,
                searchList = response['items'];

            this.list.splice(0, this.list.length);
            this.funcs.arrayify_parse(searchList, this.list);
            this.loading = false;
        },
        
        product_parse(obj) {
			obj.item_data.price = parseInt(obj.item_data.price);
			if (obj.item_data) {
				obj.item_data.images = JSON.parse(obj.item_data?.images);
			}
        },
        changeAmount(i, add) {
            let ind = this.data.cart.findIndex(e => e.med_id == i.med_id),
                data = this.data.cart[ind];
            if (add === true) data.amount++;
            else if (add === false) data.amount--;
			if(data.amount > 999) data.amount = 999;
			if(data.amount < 1) {
                data.amount = 1;
            }
        },
        async addToCart(i, e) {
            if(i.target.className == 'deletebutton') return; // You will be able to delete it now
            if(this.data.cart.findIndex(i => i.med_id == e.med_id) != -1) return;
            this.data.cart.push({
                med_id: e.med_id,
                name: e.med_name,
                price: parseInt(e.price),
                amount: 1,
                pharma: e.pharma
            });
            let response = await this.serverQuery('products', 'getByMedId', {list: JSON.stringify([e.med_id])}),
                data = response.data.message;

            for(let i in data) {
                let stock = [];
                for(let j in data[i][0]) {
                    stock.push(data[i][0][j]);
                }
                this.$parent.cartAlternatives.push({med_id: data[i][1].med_id, stock})
            }
            this.funcs.arrayify_parse(data, this.$parent.loadedData);
        }
    }
}
</script>

<style scoped>
    .modal-catalog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1000;
        background-color: rgba(14, 0, 7, 0.527);
        display: flex;
        justify-content: center;
    }
    .offset {
        width: 100%;
		max-width: 1200px;
        padding: 20px 20px;
        color: #fafafa;
        display: flex;
        flex-direction: column;
        position: relative;
    }
    input {
        background-color: transparent;
        border: 1px solid #fafafa;
        border-radius: 10px;
        padding: 5px 20px;
        outline: none;
        color: #fafafa;
        font-size: 1.1rem;
        margin-top: 10px;
        box-sizing: border-box;
        width: 100%;
    }
    input::placeholder { /* Most modern browsers support this now. */
        color: #d3d3d3;
    }
    .content {
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        margin-top: 20px;
    }
    .search-res {
        display: grid;
        width: 100%;
        height: max-content;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 10px 10px;
    }
    .search-res .item {
        width: 240px;
        height: 100%;

        background: #fff;
        border: 2px solid #eee;
        color: var(--black);
        border-radius: 15px;
        padding: 18px;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        cursor: pointer;
    }
    .item-loading {
        width: 240px;
        height: 283px;

        background: linear-gradient(270deg, #cccccc, #e9e9e9, #cccccc);
        background-size: 400% 400%;
        animation: flicker-loading 1s infinite !important;
        color: var(--black);
        border-radius: 15px;
        padding: 18px;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        cursor: pointer;
    }
    .item img {
        width: 100%;
        height: 150px;
        object-fit: contain;
    }
    .item .brand {
        font-size: 0.9rem;
        color: #708086;
    }
    .item .name {
        font-weight: bold;
    }
    .item .price {
        margin-top: 10px;
        text-align: center;
        font-weight: bold;
        font-size: 1.2rem;
    }
    .item .added {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.712);
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: center;
        flex-direction: column;
    }
    .added i {
        color: white;
        font-size: 2rem;
    }
    .added span {
        margin-top: 10px;
        color: white;
        font-weight: bold;
        font-size: 1rem;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 10px;
    }
    .added span:hover {
        background-color: white;
        color: #000;
    }
    .item .amount {
        display: flex;
        align-items: center;
        margin-top: 20px;
    }
    .item .amount .amount-button {
        height: 100%;
        display: flex;
        align-items: center;
        padding: 0 10px;
        border-radius: 10px;
        font-weight: bold;
        width: 20px;
        text-align: center;
        justify-content: center;
        color: white;
        font-size: 2rem;
        cursor: pointer;
    }
    .item .amount .amount-button:hover {
        background-color: white;
        color: #000;
    }
    .item .amount input {
        margin: 0 10px;
        width: 75px;
        height: 100%;
        display: flex;
        align-items: center;
        border: none;
        outline: none;
        text-align: center;
        font-weight: bold;
        background-color: #FFF;
        color: #000;
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .close-catalog {
        position: absolute;
        right: 0;
        font-size: 1.7rem;
        opacity: 0.7;
        cursor: pointer;
    }
    .close-catalog:hover {
        opacity: 1;
    }
</style>