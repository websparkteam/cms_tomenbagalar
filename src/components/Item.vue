<template>
    <div class="item-data" v-if="ready">
        <div class="rauza-header">
            <div class="item-row">
                <div class="rauza-back" @click="global.editingItem.active = false">
                    <i class="fi fi-rs-arrow-small-left"></i>&nbsp;
                    <span>Назад</span>
                </div>
                <h2>Детали товара</h2>
            </div>
            <h3>Артикул {{data.med_id}}</h3>
        </div>
        <div class="item-row" v-if="loading">
            <div class="spaceloading"></div>
            <span>Загрузка данных...</span>
        </div>
        <div class="rauza-innercontent" v-if="!loading && data">
            <RauzaInput :title="`Название товара (${data.med_name})`" v-model="data.stockdata.formatted_name"/>
            
            <RauzaInput title="URL товара /..." v-model="data.stockdata.url"/>
            <RauzaButton @click="data.stockdata.url=encodeURI(transliterate(data.med_name.toLowerCase()))" flaticon="fi-sr-magic-wand" :loading="saveLoading" align="left" width="100%" height="30px" text="Сгенерировать URL" background="rgba(166, 57, 254, 0)" color="inherit" marginTop="10px" padding="7.5px 10px"/>

            <!-- <a @click="openNewTab(`https://europharma.kz/search?q=${data.med_name.split(' ')[0]}&`)">Открыть в <img src="https://europharma.kz/images/europharma_ru.svg"/></a>
            <a @click="pasteDesc">Вставить описание из <img src="https://europharma.kz/images/europharma_ru.svg"/></a> -->
            <div class="label">Категории товара</div>
            <div class="categories">
                <div class="category" v-for="(i, ind) in product_path" :key="ind">
                    <div class="name">{{i.name}}</div>
                    <template v-if="ind!=product_path.length-1">»</template>
                </div>
                <i class="fi fi-sr-cross" style="cursor: pointer;" v-if="data.stockdata.category!=null" @click="data.stockdata.category=null; updateProductPath();"></i>
            </div>
            <RauzaInput title="Поиск категорий" v-model="catsearch" :marginTop="0"/>
            <div class="catsearch-autocomplete">
                <div class="unit" v-for="(i, ind) in filteredCats" :key="ind" @click="data.stockdata.category=i.id; updateProductPath(); catsearch=''; filteredCats.splice(0, filteredCats.length);">
                    {{i.name}}
                </div>
                 <div class="unit" v-if="catsearch.length>0" @click="createCategory=true">
                    <i class="fi fi-sr-add"></i>Создать категорию {{catsearch}}...
                </div>
            </div>
            <div class="label">Акции</div>
            <RauzaInput title="Скидка на товар в процентах 0-100%" v-model.number="discount" :marginTop="0"/>
            <div class="label">Описание товара</div>
            <QuillEditor theme="snow" ref="editor" @textChange="textUpdate"/>
            <div class="label">Загруженные изображения</div>
            <div class="createCategory" v-if="createCategory">
                <div class="inner">
                    <i class="fi fi-sr-cross" style="position: absolute;right: 200px;font-size: 1.7rem;opacity: 0.6;cursor: pointer;" @click="newcatsearch=''; createCategory=false"></i>
                    <div class="label large">Новая категория {{catsearch[0].toUpperCase() + catsearch.toLowerCase().substring(1)}}</div>
                    <div class="categories">
                        <div class="category" v-for="(i, ind) in newcatpath" :key="ind">
                            <div class="name">{{i.name}}</div>»
                        </div>
                        <div class="category">
                            <div class="name">{{catsearch[0].toUpperCase() + catsearch.toLowerCase().substring(1)}}</div>
                        </div>
                    </div>
                    <div class="label">Путь категории: выберите родительскую категорию</div>
                    <RauzaInput title="Поиск категорий" v-model="newcatsearch" :marginTop="0"/>
                    <div class="catsearch-autocomplete">
                        <div class="unit" v-for="(i, ind) in newcatfilteredCats" :key="ind" @click="updateNewCatProductPath(i.id); newcatparent = i.id; newcatsearch='';">
                            {{i.name}}
                        </div>
                    </div>
                    <RauzaButton @click="createNewCategory" flaticon="fi-sr-disk" :loading="createNewCategoryLoading" width="100%" height="49px" text="Все верно, создать новую категорию" background="var(--blue)" color="rgb(255, 255, 255)" marginTop="20px" padding="15px 20px"/>
                    <RauzaButton @click="newcatsearch=''; newcatpath.splice(0, newcatpath.length)" flaticon="fi-sr-trash" width="100%" height="49px" text="Очистить категории" background="transparent" color="rgb(255, 255, 255)" marginTop="20px" padding="15px 20px"/>
                </div>
            </div>
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
                        v-for="(i, ind) in data.stockdata.images" :key="ind"
                    >
                        <div class="line" :style="{background: 'var(--blue)'}"></div>
                        <div class="item-row">
                            <div class="watched-circle"></div>
                            <div class="conv-title" :style="{width: '100%'}" v-html="i"></div>
                            <input class="conv-title" type="text" :style="{width: '300px'}" v-model="data.stockdata.images[ind]" placeholder="Название файла">
                            <i class="autodesc-done fi-sr-check" @click="pasteDesc(i)"></i>
                            <i class="autodesc-done-red fi-sr-cross" @click="deleteImage(ind)"></i>
                        </div>
                    </div>
                    <div class="item" style="height: 50px;">
                        <div class="hover">
                            <label>
                                <div class="label">
                                    <i class="fi fi-sr-upload"></i>
                                    Нажмите чтобы загрузить <template v-if="speed!=''">({{speed}}) {{progress.toFixed(1)}}%</template>
                                </div>
                                <input type="file" :accept="accept" ref="uploadingFile" v-on:change="uploadFile"/>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <RauzaButton @click="saveItemStockdata" flaticon="fi-sr-disk" :loading="saveLoading" width="100%" height="49px" text="Сохранить" background="rgba(166, 57, 254, 0.1)" color="rgb(166, 57, 254)" marginTop="20px" padding="15px 20px"/>
            <!-- <RauzaButton @click="resetItemStockdata" flaticon="fi-sr-time-past" :loading="resetLoading" width="100%" height="49px" text="Сбросить данные" background="rgba(166, 57, 254, 0)" marginTop="20px" padding="15px 20px"/> -->
        </div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import RauzaButton from './RauzaButton.vue';
