<template>
    <div class="stock-panel">
        <div class="filter">
            <div class="filters">
                <div class="item-row">
                    <i class="fi-sr-filter" style="margin-right: 10px;"></i>
                    <div class="label">Параметры</div>
                </div>
                <div class="item-row">
                    <input style="width: 100%;" type="text" placeholder="Название или артикул" v-model="filters.name" @keydown.enter.prevent="applyFilters">
                </div>
                <div class="item-row">
                    <div class="label">Страница</div>
                    <input style="width: 100%;" type="number" placeholder="Страница" @keydown.enter.prevent="applyFilters" v-model.number="filters.page" @change="filters.page < 1 ? filters.page = 1 : false;">
                </div>
                <div class="item-row">
                    <div class="label">Показывать товары, которые...</div>
                </div>
                <div class="item-row">
                    <label class="switch">
                        <input type="checkbox" v-model="filters.withoutDesc" @change="applyFilters(); filters.onlyPhotos=false; filters.onlyHidden=false;">
                        <span class="slider round"></span>
                    </label>
                    <div class="label">Без описания</div>
                </div>
                <div class="item-row">
                    <label class="switch">
                        <input type="checkbox" v-model="filters.onlyPhotos" @change="applyFilters(); filters.withoutDesc=false; filters.onlyHidden=false;">
                        <span class="slider round"></span>
                    </label>
                    <div class="label">Без фото</div>
                </div>
                <div class="item-row">
                    <label class="switch">
                        <input type="checkbox" v-model="filters.onlyHidden" @change="applyFilters(); filters.onlyPhotos=false; filters.withoutDesc=false;">
                        <span class="slider round"></span>
                    </label>
                    <div class="label">Скрытые товары</div>
                </div>
                <div class="item-row" v-if="able">
                    <div class="label">Функции:</div>
                </div>
                <div class="item-row" v-if="able">
                    <label class="switch">
                        <input type="checkbox" v-model="params.autoDesc" @change="params.imageEditor ? params.imageEditor=false : false;">
                        <span class="slider round"></span>
                    </label>
                    <div class="label">Авто данные</div>
                </div>
                <div class="item-row" v-if="able">
                    <label class="switch">
                        <input type="checkbox" v-model="params.imageEditor" @change="params.autoDesc ? params.autoDesc=false : false;">
                        <span class="slider round"></span>
                    </label>
                    <div class="label">Загрузка фото</div>
                </div>
                <div class="item-row">
                    <RauzaButton @click="applyFilters" :loading="loading" width="100%" height="30px" text="Принять" background="rgb(75, 187, 239, 0.1)" color="rgb(75, 187, 239)" marginTop="0px" padding="15px 20px"/>
                </div>
            </div>
        </div>
        <div class="stock-list">
            <div class="header-item">
                <div class="item-col">
                    <div class="row" :style="{width: '75px'}">#</div>
                    <div class="row" :style="{width: '32px', display: 'flex', alignItems: 'center'}"><i class="fi fi-rs-bell"></i></div>
                    <div class="row" v-for="(i, ind) in rows" :key="ind" :style="{width: i.width}">{{i.name}}</div>
                    <div class="row" :style="{width: '300px'}">Название товара</div>
                    <div class="row" v-if="params.autoDesc" :style="{width: '250px'}">URL</div>
                    <div class="row" v-if="params.imageEditor" :style="{width: '250px'}">Название файла</div>
                </div>
                <div class="line"></div>
            </div>
            <div class="convs-list" v-if="ready" @scroll="listScroll" ref="list">
                <div :class="{'item': true, 'selected': activeItem==ind}"
                    :ref="`convitemid${ind}`"
                    v-for="(i, ind) in convs" :key="ind"
                    @click="(params.autoDesc==false && params.imageEditor==false) ? activeItem==ind ? openItem(i): activeItem=ind: false"
                >
                    <div class="line" :style="{background: 'var(--blue)'}"></div>
                    <div class="item-row">
                        <div class="conv-title convtitlecopiable" :style="{width: '75px'}"><b>{{i.med_id}}</b></div>
                        <i class="fi-sr-exclamation conv-report" :style="{opacity: !hasErrors(i) ? 0 : 0.5}" :title="hasErrors(i) ? hasErrors(i).join('\n') : ''"></i>
                        <div class="conv-title" v-for="(j, jind) in rows" :key="jind" :style="{width: j.width}" v-html="j.return(i)"></div>
                        <div class="conv-title convtitlecopiable" :style="{width: '300px'}" @click="params.autoDesc ? copyClipboard(i.med_name.toLowerCase()) : false" v-html="`<strong>${i.med_name[0]?.toUpperCase() + i.med_name.toLowerCase().substring(1)}</strong>`"></div>
                        <template v-if="params.autoDesc && hasErrors(i) && autoDescURLS[i.id]!==false">
                            <input class="conv-title" type="text" v-model="autoDescURLS[i.id]" :style="{width: '200px'}" placeholder="Вставьте ссылку">
                            <i class="autodesc-done fi-sr-check" @click="pasteDesc(i)"></i>
                        </template>
                        <template v-if="params.imageEditor">
                            <input class="conv-title" type="text" v-model="autoDescIMAGES[i.id]" :style="{width: '200px'}" :placeholder="(!i.stockdata?.images || i.stockdata?.images=='[]') ? 'Еще нет изображений' : 'Добавить еще одно изображение'">
                            <i class="autodesc-done fi-sr-check" @click="pasteImage(i)"></i>
                        </template>
                    </div>
                    <div class="item-data" v-if="activeItem==ind">
                        <div class="item-row">
                            <i class="fi-sr-hastag"></i>
                            <span>{{i.med_id}}</span>
                        </div>
                        <div class="item-row">
                            <i class="fi-sr-align-left"></i>
                            <span><strong>{{i.med_name[0].toUpperCase() + i.med_name.toLowerCase().substring(1)}}</strong></span>
                        </div>
                        <template v-if="Object.keys(i.stockdata).length > 2">
                            <div class="item-row">
                                <i class="fi-sr-text-check"></i>
                                <span>{{i.stockdata.formatted_name}}</span>
                            </div>
                            <div class="item-row">
                                <i class="fi-sr-eye"></i>
                                <span>{{i.stockdata.views}}</span>
                            </div>
                            <div class="item-row">
                                <i class="fi-sr-shopping-cart-add"></i>
                                <span>Добавлено в корзину {{i.stockdata.addedtocart}} раз</span>
                            </div>
                            <div class="item-row">
                                <i class="fi-sr-chat-arrow-grow"></i>
                                <span>Продано {{i.stockdata.sold}} шт.</span>
                            </div>
                        </template>
                        <div class="item-row" v-else>
                            <i class="fi-sr-eye-crossed"></i>
                            <span>Товар скрыт из сайта из-за отсутствия какой либо информации.</span>
                        </div>
                    </div>
                </div>
                <div class="item itemloading" v-show="loading"></div>
                <div class="lazyload" v-if="!loading" @click="loadingOffset = false; lazyLoad();">Показать больше...</div>
            </div>
        </div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import { mask } from 'maska';
