<template>
    <div class="parser-window">
        <div class="header-row">
            <div class="load-items lazyload" @click="load103();"><i class="fi fi-sr-upload" style="margin-right: 5px;"></i>Выгрузка товаров</div>
            <div class="load-items lazyload" @click="startIterationLoadPharmacies();"><i class="fi fi-sr-pharmacy" style="margin-right: 5px;"></i>Выгрузка аптек</div>
            <div class="load-items lazyload" @click="prepareExcel();"><i class="fi fi-sr-settings" style="margin-right: 5px;"></i>Приготовить Excel</div>
            <div class="load-items lazyload" v-if="preparedExcel" @click="downloadExcel();"><i class="fi fi-sr-download" style="margin-right: 5px;"></i>Скачать файл Excel</div>
            <div class="console" v-html="console"></div>
        </div>
        <div class="header-item">
            <div class="item-col">
                <div class="row" :style="{minWidth: '380px', maxWidth: '380px'}">Название товара</div>
                <div class="row" :style="{minWidth: '200px', maxWidth: '200px', marginLeft: '20px'}">Производитель</div>
                <div class="row" :style="{minWidth: '340px', maxWidth: '340px', marginLeft: '20px'}">Сопоставление</div>
                <div class="row" :style="{minWidth: '125px', maxWidth: '125px', marginLeft: '0'}">РЦ</div>
                <div class="row" :style="{minWidth: '125px', maxWidth: '125px', marginLeft: '10px'}">Мин. цена к.</div>
                <div class="row" :style="{minWidth: '125px', maxWidth: '125px', marginLeft: '10px'}">Макс. цена к.</div>
                <div class="row" :style="{minWidth: '125px', maxWidth: '125px', marginLeft: '10px'}">% от РЦ</div>
            </div>
            <div class="item-col inputs">
                <input class="row" :style="{minWidth: '380px', maxWidth: '380px'}" placeholder="Поиск по названию..." v-model="filters.name" @keydown.enter="resetFilters('name'); sync(true);"/>
                <input class="row" :style="{minWidth: '200px', maxWidth: '200px', marginLeft: '20px'}" placeholder="Поиск по производителю..." v-model="filters.vendor" @keydown.enter="resetFilters('vendor'); sync(true);"/>
                <div class="row" :style="{minWidth: '340px', maxWidth: '340px', marginLeft: '10px'}"></div>
                <select class="row" :style="{minWidth: '125px', maxWidth: '125px'}" v-model="chosenPharma">
                    <option v-for="(i, ind) in funcs.pharmacies" :key="ind" :value="i.value">{{i.short}}</option>
                </select>
                <select class="row" :style="{minWidth: '125px', maxWidth: '125px'}" v-model="chosenNetwork">
                    <option :value="i.network_id" v-for="(i, ind) in networks" :key="ind">{{i.name}}</option>
                </select>
            </div>
        </div>
        <div class="items-list" v-if="ready" @scroll="listScroll" ref="list">
            <span class="items-empty" v-if="!items.length && !loading"><i class="fi fi-sr-expand"></i>Пока что пусто. Обратите внимание на вышестоящий фильтр.</span>
            <div :class="{'item': true, 'selected': activeCirc==ind}"
                style="bord"
                :ref="`convitemid${ind}`"
                v-for="(i, ind) in items" :key="ind"
            >
                <!-- <div class="row" v-for="(j, jind) in rows" :key="jind" :style="{minWidth: j.width, maxWidth: j.width}" v-html="j.val(i)"></div> -->
                <div class="row" :style="{minWidth: '380px', maxWidth: '380px'}"><b>{{i.med_name.split(' - ')[0]}}</b> {{i.med_name.split(' - ')[1]}}</div>
                <div class="row" :style="{minWidth: '200px', maxWidth: '200px', marginLeft: '20px'}">{{i.brand}}</div>

                <div class="item-select" :selected="itemSelect.ind == ind" @click="itemSelected(ind, i.sku, i.med_name.split(' - ')[0])" :ref="'itemSelect'+ind">
                    <div class="selectItem" v-if="i.rauza_id">
                        <div class="medname" style="font-weight: bold;">{{i.link_name}}</div>
                        <div class="desc">
                            <div class="desc-item s-vendor">{{i.link_brand}}</div>
                            <div class="desc-item s-med_id">{{i.rauza_id}}</div>
                        </div>
                        <i class="open-list fi fi-sr-caret-down"></i>
                    </div>
                    <div class="selectItem" v-else>
                        <div class="medname">Нажмите чтобы выбрать...</div>
                        <div class="desc">
                            <div class="desc-item s-pharmacy">Не привязано с артикулом</div>
                        </div>
                        <i class="open-list fi fi-sr-caret-down"></i>
                    </div>
                </div>
                <div class="row" :style="{minWidth: '125px', maxWidth: '125px'}">{{prices[i.rauza_id]?.rauza ? (prices[i.rauza_id].rauza.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')+' ₸') : (i.rauza_id ? 'Нет в нал.' : '')}}</div>
                <div class="row" :style="{minWidth: '125px', maxWidth: '125px'}">{{prices[i.rauza_id]?.linked ? (prices[i.rauza_id].linked.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')+' ₸') : ''}}</div>
                <div class="row" :style="{minWidth: '125px', maxWidth: '125px'}">{{prices[i.rauza_id]?.maxlinked ? (prices[i.rauza_id].maxlinked.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')+' ₸') : ''}}</div>
                <div :class="{'row': true, 'defeat': relDiff(prices[i.rauza_id]?.linked, prices[i.rauza_id]?.rauza) < 0}" :style="{minWidth: '125px', maxWidth: '125px'}">{{(prices[i.rauza_id]?.linked && prices[i.rauza_id]?.rauza) ? relDiff(prices[i.rauza_id]?.linked, prices[i.rauza_id]?.rauza).toFixed(2)+'%' : ''}}</div>
            </div>
            <div class="item itemloading" v-show="loading"></div>
            <div class="lazyload" v-if="!loading" @click="lazyLoad">Показать больше...</div>
        </div>
        <div class="item-select-list" v-if="itemSelect.active" :style="{left: itemSelect.coords.x+'px', top: itemSelect.coords.y+'px', height: itemSelect.coords.top+'px', width: itemSelect.coords.width+'px'}" ref="itemselector">
            <input type="text" placeholder="Поиск по справочнику..." v-model="itemSelect.value" @input="searchAutocomplete" autofocus> 
            <div class="list-options">
                <div class="selectItem itemloading" v-if="searchAutocompleteLoading"></div>
                <div class="selectItem itemPadding" v-if="chosenItem.rauza_id && !searchAutocompleteLoading" @click="linkCartItem(null)">
                    <i class="open-list fi fi-sr-trash" style="font-size: 1rem;"></i>
                    <div class="medname" style="font-weight: bold;">Удалить привязку</div>
                </div>
                <div class="selectItem itemPadding" v-show="!searchAutocompleteLoading" v-for="(i, ind) in itemSelect.items" :key="ind" @click="linkCartItem(i)">
                    <div class="medname" v-html="`${(i.med_name.toLowerCase().replace(itemSelect.value.toLowerCase(), '<b>'+itemSelect.value.toLowerCase()+'</b>'))}`"></div>
                    <div class="desc">
                        <div class="desc-item s-vendor">{{i.vendor_name}}</div>
                        <div class="desc-item s-med_id">{{i.med_id}}</div>
                    </div>
                </div>
            </div>
        </div>
        </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import { mask } from 'maska';
import moment from 'moment';
import axios from 'axios';
export default {
    data() {
        return {
            ready: false,
            serverQuery: Function,
            socket: Function,
            changeMode: Function,
            orderOp: Function,
            confirmer: Function,
            items: [],
            announce: [],
            global: {},
            mask,
            activeCirc: -1,
            loading: true,
            offset: 0,
            loadingOffset: false,
            windowWidth: window.innerWidth,
            filters: {
                name: '',
                vendor: ''
            },
            moment,
            maxOffset: false,
            medicine: [],
            console: '',
            getPharmaciesPage: 1,
            getItems: 0,
            funcs: {},
            itemSelect: {
                active: false,
                ind: -1,
                sku: null,
                coords: {
                    x: 0,
                    y: 0,
                    top: 0
                },
                value: '',
                items: []
            },
            searchAutocompleteLoading: false,
            prices: {},
            networks: [],
            responses: {},
            chosenPharma: 1,
            chosenNetwork: 1,
            preparedExcel: null
        }
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.changeMode = inject('changeMode');
        this.socket = inject('socket');
        this.global = inject('global');
        this.funcs = inject('funcs');
        this.confirmer = inject('confirmer');
        this.funcs = inject('funcs');
        this.announce = inject('announce');
        if(this.global.account.role != 4) {
            this.confirmer('Данная функция на данный момент доступна лишь Директорам.', () => {});
            this.changeMode('Home');
            return;
        }
        this.rows = [
            {
                width: '380px',
                name: 'Название товара',
                placeholder: 'Поиск по названию...',
                val: (i) => {
                    let nameParts = i.med_name.split(' - ');
                    return `<b>${nameParts[0]}</b> ${nameParts[1]}`;
                }
            },
            {
                width: '200px',
                name: 'Производитель',
                placeholder: 'Поиск по производителю...',
                val: (i) => i.brand
            },
        ];

        this.ready = true;
        this.getPharmaciesList();
        this.sync();
        
        document.addEventListener('click', this.windowClick);

        this.getPreparedExcel();
    },
    unmounted() {
        document.removeEventListener('click', this.windowClick);
    },
    methods: {
        listScroll(e) {
            let scrollBottom = e.target.scrollTop+e.target.offsetHeight;
            if(scrollBottom > (e.target.scrollHeight-10)) {
                this.lazyLoad();
            }
            this.windowScroll();
        },
        windowScroll() {
            if (!this.itemSelect.active) return;
            let rect = this.$refs['itemSelect'+this.itemSelect.ind],
                bounds = rect.getBoundingClientRect();
            this.itemSelect.coords.top =  window.innerHeight - bounds.top - 100;

            this.itemSelect.coords.x = bounds.left - 200;
            this.itemSelect.coords.y = bounds.top;
        },
        windowClick(event) {
            if (!this.itemSelect.active) return;
            let isClickInside = this.$refs['itemSelect'+this.itemSelect.ind].contains(event.target);
            if (!isClickInside) {
                if (this.$refs.itemselector.contains(event.target)) return false;
                this.itemSelect.active = false;
                this.itemSelect.ind = -1;
            }
        },
        resetFilters(except) {
            this.offset = 0;
            if (except != 'name') this.filters.name = '';
            if (except != 'vendor') this.filters.vendor = '';
        },
        async getPharmaciesList() {
            let response = (await this.serverQuery('admin', 'parserGetNetworks')).data.message;
            for(let i in response) {
                response[i].branches_list = JSON.parse(response[i].branches_list);
                this.networks.push(response[i]);
            }
            this.chosenNetwork = response[0].network_id;
        },
        sync(reset) {
            return new Promise((resolve) => {
                (async() => {
                    if (reset) {
                        this.items.splice(0, this.items.length);
                    }
                    this.loading = true;
                    let response = (await this.serverQuery('admin', 'parserGetItems', {offset: this.offset, filters: JSON.stringify(this.filters)})).data.message;
                    let rauzaIdList = [];
                    for(let i in response) {
                        this.items.push(response[i]);
                        if (response[i].rauza_id) {
                            this.getPrices(response[i]);
                            rauzaIdList.push({iid: null, med_id: response[i].rauza_id});
                        }
                    }
                    if (response.length <= 0) {
                        this.maxOffset = true;
                    }
                    this.loading = false;
                    
                    this.getRauzaPrices(rauzaIdList);
                    
                    resolve();
                })();
            });
        },
        reloadAllRauzaPrices() {
            let rauzaIdList = [];
            this.items.forEach((item) => {
                rauzaIdList.push({iid: null, med_id: item.rauza_id});
            });
            this.getRauzaPrices(rauzaIdList);
        },
        async getRauzaPrices(rauzaIdList) {
            return new Promise((resolve) => {
                (async() => {
                    this.console = `Получение розничных цен с Инфо Аптеки...`;
                    let response = await this.serverQuery('admin', 'tryToLink', {list: JSON.stringify(rauzaIdList), pharma: this.chosenPharma}),
                        data = response.data.message;
                    console.log('getRauzaPrices', data);
                    data.forEach(e => {
                        let c = e.res[0];
                        if (!this.prices[c.med_id]) this.prices[c.med_id] = {};
                        this.prices[c.med_id].rauza = c.price;
                    });
                    this.console = `Розничные цены с Инфо Аптеки получены.`;
                    resolve();
                })();
            });
        },
        getPrices(item) {
            return new Promise((resolve) => {
                (async() => {
                    let response = await axios.get(`https://apteka.103.kz/api/v2/pharmacy/map/1/${item.sku}/?params%5Bmode%5D=sku`);
                    if (response.data.status != 'ok') {
                        this.console = `Соединение с API прервано.`;
                        resolve();
                        return;
                    }
                    this.responses[item.rauza_id] = response.data.data;
                    this.applyPrices(item);
                    resolve();
                })();
            });
        },
        applyPrices(item) {
            if (!this.networkData) return;
            if (!item) {
                this.items.forEach((item) => {
                    if (this.prices[item.rauza_id]) {
                        this.prices[item.rauza_id].linked = null;
                        this.prices[item.rauza_id].maxlinked = null;
                    }
                    this.applyPrice(item);
                });
            }
            else {
                this.applyPrice(item);
            }
        },
        applyPrice(item) {
            if (!item.rauza_id) return;
            let resp = this.responses[item.rauza_id];
            if (!resp) return;
            let cheapest = Infinity,
                highest = -Infinity;
            for(let i in resp) {
                let ind = this.networkData.branches_list.findIndex(e=>e==resp[i].i);
                if (ind == -1) continue;
                let price = parseInt(resp[i].p);
                if (price > highest) highest = price;
                if (price < cheapest) cheapest = price;
            }
            if (!this.prices[item.rauza_id]) this.prices[item.rauza_id] = {};
            if (cheapest == Infinity) {
                this.prices[item.rauza_id].linked = null;
                this.prices[item.rauza_id].maxlinked = null;
                return;
            }
            this.prices[item.rauza_id].linked = cheapest;
            this.prices[item.rauza_id].maxlinked = highest;
        },
        startIterationLoadPharmacies() {
            if (this.global.account.id != 2) return this.announce.push({type: 'E', message: 'У Вас нет прав.'});
            this.getPharmaciesPage = 1;
            this.iterateLoadPharmacies();
        },
        async iterateLoadPharmacies() {
            let stop = await this.loadPharmacies();
            if (stop) return this.console = `Получение аптек завершено.`;
            this.getPharmaciesPage++;
            this.iterateLoadPharmacies();
        },
        loadPharmacies() {
            return new Promise((resolve) => {
                (async() => {
                    let params = new URLSearchParams();
                    params.append('query', 'getUrl');
                    params.append('url', 'https://apteka.103.kz/apteki/almaty/?sort=name%3Aasc&page='+this.getPharmaciesPage);
                    this.console = `Получение аптек. Страница ${this.getPharmaciesPage}...`;
                    let data = await axios.post('http://localhost:8888/api/index.php', params);
                    let parser = new DOMParser(),
                        doc = parser.parseFromString(data.data, "text/html");
                    
                    let pharmacies = doc.querySelectorAll('.drugStoreListBody .drugStore__item');

                    if(pharmacies.length <= 0) return resolve(true);
                    
                    for(let p of pharmacies) {
                        let address = p.querySelector('.drugStore__address').innerText;
                        address = address.replace('\n                    ', '');
                        address = address.replace('                ', '');
                        let newPharmaData = {
                            pharma_id: p.getAttribute('data-id'),
                            name: p.getAttribute('data-pharm-name'),
                            address
                        };
                        console.log(newPharmaData);
                        let prms = new URLSearchParams();
                        prms.append('query', 'new130Pharma');
                        prms.append('newPharmaData', JSON.stringify(newPharmaData));
                        await axios.post('http://localhost:8888/api/index.php', prms);
                    }
                    resolve(false);
                })();
            });
        },
        async load103() {
            if (this.global.account.id != 2) return this.announce.push({type: 'E', message: 'У Вас нет прав.'});
            await this.get103List();

            this.confirmer('Введите начальный отступ:', async (e)=>{
                let start = parseInt(e);
                if (e >= this.medicine.length) return this.announce.push({type: 'E', message: 'Отступ не может превышать '+this.medicine.length});
                this.getItems = start;
                for(let i = start; i < this.medicine.length; i++) {
                    let j = this.medicine[i];
                    await this.getMedicineDetails(j);
                    this.getItems++;
                }
            }, true, `0 - ${this.medicine.length}`);
        },
        get103List() {
            return new Promise((resolve) => {
                (async() => {
                    let data = await axios.get('/103.html');
                    let parser = new DOMParser(),
                        doc = parser.parseFromString(data.data, "text/html");
                    let columns = doc.querySelectorAll('.abc-list .list li');
                    for(let c of columns) {
                        let link = c.querySelector('a'),
                            desc = c.querySelector('span');
                        this.medicine.push({
                            link: link.getAttribute('href'),
                            name: link.innerText,
                            desc: desc ? desc.innerText : null,
                            analogs: []
                        });
                    }
                    resolve();
                })();
            });
        },
        getMedicineDetails(m) {
            return new Promise((resolve) => {
                (async() => {
                    var params = new URLSearchParams();
                    params.append('query', 'getUrl');
                    params.append('url', m.link);
                    this.console = `Получение информации о ${m.name}... (${this.getItems}/${this.medicine.length})`;
                    let data = await axios.post('http://localhost:8888/api/index.php', params);
                    let parser = new DOMParser(),
                        doc = parser.parseFromString(data.data, "text/html");
                    let isItemPage = doc.querySelector('.drugInfo__content') != null;
                    if (isItemPage) {
                        let i = doc.querySelector('.drugInfo__content');
                        let itemSku = i.getAttribute('data-sku-id'),
                            itemUrl = m.link,
                            itemName = i.getAttribute('data-sku-form'),
                            itemRecipeNeeded = i.querySelector('.drugInfo__label--recipeOnly') != null;
                        let desc_split = i.querySelector('.drugInfo__description').textContent.split(', ');
                        let newItemData = {
                            medicine: m,
                            variety: {
                                varietyName: i.getAttribute('data-sku-name'),
                                vendorName: desc_split[1],
                                vendorCountry: desc_split[2],
                            },
                            itemSku,
                            itemName,
                            itemUrl,
                            itemRecipeNeeded
                        };
                        console.log(newItemData);
                        await this.saveItemDetails(newItemData);
                    }
                    else {
                        let analogList = [],
                            analogs = doc.querySelectorAll('.drugsForm__list--analog .analog');
                        for(let a of analogs) {
                            let analogSku = a.querySelector('.sku-holder').getAttribute('data-sku-id');
                            analogList.push(analogSku);
                        }
                        m.analogs = analogList;
                        let varieties = doc.querySelectorAll('.js-drugsForm__list .drugsForm');

                        for(let v of varieties) {
                            let varietyName = v.querySelector('.drugsForm__description-title').innerText,
                                vendorName = v.querySelector('.drugsForm__description-text span:nth-child(1)').innerText,
                                vendorCountry = v.querySelector('.drugsForm__description-text span:nth-child(2)').innerText;

                            let items = v.querySelectorAll('.drugsForm__items li');
                            for(let i of items) {
                                let itemSku = i.getAttribute('data-sku-id'),
                                    itemUrl = i.querySelector('meta[itemprop="url"]').getAttribute('content'),
                                    itemName = i.querySelector('.drugsForm__item-name').innerText,
                                    itemRecipeNeeded = i.querySelector('.drugsForm__item-receipt--recipeOnly') != null;
                                itemName = itemName.replace('\n                ', '');
                                itemName = itemName.replace('            ', '');
                                let newItemData = {
                                    medicine: m,
                                    variety: {
                                        varietyName,
                                        vendorName,
                                        vendorCountry,
                                    },
                                    itemSku,
                                    itemName,
                                    itemUrl,
                                    itemRecipeNeeded,
                                };
                                await this.saveItemDetails(newItemData);
                            }
                        }
                    }
                    resolve();
                })();
            });
        },
        saveItemDetails(newItemData) {
            return new Promise((resolve) => {
                (async() => {
                    var params = new URLSearchParams();
                    params.append('query', 'new130Item');
                    params.append('newItemData', JSON.stringify(newItemData));
                    console.log(JSON.stringify(newItemData));
                    await axios.post('http://localhost:8888/api/index.php', params);
                    resolve();
                })();
            });
        },
        getItemDetails(i) {
            return new Promise((resolve) => {
                (async() => {
                    i
                    // var params = new URLSearchParams();
                    // params.append('query', 'getUrl');
                    // params.append('url', i.itemUrl);
                    // let data = await axios.post('http://localhost:8888/api/index.php', params);
                    // let parser = new DOMParser(),
                    //     doc = parser.parseFromString(data.data, "text/html");
                    
                    resolve();
                })();
            });
        },
        async lazyLoad() {
            if (this.loadingOffset || this.maxOffset) return;
            this.loadingOffset = true;
            this.offset += 15;
            console.log('lazy load')
            await this.sync();
            this.loadingOffset = false;
            console.log('Updated!')
        },
        async searchAutocomplete() {
			let thisMoment = Date.now(),
				name = this.itemSelect.value;
			this.lastLetter = thisMoment;
            this.searchAutocompleteLoading = true;
            let response = (await this.serverQuery('admin', 'searchInMedicine', {med_name: this.itemSelect.value})).data.message;
			if (this.lastLetter != thisMoment) {
				console.log(`Item search by '${name}' is skipped.`);
				return;
			}
            this.searchAutocompleteLoading = false
            this.itemSelect.items = response;
		},
        async itemSelected(ind, sku, name) {
            let rect = this.$refs['itemSelect'+ind];

            let bounds = rect.getBoundingClientRect();
            this.itemSelect.ind = ind;
            this.itemSelect.sku = sku;
            this.itemSelect.value = name;
            this.itemSelect.coords = {
                x: bounds.left - 200,
                y: bounds.top,
                top: window.innerHeight - bounds.top - 100,
                width: bounds.width
            };
            this.itemSelect.active = true;

            this.searchAutocomplete();
        },
        async linkCartItem(i) {
            let ind = this.items.findIndex(e => e.sku == this.itemSelect.sku);
            if (ind == -1) return;
            if (!i) { // delete
                this.items[ind].rauza_id = null;
            }
            else {
                this.items[ind].rauza_id = i.med_id;
                this.items[ind].link_name = i.med_name;
                this.items[ind].link_brand = i.vendor_name;
            }

            this.itemSelect.active = false;
            this.itemSelect.ind = -1;
            this.itemSelect.value = '';
            this.itemSelect.sku = null;

            this.getPrices(this.items[ind]);
            this.getRauzaPrices([{iid: null, med_id: i.med_id}]);
            this.console = `Сохранение изменений о товаре ${i.med_name}...`;
            let response = (await this.serverQuery('admin', 'parserUpdateLink', {sku: this.items[ind].sku, rauza_id: this.items[ind].rauza_id, linkName: this.items[ind].link_name, linkBrand: this.items[ind].link_brand})).data.message;
            if (response != 'OK') this.announce.push({type: 'E', message: 'Ошибка при привязывании. Обновите страницу.'});
            this.console = `Товар ${i.med_name} обновлен.`;
        },
        cumulativeOffset(element) {
            var top = 0, left = 0;
            do {
                top += element.offsetTop  || 0;
                left += element.offsetLeft || 0;
                element = element.offsetParent;
            } while(element);

            return {
                top: top,
                left: left
            };
        },
        relDiff(_a, _b) {
            let a = parseInt(_a),
                b = parseInt(_b);
            return  ((a-b) / b) * 100;
        },
        prepareExcel() {
            this.confirmer('Вы точно хотите начать выгрузку товаров в файл Excel? Процесс может занять время. После начатия не рекомендуется покидать страницу.', async () => {
                this.loading = true;
                this.console = `Начало выгрузки в файл Excel... Пожалуйста, не покидайте страницу.`;
                let response = (await this.serverQuery('admin', 'parserGetAllItems')).data.message;
                let excelList = [],
                    getPricesList = [];
                for(let i in response) {
                    this.console = `Получение данных о ${response[i].med_name}.`;
                    await this.getPrices(response[i]);
                    excelList.push(response[i]);
                    getPricesList.push({iid: null, med_id: response[i].rauza_id});
                }
                this.console = `Выгрузка цен конкурентов завершена. Получение РЦ товаров...`;
                if (response.length <= 0) {
                    this.maxOffset = true;
                }
                this.loading = false;
                console.log('excelList', excelList);

                await this.getRauzaPrices(getPricesList);
                this.console = `Подготовка файла Excel для скачивания...`;
                
                let result = [];
                for(let i in excelList) {
                    result.push({...excelList[i], ...this.prices[excelList[i].rauza_id], url: '', link_name: '', link_brand: ''});
                }
                console.log('RES', result);

                localStorage.setItem('preparedExcel', JSON.stringify(result));
                this.getPreparedExcel();
                this.console = `Файл готов к скачиванию!`;
            });
        },
        downloadExcel() {
            console.log(this.preparedExcel);
            var params = new URLSearchParams();
            params.append('data', this.preparedExcel);

            let ind1 = this.funcs.pharmacies.findIndex(e=>e.value==this.chosenPharma);
            if (ind1 != -1) {
                params.append('pharmaName', this.funcs.pharmacies[ind1].text);
            }
            params.append('networkName', this.networkData.name)
            axios({
                url: 'https://rauza-ade.ru/api/admin/rauzaCompetitiveReport.php',
                method: 'POST',
                data: params,
                responseType: 'blob',
            }).then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'Конкуренты сгенерированный отчет.xls');
                document.body.appendChild(link);
                link.click();
            });
        },
        getPreparedExcel() {
            let preparedExcel = localStorage.getItem('preparedExcel');
            if (preparedExcel) {
                this.preparedExcel = preparedExcel;
            }
            else {
                this.preparedExcel = null;
            }
        }
    },
    watch: {
        chosenNetwork() {
            this.applyPrices();
        },
        chosenPharma() {
            this.reloadAllRauzaPrices();
        }
    },
    computed: {
        chosenItem() {
            let ind = this.items.findIndex(e => e.sku == this.itemSelect.sku);
            if (ind == -1) return null;
            return this.items[ind];
        },
        networkData() {
            let ind = this.networks.findIndex(e => e.network_id == this.chosenNetwork);
            if (ind == -1) return null;
            return this.networks[ind];
        }
    }
}
</script>

<style scoped>
    .parser-window {
        position: absolute;
        top: 0;
        left: 0;
        background-color: #f5f7fb;
        width: 100%;
        height: 100vh;
        padding: 10px 25px;
        overflow-y: scroll;
        box-sizing: border-box;
        z-index: 10000;
    }
    .header-row {
        display: flex;
        align-items: center;
        padding-bottom: 10px;
    }
    .header-row .console {
        letter-spacing: .1px;
        font-weight: 600;
    }
    .load-items.lazyload {
        width: 200px;
        margin: 0;
        margin-right: 10px;
        background-color: rgb(57 136 254 / 20%);
        color: rgb(51 115 213);
    }
    .items-list {
        display: flex;
        align-items: center;
        flex-direction: column;
        height: calc(100% - 185px);
        overflow-y: scroll;
        background-color: #FFF;
        border-radius: 20px;
        border-top-right-radius: 0;
        border-top-left-radius: 0;
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
    .items-list .item {
        width: 100%;
        min-height: 60px;
        max-height: 60px;
        padding: 0px 20px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        cursor: pointer;
        animation: newMessage 1s;
        overflow: visible;
        position: relative;
    }
    .items-list .item:hover {
        background-color: rgb(247, 247, 247);
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
    .lazyload.return {
        background-color: rgb(149 149 149 / 20%);
        color: rgb(102 102 102);
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
    .items-empty {
        display: flex;
        align-items: center;
        margin-top: 10px;
        font-weight: bold;
        user-select: none;
    }
    .items-empty i {
        margin-right: 10px;
    }
    .item-col.inputs {
        margin-top: 10px;
    }
    .inputs input, .inputs select {
        background-color: #ECECEC;
        box-shadow: 0 0 0;
        box-sizing: border-box;
    }
    .item-col .row {
        margin: 0;
        margin-left: 10px;
    }
    .row.defeat {
        background-color: #ff8d8d5c;
        height: 100% !important;
        display: flex;
        align-items: center;
    }
    .item .row {
        height: max-content;
        margin-left: 10px;
    }
    .item .row:first-child {
        margin-left: 0px;
    }
    .item:nth-child(2n) {
        background-color: #1D5FA115;
    }
    .item-col .row:first-child {
        margin: 0;
    }
    .conv-title{
        margin: 0;
        margin-left: 10px;
    }
    .item-select {
        width: 350px;
        height: 100%;
        cursor: pointer;
    }
    .item-select[selected="true"] .selectItem{
        background-color: #D5ECFF !important;
    }
    .selectItem {
        height: 100%;
        display: flex;
        justify-content: center;
        flex-direction: column;
        position: relative;
        padding: 5px 0;
        padding-left: 20px;
        box-sizing: border-box;
    }
    .selectItem:nth-child(2n) {
        background-color: rgb(241, 241, 241);
    }
    .selectItem:hover {
        background-color: rgb(235, 235, 235);
    }
    .selectItem .desc {
        display: flex;
        color: rgb(82, 82, 82);
        font-size: 14px;
    }
    .selectItem .desc .desc-item {
        margin-right: 5px;
    }
    .desc-item.s-pharmacy {
        font-weight: bold;
    }
    .desc-item.s-nonprofit {
        color: rgb(185, 0, 0);
        font-weight: bold;
    }
    .desc-item:after {
        content: ' - ';
    }
    .desc-item:last-child:after {
        content: '';
    }
    .selectItem .medname {
        text-transform: lowercase;
        white-space: pre-wrap;
        word-wrap: break-word;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        vertical-align: middle;
        overflow: hidden;
    }
    .selectItem .medname::first-letter{text-transform: capitalize;}
    .selectItem .open-list {
        position: absolute;
        right: 20px;
        font-size: 1.5rem;
        top: 50%;
        transform: translate(0, -50%);
    }
    .item-select-list {
        width: 400px;
        height: max-content;
        position: absolute;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
        background-color: #FFF;
        border-radius: 10px;
        z-index: 100000;
    }
    .item-select-list input {
        width: 100%;
        outline: none;
        border: none;
        border-radius: 3px;
        background-color: transparent;
        margin: 0;
        padding: 10px 20px;
        font-size: 1rem;
        box-sizing: border-box;
    }
    .item-select-list .list-options {
        height: calc(100% - 38px);
        overflow-y: scroll;
    }
    .item-select-list .list-options .selectItem {
        min-height: 55px;
        height: max-content;
        cursor: pointer;
    }
    .capitalize {
        white-space: pre-wrap;
        word-wrap: break-word;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        vertical-align: middle;
        overflow: hidden;
        font-weight: bold;
    }
    .itemloading {
        height: 300px !important;
        background: linear-gradient(270deg, #cccccc, #e9e9e9, #cccccc);
        background-size: 400% 400%;

        animation: flicker-loading 2s infinite !important;
    }
    .nomargintop {
        margin-top: 10px !important;
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
        .items-empty {
            justify-content: center;
            text-align: center;
        }
        .items-empty i {
            display: none;
        }
    }
</style>