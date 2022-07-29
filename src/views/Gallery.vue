<template>
    <div class="rauza-header">
        <h2>Галерея</h2>
        <h3>База изображений товаров</h3>
    </div>
    <div class="rauza-innercontent" v-if="ready">
        <div class="header-item">
            <div class="item-col">
                <div class="row" :style="{width: '100%'}">Несжатые изображения</div>
                <div class="row" :style="{width: '100%'}">Вторая стадия</div>
                <div class="row" :style="{width: '100%'}">Готовые изображения</div>
            </div>
            <div class="line"></div>
        </div>
        <div class="convs-list" ref="list" @scroll="listScroll">
            <div class="row" :style="{width: '100%'}">
                <div :class="{'item': true}" @click="keepOnLoading=!keepOnLoading; startUploading()">
                    <div class="line" :style="{background: 'var(--blue)'}"></div>
                    <div class="item-row" style="display: flex; justify-content: center;">
                        <div class="conv-title" :style="{textAlign: 'center', fontWeight: 'bold', color: 'var(--blue)'}">{{keepOnLoading ? 'Остановить сжатие' : 'Начать сжатие'}}</div>
                        <i class="fi fi-sr-angle-down" style="margin-left: 10px; color: var(--blue);"></i>
                    </div>
                </div>
                <div :class="{'item': true}"
                    v-for="(i, ind) in uncompressed" :key="ind"
                >
                    <div class="line" :style="{background: 'var(--blue)'}"></div>
                    <div class="item-row">
                        <div :class="{'spaceloading': true, 'stopped': loadingFile!=i}"></div>
                        <div class="conv-title" :style="{width: '100%'}" v-html="i"></div>
                        <!-- <i class="autodesc-done-red fi-sr-cross" @click="deleteImage(ind)"></i> -->
                    </div>
                </div>
            </div>
            <div class="row" :style="{width: '100%'}">

            </div>
            <div class="row" :style="{width: '100%'}">
                <div :class="{'item': true}"
                    v-for="(i, ind) in compressed" :key="ind"
                >
                    <div class="line" :style="{background: 'var(--blue)'}"></div>
                    <div class="item-row">
                        <i class="fi fi-sr-file-check" style="color: var(--blue); margin-right: 10px;"></i>
                        <div class="conv-title" :style="{width: '100%'}" v-html="i"></div>
                        <!-- <i class="autodesc-done-red fi-sr-cross" @click="deleteImage(ind)"></i> -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import $axios from 'axios';
export default {
    data() {
        return {
            ready: false,
            socket: Function,
            changeMode: Function,
            announce: Function,
            axios: Function,
            global: {},
            uncompressed: [],
            compressed: [],
            loadingFile: '',
            keepOnLoading: false,
            offset: 0,
            loadingGallery: false
        }
    },
    mounted() {
        this.changeMode = inject('changeMode');
        this.socket = inject('socket');
        this.global = inject('global');
        this.announce = inject('announce');
        this.axios = $axios.create({
			baseURL: 'https://rauza-ade.kz/files/', //http://webspark.beget.tech/api/
			timeout: 40000,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		});

        this.ready = true;

        this.getGallery();
    },
    components: {
        
    },
    methods: {
        async getGallery(add) {
            if (this.loadingGallery) return;
            this.loadingGallery = true;
            if (add) this.offset += 50;
            else this.offset = 0;
            let response = await this.serverQuery('assets', 'getGallery', {offset: this.offset}),
                data = response.data.message;
            console.log(response);
            if (add) {
                data.uncompressed.forEach(e => this.uncompressed.push(e));
                data.compressed.forEach(e => this.compressed.push(e));
            }
            else {
                this.uncompressed = data.uncompressed;
                this.compressed = data.compressed;
            }
            this.loadingGallery = false;
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
				this.axios.post(`/${url}/`, params).then(response => {
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
        async startUploading() {
            if (!this.keepOnLoading) return;
            this.loadingFile = this.uncompressed[0];
            let response = await this.serverQuery('assets', 'startCompressImage', {image: this.uncompressed[0]});
            console.log('startUploading', response);
            if (!response.status) {
                this.getGallery();
                return;
            }
            this.compressed.unshift(this.uncompressed[0]);
            this.uncompressed.splice(0, 1);
            setTimeout(() => {
                this.startUploading();
            }, 2000);
        },
        listScroll(e) {
            let scrollBottom = e.target.scrollTop+e.target.offsetHeight;
            if(scrollBottom > (e.target.scrollHeight-10)) {
                this.getGallery(true);
            }
        },
    }
}
</script>

<style scoped>
    h2 {
        font-weight: bold;
        letter-spacing: .1px;
    }
    .rauza-innercontent {
        height: 100%;
        overflow-y: scroll;
        padding-top: 5px;
        padding-bottom: 20px;
        display: flex;
        flex-direction: column;
    }
    .convs-list {
        display: flex;
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
    .spaceloading {
        width: 20px;
        height: 20px;
        margin-right: 12px;
        mask-image: url(../assets/loading.svg);
        mask-size: cover;
        background-color: var(--blue);
        opacity: 0.3;
    }
    .spaceloading.stopped {
        mask-image: url(../assets/circle-small.svg);
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