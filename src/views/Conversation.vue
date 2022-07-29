<template>
    <div :class="{'rauza-chat': true}">
        <div class="main-bar" v-if="ready">
            <div class="header">
                <div class="row">
                    <i class="fi-rs-angle-left" @click="changeMode('Messages')"></i>
                    <div class="online-circle"></div>
                    <div class="label">{{data.fullname.length ? data.fullname : 'Неизвестный пользователь'}}</div>
                </div>
                <div class="row">
                    <div class="label">{{data.phone}}</div>
                </div>
            </div>
            <div class="content">
                <div class="messages" ref="messages">
                    <template v-if="loading">
                        <div class="message loadingmessage" v-for="i in 5" :key="i"></div>
                    </template>
                    <div :class="{'message': true, 'mymessage': !i.sender==0}" v-for="(i, ind) in messages" :key="ind">
                        <img class="avatar" v-if="showAv(ind)" :src="i.sender==1 ? 'https://uc.chatra-usercontent.com/c4da9581-aa0e-4167-8ad3-7c5062e676dc/-/resize/200x200/' : 'https://cdn.pixabay.com/photo/2017/07/18/23/23/user-2517433_1280.png'"/>
                        <div class="whitespace" v-else></div>
                        <div class="body">
                            <div class="text">{{i.message}}</div>
                            <div class="date">{{moment(i.createdAt).fromNow()}}</div>
                        </div>
                        <div class="read" v-if="showBottom(ind)">{{i.readAt ? 'Прочитано '+moment(i.readAt).fromNow(): 'Не прочитано'}}</div>
                    </div>
                    <div class="typing" :style="{opacity: typing ? 1 : 0}"><i class="fi-sr-pencil"></i>Клиент набирает сообщение...</div>
                </div>
            </div>
            <div class="footer" :style="{opacity: sending ? '0.4' : '1'}">
                <textarea type="text" placeholder="Введите сообщение..." v-model="input" @keydown.enter.prevent="sendMessage()" @input="startTyping"></textarea>
                <div class="tools">
                    <i class="fi-sr-paper-plane" @click="sendMessage()"></i>
                </div>
            </div>
        </div>
        <div class="spaceloading" v-else></div>
        <div class="cheat-list" v-if="ready">
            <div class="ready-answer" v-for="(i, ind) in templatechats" :key="ind" :style="{opacity: sending ? '0.4' : '1'}" v-html="i.replace(/(\r\n|\r|\n)/g, '<br>')" @click="sendMessage(i);"></div>
        </div>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core';
