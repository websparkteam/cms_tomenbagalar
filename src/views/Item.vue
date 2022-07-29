<template>
    <div class="item-data" v-if="ready">
        <div class="rauza-header">
            <div class="item-row">
                <h2>Детали товара</h2>
            </div>
            <h3>Товар {{stockData.med_id}}</h3>
        </div>
        <div class="item-row" v-if="loading">
            <div class="spaceloading"></div>
            <span>Загрузка данных...</span>
        </div>
        <div class="rauza-innercontent" v-if="!loading">
            <div class="label">Стоковая информация товара</div>
            <div class="info">
                <div class="lab">Название позиции: </div>
                <div class="value">{{stockData.med_name}}</div>
            </div>
            <div class="info">
                <div class="lab">Производитель: </div>
                <div class="value">{{stockData.vendor_name}}</div>
            </div>
            <div class="info">
                <div class="lab">Страна: </div>
                <div class="value">{{stockData.country_name}}</div>
            </div>
            
            <div class="label">Карточка товара</div>
            <RauzaInput title="Розничное название товара" v-model="zelenkaData.name"/>
            <RauzaInput title="Название бренда" v-model="zelenkaData.brand"/>
            <RauzaInput title="Уровень популярности (0-500)" v-model.number="zelenkaData.rating_count"/>

             <div class="info" v-if="catName">
                <div class="lab">Текущая категория: </div>
                <div class="value">{{catName}}</div>
            </div>
            <RauzaInput title="Категория" v-model="catSearch"/>
            <div class="cats">
                <div class="cat" v-for="(i, ind) in catResults" :key="ind" @click="zelenkaData.rauzacat=i.id; getCatName(); catResults.splice(0, catResults.length)">{{i.name}}</div>
            </div>
            
            <RauzaInput v-for="(i, ind) in renderZelenkaData().specs" :key="ind" :title="ind" v-model="zelenkaData.specs[ind]"/>

            <div class="item-images">
                <div class="header-item">
                    <div class="item-col">
                        <div class="row" :style="{width: '32px', display: 'flex', alignItems: 'center'}"><i class="fi fi-rs-bell"></i></div>
                        <div class="row" :style="{width: '100%'}">Название изображения</div>
                    </div>
                    <div class="line"></div>
                </div>
                <div class="convs-list" ref="list">
                    <div :class="{'item': true}"
                        v-for="(i, ind) in zelenkaData.images" :key="ind"
                    >
                        <div class="line" :style="{background: 'var(--blue)'}"></div>
                        <div class="item-row">
                            <div class="watched-circle"></div>
                            <div class="conv-title" :style="{width: '100%'}" v-html="i"></div>
                            <input class="conv-title" type="text" :style="{width: '300px'}" v-model="zelenkaData.images[ind]" placeholder="Название файла">
                            <i class="autodesc-done-red fi-sr-cross" @click="deleteImage(ind)"></i>
                        </div>
                    </div>
                    <div class="item" style="height: 50px;">
                        <div class="hover">
                            <label>
                                <div class="label">
                                    <i class="fi fi-sr-upload" style="margin-right: 10px;"></i>
                                    Нажмите чтобы загрузить <template v-if="speed!=''">({{speed}}) {{progress.toFixed(1)}}%</template>
                                </div>
                                <input type="file" accept="image/*" ref="uploadingFile" v-on:change="uploadFile"/>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <RauzaButton @click="saveItem" :loading="saveLoading" width="100%" height="49px" text="Сохранить" background="rgba(166, 57, 254, 0.1)" color="rgb(166, 57, 254)" marginTop="20px" padding="15px 20px"/>
        </div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import { mask } from 'maska';