import moment from 'moment';
import RauzaButton from './RauzaButton.vue';
export default {
    data() {
        return {
            ready: false,
            serverQuery: Function,
            changeMode: Function,
            convOp: Function,
            convs: [],
            global: {},
            filters: {
                name: '',
                withoutDesc: false,
                onlyHidden: false,
                onlyPhotos: false,
                page: 1
            },
            params: {
                autoDesc: false,
                imageEditor: false
            },
            autoDescURLS: {},
            autoDescIMAGES: {},
            mask,
            announce: [],
            activeItem: -1,
            loading: true,
            offset: 0,
            loadingOffset: false,
            windowWidth: window.innerWidth,
            rows: [
                // {
                //     width: '175px',
                //     name: 'Артикул',
                //     return: (i) => `${i.med_id}`
                // },
            ],
            moment,
            pie: false,
            able: false
        }
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.changeMode = inject('changeMode');
        this.global = inject('global');
        this.announce = inject('announce');

        this.ready = true;

        this.sync();
        
        let allowed = [2, 4, 10];
        allowed.forEach((e)=>{
            if(this.global.account.id == e) {
                this.able = true;
            }
        })
        document.addEventListener('keydown', this._onkeydown);
    },
    components: {
        RauzaButton
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this._onkeydown);
        if (this.pie){
            // this.pie?.destroy();
        }
    },
    methods: {
        _onkeydown(e) {
            if(e.key == 'ArrowDown') {
                e.preventDefault();
                if (this.activeItem < this.convs.length) {
                    this.activeItem++;
                }
                if (this.activeItem == -1) this.activeItem = 0;
            }
            else if(e.key == 'ArrowUp') {
                e.preventDefault();
                if (this.activeItem > 0) {
                    this.activeItem--;
                }
            }
            else if (e.key == 'Enter') {
                if (!this.convs[this.activeItem]) return;
                this.openItem(this.convs[this.activeItem]);
            }
            else if (e.key == 'ArrowLeft') {
                this.global.editingItem.active = false;
            }

            if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
                if (this.$refs[`convitemid${this.activeItem}`]) {
                    let listy = this.$refs.list.scrollTop+this.$refs.list.offsetHeight,
                        y = this.$refs[`convitemid${this.activeItem}`].offsetTop;
                    console.log(this.$refs.list.scrollTop, y)
                    if ((y > listy) || (y-this.$refs.list.scrollTop) < 120) {
                        this.$refs[`convitemid${this.activeItem}`].scrollIntoView();
                    }
                }
            }
        },
        findLastIndex(array, searchKey, searchValue) {
            let index = array.slice().reverse().findIndex(x => x[searchKey] === searchValue),
                count = array.length - 1,
                finalIndex = index >= 0 ? count - index : index;
            return finalIndex;
        },
        copyClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                this.announce.push({type: 'S', message: 'Скопировано в буфер обмена.'});
            }, (err) => {
               this.announce.push({type: 'E', message: 'Не удалось скопировать в буфер обмена: '+err});
            });
        },
        async sync() {
            return new Promise((resolve) => {
                (async () => {
                    this.loading = true;
                    let response = await this.serverQuery('admin', 'getAllStock', {filters: JSON.stringify(this.filters), offset: this.offset + (50*(this.filters.page-1))});
                    console.log(response);
                    this.loading = false;
                    if (response.status) {
                        let data = response.data.message;
                        // if (data.length == 0) {
                        //     this.loadingOffset = true;
                        // }
                        for(let i in data) {
                            let conv = data[i];
                            if (!conv.med_id) continue;
                            if (this.convs.findIndex(e=>e.med_id == conv.med_id) != -1) continue;
                            try{conv.stockdata.images = JSON.parse(conv.stockdata.images);}catch(e){e}
                            this.convs.push(conv);
                        }
                        resolve(Object.keys(response.data?.message).length);
                    }
                })();
            });
        },
        openItem(i) {
            this.global.editingItem.data = i;
            this.global.editingItem.active = true;
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
            console.log('lazyload', this.offset);
            if (this.loadingOffset) return;
            this.loadingOffset = true;
            // this.offset += 50;
            this.filters.page++;
            let res = await this.sync();
            console.log(res);
            if (res > 0) this.loadingOffset = false;
            console.log('Updated!')
        },
        hasErrors(i) {
            let errors = [];
            if (!i.stockdata?.desc || i.stockdata.desc=='<p><br></p>') errors.push('Нет описания продукта.');
            if (!i.stockdata?.category) errors.push('Нет категории продукта.');
            if (!i.stockdata?.images || i.stockdata?.images=='[]' || !i.stockdata?.images.length) errors.push('Нет изображения продукта.');
            if (!i.stockdata?.url || i.stockdata?.url=='') errors.push('Нет URL продукта.');


            if (!errors.length) return false;
            else return errors;
        },
        async pasteImage(item) {
            if (!this.autoDescIMAGES[item.id]) return this.announce.push({type: 'E', message: 'Вставьте название файла.'});
            this.announce.push({type: 'S', message: 'Проверка данных... Пожалуйста, подождите.'});
            let errors = [];
            // get url
            
            for(let i in errors) {
                this.announce.push({type: 'E', message: errors[i]});
            }
            if (errors.length) return;
            item.stockdata.images.push(this.autoDescIMAGES[item.id]);

            let response = await this.serverQuery('admin', 'itemAddImage', {
                med_id: item.med_id,
                image: this.autoDescIMAGES[item.id]
            });
            console.log('paste image', response);
            this.announce.push({type: 'S', message: 'Товар успешно обновлен.'});
            this.autoDescIMAGES[item.id] = '';
        },
        async pasteDesc(item) {
            if (!this.autoDescURLS[item.id]) return this.announce.push({type: 'E', message: 'Вставьте ссылку.'});
            this.announce.push({type: 'S', message: 'Загрузка данных... Пожалуйста, подождите.'});
            let errors = [];
            // get url
            let urlparts = this.autoDescURLS[item.id].split('/'),
                itemurl = urlparts[3] == 'products' && urlparts[4] ? urlparts[4] : false;
            if (!itemurl) {
                this.announce.push({type: 'E', message:'Некорректный URL, пожалуйста, проверьте целостность вставленного URL.'});
                return;
            }
            let res = await this.serverQuery('admin', 'openURL', {url: this.autoDescURLS[item.id]});
            let parser = new DOMParser(),
                doc = parser.parseFromString(res.data.message, "text/html"),
                desc = '',
                paths = [],
                formatted_name = '',
                img = doc.querySelector('#bigimage img')?.src;

            if (doc.querySelector('.dg_collapsed')) {
                doc.querySelector('.title-default')?.remove();
                desc = doc.querySelector('.dg_collapsed').innerHTML;
            }
            else {
                errors.push('Не удалось получить описание из указанного адреса. Убедитесь что вы правильно вставили действительный URL.');
            }

            if (doc.querySelector('#path')) {
                doc.querySelector('#path a:first-child')?.remove();

                let pathLinks = doc.querySelectorAll('#path a');
                for (let i = 0; i < pathLinks.length; i++) {
                    paths.push(pathLinks[i].innerHTML);
                }
            }
            else {
                errors.push('Не удалось получить категорию товара. Проверьте целостность URL.');
            }
            if (doc.querySelector('.product_title')) {
                formatted_name = doc.querySelector('.product_title').innerHTML;
            }
            else {
                errors.push('Не удалось получить название товара. Проверьте целостность URL.');
            }
            for(let i in errors) {
                this.announce.push({type: 'E', message: errors[i]});
            }
            if (errors.length) return;
            item.stockdata.desc = desc;
            item.stockdata.formatted_name = formatted_name;
            item.stockdata.paths = JSON.stringify(paths);
            item.stockdata.url = itemurl;
            item.stockdata.category = 1;
            let response = await this.serverQuery('admin', 'saveItemStockdata', {
                med_id: item.med_id,
                formatted_name,
                desc: item.stockdata.desc,
                url: itemurl,
                paths: JSON.stringify(paths),
                images: JSON.stringify([img])
            });
            console.log('paste desc', response);
            this.announce.push({type: 'S', message: 'Товар успешно обновлен.'});
            this.autoDescURLS[item.id] = false;
        },
        async applyFilters() {
            if (this.loading) return this.announce.push({type: 'E', message: 'Подождите пока загрузится контент...'});
            this.loadingOffset = true;
            this.convs.splice(0, this.convs.length);
            this.offset = 0;
            if(this.filters.name.length) this.filters.page = 1;
            await this.sync();
            this.loadingOffset = false;
        }
    }
}
</script>