import RauzaInput from './RauzaInput.vue';
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';
export default {
    data() {
        return {
            ready: false,
            changeMode: Function,
            socket: Function,
            serverQuery: Function,
            serverFile: Function,
            global: {},
            announce: [],
            loading: true,
            saveLoading: false,
            resetLoading: false,
            createCategory: false,
            createNewCategoryLoading: false,
            product_path: [],
            catsearch: '',
            discount: null,
            cats: [],
            filteredCats: [],
            newcatfilteredCats: [],
            newcatsearch: '',
            newcatpath: [],
            newcatparent: '',
            speed: '',
            progress: ''
        }
    },
    components: {
        RauzaButton,
        RauzaInput,
        QuillEditor
    },
    mounted() {
        this.global = inject('global');
        this.changeMode = inject('changeMode');
        this.socket = inject('socket');
        this.serverQuery = inject('serverQuery');
        this.serverFile = inject('serverFile');

        this.announce = inject('announce');
        this.init();

        console.log('DATA', this.data)
        try{
            if (!this.data?.stockdata?.formatted_name) {
                this.data.stockdata.formatted_name = this.data?.med_name;
            }
            this.discount = this.data?.stockdata?.discount;
        }
        catch(e){e}
    },
    methods: {
        async init() {
            this.ready = true;
            await this.loadCategories();
            this.updateProductPath();
            this.loading = false;
            this.$nextTick(() => {
                let res = this.data?.stockdata?.desc?.replaceAll('div', 'p');
                this.$refs.editor.setHTML(res);
            });
        },
        loadCategories() {
            return new Promise((resolve) => {
                (async()=>{
                    let cats = await this.serverQuery('products', 'getCategories');
                    this.cats = JSON.parse(cats.data.message);
                    resolve();
                })();
            });
        },
        updateProductPath() {
            let cat = {el: -1};
            console.log(this.cats)
            this.recursiveCatSearch(cat, this.cats, this.data?.stockdata?.category);
            console.log('mainsubcat', cat.el)
            this.getCatParents(cat.el);
        },
        updateNewCatProductPath(id) {
            let cat = {el: -1};
            console.log(this.cats)
            this.recursiveCatSearch(cat, this.cats, id);
            console.log('mainsubcat', cat.el)
            this.newCatParents(cat.el);
        },
        async saveItemStockdata() {
            this.saveLoading = true;
            let response = await this.serverQuery('admin', 'updateSomeItemData', {
                med_id: this.data.med_id,
                desc: this.$refs.editor.getHTML(),
                formattedName: this.data.stockdata?.formatted_name,
                category: this.data.stockdata?.category,
                url: this.data.stockdata?.url,
                discount: isNaN(parseInt(this.discount)) ? 0 : parseInt(this.discount)
            });
            let newdata = response.data.message;
            console.log(newdata);
            newdata.images = JSON.parse(newdata.images);
            this.data.stockdata = newdata;
            this.saveLoading = false;
            this.announce.push({type: 'S', message: 'Товар успешно обновлен.'});
        },
        async resetItemStockdata() {
            this.resetLoading = true;
            await this.serverQuery('admin', 'resetItemStockdata', {
                med_id: this.data.med_id
            });
            this.resetLoading = false;
            this.announce.push({type: 'S', message: 'Товар успешно сброшен.'});
            this.global.editingItem.active = false;
            delete this.data.stockdata;
        },
        async createNewCategory() {
            this.createNewCategoryLoading = true;
            let newcatname = this.catsearch[0].toUpperCase() + this.catsearch.toLowerCase().substring(1);
            let resp = await this.serverQuery('admin', 'createNewCategory', {
                parent_id: this.newcatparent,
                name: newcatname
            });
            if(!resp.status) return this.announce.push({type: 'E', message: 'Ошибка. Категория не создана.'});
            this.announce.push({type: 'S', message: 'Категория успешно создана. Обновление...'});
            await this.loadCategories();
            this.announce.push({type: 'S', message: 'Успешно обновлено.'});
            this.createNewCategoryLoading = false;
            this.createCategory = false;
            this.newcatsearch = '';
            this.newcatfilteredCats.splice(0, this.newcatfilteredCats.length);
            this.catsearch = newcatname;
            this.updateCatsearch();
        },
        async deleteImage(ind) {
            this.data.stockdata.images.splice(ind, 1);

            await this.serverQuery('admin', 'itemAddImage', {
                med_id: this.data.med_id,
                delete: 1,
                image: JSON.stringify(this.data.stockdata.images)
            });
            this.announce.push({type: 'S', message: 'Изображение успешно удалено.'});
        },
        textUpdate() {
            this.data.stockdata.desc = this.$refs.editor.getHTML();
        },
        async uploadFile() {
            let files = this.$refs.uploadingFile.files;
            for(let i = 0; i < files.length; i++) {
                this.announce.push({type: 'S', message: 'Загрузка изображений...'});
                let lastProgress = Date.now(),
                    lastLoaded = 0,
                    response = await this.serverFile('uploadProductImage', files[i], {
                    med_id: this.data.med_id,
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
                    this.data.stockdata.images.push(response.data.message.fileName);
                }
            }
            delete this.$refs.uploadingFile.files;
        },
        openNewTab(url) {
            window.open(url, '_blank').focus();
        },
        async pasteDesc() {
            let res = await this.serverQuery('admin', 'openURL', {url: 'https://europharma.kz/tsitramon-p-no10-tabl-2'});
            let parser = new DOMParser(),
                doc = parser.parseFromString(res.data.message, "text/html");
            console.log(doc.querySelector('.tab-slider--body'));
            doc.querySelector('h2:first-child').remove();
            this.$refs.editor.setHTML(doc.querySelector('.tab-slider--body').innerHTML);
        },
        recursiveCatSearch(cat, cats, value) {
            if (!cats) return null;
            for(let i in cats) {
                if (cats[i].id == value) return cat.el = cats[i];
                let ind = cats[i].subcats.findIndex(j => j.id == value);
                if (ind == -1) this.recursiveCatSearch(cat, cats[i].subcats, value);
                else {
                    cat.el = cats[i].subcats[ind];
                }
            }
		},
        recursiveCatNameSearch(cat, cats, value) {
            if (!cats) return null;
            value = value.toLowerCase();
            for(let i in cats) {
                if (cat.el.length > 10) return;
                if (cats[i].name.toLowerCase().indexOf(value) !== -1) cat.el.push({
                    id: cats[i].id,
                    name: cats[i].name
                });
                if (cats[i].subcats.length) {
                    this.recursiveCatNameSearch(cat, cats[i].subcats, value);
                }
            }
		},
        async getCatParents(subcat) {
            let a = true,
                i = subcat,
                his = [];
            his.push(subcat);
            
            while(a) {
                let b = {el: -1};
                this.recursiveCatSearch(b, this.cats, i.parent_category);
                if (b.el == -1) {
                    break;
                }
                else {
                    his.push(b.el);
                    i = b.el;
                }
            }
            console.log('his', his);
            this.product_path.splice(0, this.product_path.length);
            his.forEach(e => this.product_path.unshift(
                {
                    name: e.name
                }
            ));
        },
        async newCatParents(subcat) {
            let a = true,
                i = subcat,
                his = [];
            his.push(subcat);
            
            while(a) {
                let b = {el: -1};
                this.recursiveCatSearch(b, this.cats, i.parent_category);
                if (b.el == -1) {
                    break;
                }
                else {
                    his.push(b.el);
                    i = b.el;
                }
            }
            console.log('his', his);
            this.newcatpath.splice(0, this.newcatpath.length);
            his.forEach(e => this.newcatpath.unshift(
                {
                    name: e.name
                }
            ));
        },
        updateCatsearch() {
            if (this.catsearch.length > 0) {
                let catel = {el: []};
                this.recursiveCatNameSearch(catel, this.cats, this.catsearch);
                this.filteredCats = catel.el;
            }
            else {
                this.filteredCats.splice(0, this.filteredCats.length);
            }
        },
        transliterate(word) {
            var a = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"a","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu"," ":"-","/":"-","%":"pc",".":"-"};
            return word.split('').map(function (char) {
                return a[char] || char;
            }).join("");
        }
    },
    computed: {
        data() {
            return this.global.editingItem?.data
        }
    },
    watch: {
        catsearch() {
            this.updateCatsearch();
        },
        newcatsearch(val) {
           if (val.length > 0) {
                let catel = {el: []};
                this.recursiveCatNameSearch(catel, this.cats, val);
                this.newcatfilteredCats = catel.el;
            }
            else {
                this.newcatfilteredCats.splice(0, this.newcatfilteredCats.length);
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
</style>

<style scoped>
    .item-data {
        width: calc(100% - 60px);
        height: 100%;
        position: absolute;
        top: 10px;
        background-color: var(--gray);
        z-index: 6000;
        box-sizing: border-box;
        overflow-y: scroll;
        padding-bottom: 10px;
    }
    h2 {
        font-weight: bold;
        letter-spacing: .1px;
    }
    .rauza-innercontent {
        height: max-content;
        overflow-y: scroll;
        padding-top: 0;
        padding-bottom: 20px;
        padding-right: 50px;
        display: flex;
        flex-direction: column;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
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
    .autodesc-done-red {
        border: 1px solid var(--red);
        height: 28px;
        padding: 0 5px;
        border-radius: 10px;
        color: var(--red);
    }
    .autodesc-done-red:hover {
        background-color: var(--red);
        color: #fff;
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
    .categories {
        display: flex;
        margin-top: 20px;
    }
    .categories .category {
        margin-right: 10px;
        font-size: 1rem;
        display: flex;
        align-items: center;
    }
    .categories .category .name {
        margin-right: 10px;
        color: rgb(75, 187, 239);
        font-weight: bold;
        cursor: pointer;
    }
    .catsearch-autocomplete {
        margin-top: 10px;
    }
    .catsearch-autocomplete .unit {
        background-color: var(--blue);
        color: white;
        display: flex;
        font-weight: bold;
        width: max-content;
        padding: 5px 10px;
        margin-bottom: 5px;
        border-radius: 10px;
        cursor: pointer;
    }
    .catsearch-autocomplete .unit:hover {
        background-color: rgb(36, 132, 177);
    }
    .createCategory {
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .createCategory .inner {
        display: flex;
        flex-direction: column;
        width: calc(100% - 200px);
        height: 100%;
        overflow-y: scroll;
        padding: 20px 0;
        box-sizing: border-box;
    }
    .createCategory .large {
        font-size: 2rem;
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
        color: #2c3e50;
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