import templatechats from '../assets/scripts/templatechats.js';
import moment from 'moment';
export default {
    data() {
        return {
            ready: false,
            id: this.$route.params.id,
            changeMode: Function,
            socket: Function,
            input: '',
            data: {},
            global: {},
            messages: [],
            my_session: '',
            loading: true,
            templatechats: [],
            sending: false,
            moment,
            lastTypedTime: '',
            typing: false,
            stopTyping: null
        }
    },
    mounted() {
        this.changeMode = inject('changeMode');
        this.socket = inject('socket');
        this.global = inject('global');
        this.init();
    },
    beforeUnmount() {
        this.socket.removeEventListener('message', this.socketOnMessage);
    },
    methods: {
        async init() {
            let response = await this.socket.emit('initChat', {id: this.id});
            console.log('initChat', response)
            this.data = response.response.chat;
            this.messages = response.response.messages;
            this.socket.addEventListener('message', this.socketOnMessage);
            this.loading = false;

            this.templatechats = templatechats(this.global.account.fullname ? this.global.account.fullname : this.global.account.login, this.data?.fullname);

            this.ready = true;
            this.$nextTick(() => {
                this.$refs.messages.scrollTo({top: this.$refs.messages.scrollHeight});
            });

            this.socket.emit('chatRead', {conv_id: this.data.id});
        },
        socketOnMessage(json) {
            let response = JSON.parse(json.data);
            switch(response.query) {
                case 'newMessage': {
                    console.log(response.newOrder.conv_id, this.data.id);
                    if (response.newOrder.conv_id != this.data.id) return;
                    this.messages.push(response.newOrder);

                    this.$nextTick(() => {
                        this.$refs.messages.scrollTo({top: this.$refs.messages.scrollHeight, behavior: 'smooth'});
                    });

                    this.socket.emit('chatRead', {conv_id: this.data.id});
                } break;
                case 'readMessages': {
                    response.readMessages.forEach(e => {
                        let ind = this.messages.findIndex(j => j.id == e);
                        if (ind == -1) return;
                        this.messages[ind].readAt = moment().format("YYYY-MM-DD HH:mm:ss");
                    });
                } break;
                case 'chatTyping': {
                    console.log(response, this.data);
                    if (response.conv_id != this.data.id) return;
                    this.stopTyping ?? clearTimeout(this.stopTyping);
                    this.typing = true;
                    this.$refs.messages.scrollTo({top: this.$refs.messages.scrollHeight, behavior: 'smooth'});
                    this.stopTyping = setTimeout(() => {
                        this.typing = false;
                    }, 2000);
                } break;
            }
        },
        async sendMessage(input) {
            if (this.sending) return;
            if (!input) {
                input = this.input+'';
            }
            if (input.length < 1) return;
            this.sending = true;
            await this.socket.emit('newMessage', {conv_id: this.id, message: input});
            this.sending = false;
            this.input = '';
        },
        startTyping() {
            let thisMoment = Date.now();
            console.log(this.lastTypedTime-thisMoment);
            if (this.lastTypedTime == '' || thisMoment-this.lastTypedTime > 2500) {
                this.lastTypedTime = Date.now();
                this.socket.emit('chatTyping', {conv_id: this.id});
            }
        },
        showAv(ind) {
            let the = this.messages[ind],
                prev = this.messages[ind-1];
            if (!the || !prev) return true;
            if (the.sender == 1) {
                return prev.sender != 1;
            }
            else {
                return prev.sender != 0;
            }
        },
        showBottom(ind) {
            let the = this.messages[ind],
                prev = this.messages[ind+1];
            if (!the || !prev) return true;
            if (the.sender == 1) {
                return prev.sender != 1;
            }
            else {
                return prev.sender != 0;
            }
        }
    }
}
</script>