import RauzaButton from '../components/RauzaButton.vue';
import RauzaInput from '../components/RauzaInput.vue';
export default {
    data() {
        return {
            ready: false,
            mask,
            id: this.$route.params.id,
            changeMode: Function,
            orderOp: Function,
            serverQuery: Function,
            serverFile: Function,
            stockData: {},
            zelenkaData: {},
            global: {},
            announce: [],
            loading: true,
            saveLoading: false,
            speed: '',
            progress: '',
            catSearch: '',
            catResults: [],
            catName: ''
        }
    },
    components: {
        RauzaButton,
        RauzaInput,
    },
    mounted() {
        this.global = inject('global');
        this.changeMode = inject('changeMode');
        this.serverQuery = inject('serverQuery');
        this.serverFile = inject('serverFile');
        this.orderOp = inject('orders');
        this.announce = inject('announce');

        this.zelenkaData = this.renderZelenkaData();
        this.init();
        this.ready = true;
    },
    methods: {
        renderZelenkaData() {
            return {
                med_id: null,
                name: '',
                brand: '',
                rating_count: 0,
                rauzacat: null,
                images: [],
                specs: {
                    'Назначение': '',
                    'Лекарственная форма': '',
                    'Способ применения': '',
                    'Минимальный возраст': '',
                    'Количество штук в упаковке': '',
                    'Упаковка': '',
                    'Фармакотерапевтическая группа': '',
                    'Анатомо-терапевтическая характеристика': '',
                    'Дозировка вещества в препарате': '',
                    'Показания к применению': '',
                    'Способ применения и дозы': '',
                    'Противопоказания': '',
                    'Рецептурный препарат': '',
                    'Действующее вещество': '',
                }
            }
        },
        async init() {
            let response = await this.serverQuery('admin', 'getItemStockCard', {med_id: this.id});
            console.log(response);
            this.stockData = response.data.message.stockData;

            let responseZel = response.data.message.zelenkaData;
            this.zelenkaData.med_id = this.stockData.med_id;
            if (responseZel) {
                let responseSpecs = responseZel.specs ? JSON.parse(responseZel.specs) : {};
                this.zelenkaData.name = responseZel.name;
                this.zelenkaData.brand = responseZel.brand;
                this.zelenkaData.rating_count = parseInt(responseZel.rating_count);
                this.zelenkaData.rauzacat = parseInt(responseZel.rauzacat);
                this.zelenkaData.images = JSON.parse(responseZel.images);

                for(let i in responseSpecs) {
                    this.zelenkaData.specs[i] = responseSpecs[i];
                }
                this.getCatName();
            }

            this.loading = false;
        },
        async saveItem() {
            this.saveLoading = true;
            let res = await this.serverQuery('admin', 'createOrUpdateCard', {
                card_data: JSON.stringify(this.zelenkaData)
            });
            this.loadingSaveOrder = false;
            if(res.status) {
                this.announce.push({type: 'S', message: 'Товар и карточка успешно обновлены.'});
            }
            this.saveLoading = false;
        },
        async uploadFile() {
            let files = this.$refs.uploadingFile.files;
            for(let i = 0; i < files.length; i++) {
                this.announce.push({type: 'S', message: 'Загрузка изображений...'});
                let lastProgress = Date.now(),
                    lastLoaded = 0,
                    response = await this.serverFile('uploadProductImage', files[i], {
                    med_id: this.zelenkaData.med_id,
                    progress: (e) => {
                        let now = Date.now();
                        let kbps = (((e.loaded-lastLoaded) / 1024)/((now-lastProgress) / 1000)).toFixed(),
                            mbps = (kbps/1024).toFixed(),
                            speed = kbps+' KB/s';
                        if (kbps > 1024) speed = mbps+' MB/s';
                        this.speed = speed;
                        this.progress = (e.loaded / e.total) * 100;
                        lastProgress = Date.now();
                        lastLoaded = e.loaded;
                        console.log(this.progress);
                    }
                });
                if (response == -1) return;
                if (response.status) {
                    this.filename = '';
                    this.speed = '';
                    this.progress = 0;
                    console.log('Completed!', response);
                    this.announce.push({type: 'S', message: 'Изображение успешно загружено!'});
                    this.zelenkaData.images.push(response.data.message.fileName);
                }
            }
            delete this.$refs.uploadingFile.files;
        },
        async deleteImage(ind) {
            this.zelenkaData.images.splice(ind, 1);
            this.announce.push({type: 'S', message: 'Изображение успешно удалено.'});
        },
        async getCatName() {
            let response = await this.serverQuery('admin', 'searchCatById', {id: this.zelenkaData.rauzacat});
            if (response.data.message) {
                this.catName = response.data.message.name;
            }
        }
    },
    watch: {
        async catSearch() {
            this.catResults.splice(0, this.catResults.length);
            let response = await this.serverQuery('admin', 'searchCat', {name: this.catSearch}),
                cats = response.data.message;
            for(let i in cats) {
                this.catResults.push(cats[i]);
            }
        }
    }
}
</script>

