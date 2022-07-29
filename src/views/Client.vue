<template>
    <div class="item-data" v-if="ready">
        <div class="rauza-header">
            <div class="item-row">
                <h2>Детали клиента</h2>
            </div>
            <h3>Клиент # {{data.id}}</h3>
        </div>
        <div class="item-row" v-if="loading">
            <div class="spaceloading"></div>
            <span>Загрузка данных...</span>
        </div>
        <div class="rauza-innercontent" v-if="!loading">
            <div class="label">Данные клиента</div>
            {{mask(data.phone, '+7 (7##) ### ##-##')}}
            <RauzaInput title="Полное имя клиента" v-model="data.fullname"/>
            <RauzaInput title="PIN код клиента" v-model.number="data.pin"/>
            <div class="block">Прежде чем менять PIN код клиента, убедитесь что номер телефона действительно принадлежит обращающемуся человеку.</div>
            <RauzaButton @click="saveMemberData" :loading="saveLoading" width="100%" height="49px" text="Сохранить" background="rgba(166, 57, 254, 0.1)" color="rgb(166, 57, 254)" marginTop="20px" padding="15px 20px"/>
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
            data: {},
            global: {},
            announce: [],
            loading: true,
            saveLoading: false
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
        this.orderOp = inject('orders');
        this.announce = inject('announce');
        this.init();
        this.ready = true;
    },
    methods: {
        async init() {
            let response = await this.serverQuery('admin', 'getParticularClient', {memberid: this.id});
            console.log(response);
            this.loading = false;
            if (response.status) {
                let data = response.data.message;
                this.data = data;
                this.loading = false;
            }
        },
        async saveMemberData() {
            if (this.data.pin.length > 4) {
                this.announce.push({type: 'E', message: 'PIN код клиента должен состоять из 4-х цифр.'});
                return;
            }
            this.saveLoading = true;
            let res = await this.serverQuery('admin', 'updateParticularClient', {
                member_data: JSON.stringify(this.data)
            });
            this.loadingSaveOrder = false;
            if(res.status) {
                this.announce.push({type: 'S', message: 'Клиент успешно обновлен.'});
            }
            this.saveLoading = false;
        },
    },
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
        width: 100%;
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
        padding-bottom: 20px;
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
</style>