<style scoped>
    .rauza-chat {
        width: 100%;
        height: calc(100% - 30px);
        display: flex;
        justify-content: center;
    }
    .online-circle {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #f1f3f5
    }
    .label {
        margin-left: 10px;
        font-weight: bold;
        letter-spacing: 1px;
    }
    .main-bar {
        width: 100%;
        min-width: 300px;
        max-width: 500px;
        height: calc(100% - 10px);
        display: flex;
        flex-direction: column;
    }
    .cheat-list {
        width: 100%;
        min-width: 300px;
        max-width: 500px;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 0 10px;
        box-sizing: border-box;
        overflow-y: scroll;
    }
    .cheat-list .ready-answer {
        padding: 15px;
        background-color: #fff;
        border-radius: 20px;
        cursor: pointer;
        transition: 0.1s all;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 10px;
    }
    .cheat-list .ready-answer:hover {
        background-color: #f3f3f3;
    }
    .main-bar .header {
        width: 100%;
        height: 55px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        padding-left: 20px;
        box-sizing: border-box;
        border-radius: 20px;
        color: #444;
    }
    .header .row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }
    .header .fi-sr-cross {
        margin-right: 10px;
        color: #aeafb1;
    }
    .main-bar .content {
        width: 100%;
        height: calc(100% - 55px - 60px);
    }
    .main-bar .footer {
        width: 100%;
        height: 100px;
        box-shadow: 0 0 10px 0px rgba(0, 0, 0, 0.2);
        padding: 5px 0px 5px 20px;
        display: flex;
        box-sizing: border-box;
        background: #fff;
    }
    .footer .tools {
        width: max-content;
        padding: 0 20px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }
    .tools i {
        width: 20px;
        height: 20px;
        font-size: 1.2rem;
        color: rgb(196, 196, 196);
    }
    .main-bar .footer textarea {
        width: 100%;
        height: 100%;
        border: none;
        outline: none;
        font-size: 1rem;
        box-sizing: border-box;
        font-family: Avenir, Helvetica, Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		color: #2c3e50;

        overflow-y: scroll;
        vertical-align: middle;
        resize: none;
        max-height: 134px;
        line-height: 1.5;
        padding: 12.5px 0px;
    }
    .main-bar .header .label {
        font-weight: 400;
    }
    .messages {
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        padding: 10px 0;
        box-sizing: border-box;
        overflow-x: hidden;
    }
    .messages .message {
        width: 100%;
        height: max-content;
        display: flex;
        padding-left: 10px;
        flex-wrap: wrap;
        box-sizing: border-box;
        margin-bottom: 5px;
    }
    .message.mymessage {
        justify-content: flex-start;
        flex-direction: row-reverse;
    }
    .message.mymessage .body {
        margin-right: 5px;
    }
    .message .whitespace {
        width: 30px;
        height: 30px;
        margin-top: 5px;
        margin-right: 5px;
    }
    .message.mymessage .read {
        text-align: right;
        display: block;
        margin-right: 5px;
    }
    .message .read {
        width: 100%;
        font-size: 12px;
        color: #7A7A7A;
        user-select: none;
        display: none;
        margin-top: 5px;
    }
    .message.loadingmessage {
        height: 40px;
        width: 100%;
        background-color: #ffffff;
        border-radius: 10px;
        background: linear-gradient(270deg, #cccccc, #e9e9e9, #cccccc);
        background-size: 400% 400%;

        animation: flicker-loading 2s infinite !important;
    }
    .message .avatar {
        width: 30px;
        height: 30px;
        object-fit: cover;
        border-radius: 50%;
        margin-top: 5px;
        margin-right: 5px;
    }
    .message .body {
        width: max-content;
        max-width: calc(100% - 40px);
        min-height: 40px;
        background-color: #ffffff;
        border-radius: 10px;
        padding: 0 15px;
        box-sizing: border-box;
        padding-bottom: 10px;
    }
    .message .body .text {
        margin-top: 10px;
        white-space: pre-wrap;
    }
    .message .body .date {
        width: 100%;
        color: #b1b1b1;
        font-size: 0.7rem;
        text-align: right;
    }
    .fi-sr-paper-plane {
        cursor: pointer;
    }
    .fi-sr-paper-plane:hover {
        color: rgb(165, 165, 165);
    }
    .typing {
        display: flex;
        align-items: center;
        font-size: 15px;
        justify-content: center;
        margin-top: 10px;
        color: #838383;
        animation: typing infinite 1s;
        width: max-content;
        margin-left: auto;
        margin-right: auto;
        transition: 0.4s opacity;
    }
    .typing i {
        display: flex;
        align-items: center;
        margin-right: 10px;
    }
    @keyframes typing {
        0% {
            transform: translateX(-1%);
        }
        50% {
            transform: translateX(1%);
        }
        100% {
            transform: translateX(-1%);
        }
    }
    ::placeholder {
        color: #b1b1b1;
        letter-spacing: 1px;
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
    .fi-sr-angle-left {
        color: white;
        
        padding: 10px;
        font-size: 1.1rem;
        border-radius: 10px;
        margin-right: 10px;
    }
    .fi-sr-angle-left:hover {
        color: black;
        background-color: white;
    }
    @media screen and (max-width: 768px){
        .rauza-chat {
            height: calc(100% - 50px);
            display: block;
            overflow-y: scroll;
        }
        .main-bar {
            height: 100%;
            position: relative;
            left: 50%;
            transform: translate(-50%);
        }
        .cheat-list {
            height: max-content;
            position: relative;
            left: 50%;
            transform: translate(-50%);
        }
    }
</style>