<style>
    .ql-toolbar.ql-snow {
        margin-top: 10px;
    }
    .ql-container.ql-snow {
        background-color: #fff;
        height: 400px;
    }
    .group {
        width: calc(100% - 10px) !important;
    }
</style>

<style scoped>
    input {
        width: 80% !important;
    }
    .info {
        background-color: var(--el-bg-color-overlay);
        color: var(--el-text-color-primary);
        margin-top: 10px;
        padding: 5px 10px;
        box-sizing: border-box;
        border-radius: 5px;
    }
    .info .lab {
        font-weight: bold;
        font-size: 1.1rem;
    }
    .item-data {
        width: 100%;
        height: 100%;
        margin-top: 10px;
        display: flex;
        flex-direction: column;
    }
    h2 {
        font-weight: bold;
        letter-spacing: .1px;
    }
    .rauza-innercontent {
        height: max-content;
        overflow-y: scroll;
        padding-top: 0;
        padding-bottom: 40px;
        display: flex;
        flex-direction: column;
        margin: 0;
    }
    .rauza-innercontent a {
        margin-top: 15px;
        text-decoration: none;
        color: #a9cf44;
        font-weight: bold;
        display: flex;
        align-items: center;
        background-color: #fff;
        width: max-content;
        padding: 10px;
        border-radius: 10px;
        cursor: pointer;
    }
    a img {
        height: 20px;
        margin-left: 10px;
    }
    .rauza-innercontent a:hover {
        background-color: #a9cf44;
        color: #FFF;
    }
    .item-row {
        width: 100%;
        align-items: center;
        display: flex;
        flex-direction: row;
    }
    .item-row:last-child {
        margin-bottom: 0;
    }
    .label {
        margin-top: 20px;
        font-size: 1.2rem;
        font-weight: bold;
    }
    .select-role {
        margin-top: 30px;
        font-size: 16px;
        width: max-content;
        border: none;
        border-bottom: 1px solid #ccc;
        padding: 10px;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        align-items: center;
        cursor: pointer;
        justify-content: center;
        outline: none;
        color: black;
    }
    .block {
        margin-top: 10px;
        font-weight: bold;
    }
    .convs-list {
        display: flex;
        align-items: center;
        flex-direction: column;
        overflow-y: scroll;
        background-color: var(--el-bg-color-overlay);
        color: var(--el-text-color-primary);
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
        background: linear-gradient(270deg, #cccccc, #e9e9e9, #cccccc);
        background-size: 400% 400%;

        animation: flicker-loading 2s infinite !important;
    }
    .item-images {
        margin-top: 15px;
    }
    .item-data {
        width: 100%;
        margin-top: 10px;
    }
    .item-data span {
        font-weight: 500;
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
    .hover {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        transition: 0.2s ease all;
        color: #000;
    }

    .hover .label {
        margin-top: 0;
        margin-left: 20px;
        font-weight: normal;
        font-family: Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: var(--el-text-color-primary);
        font-size: 1rem;
        letter-spacing: .3px;
        display: flex;
    }
    .hover label {
        position: relative;
        overflow: hidden;
    }
    .hover label input[type="file"] {
        display: none;
    }
    .hover label {
        display: flex;
        align-items: center;
        align-content: center;
        flex-wrap: wrap;
        width: 100%;
        height: 100%;
        float: left;
        cursor: pointer;
    }
    .autodesc-done-red {
        border: 1px solid var(--red);
        height: 28px;
        padding: 0 5px;
        border-radius: 10px;
        color: var(--red);
        margin-left: 10px;
    }
    .autodesc-done-red:hover {
        background-color: var(--red);
        color: #fff;
    }
    .cats {
        margin-top: 10px;
        padding: 5px 10px;
        box-sizing: border-box;
    }
    .cats .cat {
        background-color: #FFF;
        border-radius: 5px;
        margin-bottom: 5px;
        padding: 5px 10px;
        font-weight: bold;
        transition: 0.2s all;
        cursor: pointer;
    }
    .cats .cat:hover {
        background-color: rgb(231, 231, 231);
    }
</style>