<style scoped>
    .stock-panel {
        display: grid;
        grid-template-columns: 230px 1fr;
        grid-template-rows: 100%;
        gap: 10px;
        height: 100%;
    }
    .stock-list {
        width: 100%;
        height: calc(100% - 78px);
        display: flex;
        flex-direction: column;
    }
    .filter {
        width: 100%;
        height: max-content;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        box-sizing: border-box;
        position: relative;
        margin-right: 10px;
    }
    .filter .filters {
        background-color: #FFF;
        padding: 15px 20px 5px 20px!important;
        border-radius: 20px;
        box-shadow: 0 5px 5px rgba(185, 185, 185, 0.1);
    }
    input {
        margin: 0;
        border: 1px #cccccc solid;
        border-radius: 5px;
        font-size: 1rem;
        margin-right: 10px;
        padding: 5px 10px;
        outline: none;
    }
    .autodesc-done {
        border: 1px solid var(--blue);
        height: 28px;
        padding: 0 5px;
        border-radius: 10px;
        color: var(--blue);
    }
    .autodesc-done:hover {
        background-color: var(--blue);
        color: #fff;
    }
    .filter .item-row {
        margin-bottom: 10px;
    }
    .filter .label {
        font-size: 1rem;
        margin-right: 10px;
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
    .convs-list {
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
    .header-item .line {
        width: calc(100% - 40px);
        height: 1px;
        background-color: var(--gray);
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translate(-50%);
    }
    .conv-title:nth-child(1){
        margin-left: 0;
    }
    .conv-title.convtitlecopiable:hover {
        text-decoration: underline;
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
    .conv-title {
        margin-left: 20px;
        font-weight: 500;
    }
    /* The switch - the box around the slider */
    .switch {
        position: relative;
        display: inline-block;
        width: 56px;
        height: 30px;
        margin-right: 10px;
    }

    /* Hide default HTML checkbox */
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    /* The slider */
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: .4s;
        transition: .4s;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 22px;
        width: 22px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }

    input:checked + .slider {
        background-color: var(--blue);
    }

    input:focus + .slider {
        box-shadow: 0 0 1px var(--blue);
    }

    input:checked + .slider:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }

    /* Rounded sliders */
    .slider.round {
        border-radius: 34px;
    }

    .slider.round:before {
        border-radius: 50%;
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