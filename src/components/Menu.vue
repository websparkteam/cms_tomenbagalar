<template>
    <el-menu
        class="el-menu-vertical-demo"
        :collapse="isCollapse"
        default-active="/"
        router
    >
        <div class="top-part">
            <div class="mp-top">
                <img class="mp-logo" src="../assets/images/logo.png"/>
                <div class="mp-elem">
                    <span class="title">Аптека Низких Цен</span>
                    <span class="sub-title">Админ</span>
                </div>
            </div>
            <el-menu-item v-for="(i, ind) in items" :key="ind" :index="i.view">
                <el-icon><component :is="i.icon"></component></el-icon>
                <template #title>{{i.name}}</template>
            </el-menu-item>
        </div>
        <div class="bottom-part">
            <el-switch
                v-model="darkmode"
                class="mb-2"
                active-text="Night"
                inactive-text="Day"
                @change="toggleDarkmode"
            />
            <el-button class="logout" @click="logout" text :icon="SwitchButton">Выйти</el-button>
        </div>
    </el-menu>
    <!-- <div class="menu-panel" v-if="ready">
        <div class="mp-content">
            <div class="mp-top">
                <img class="mp-logo" src="../assets/images/icon.svg"/>
                <div class="mp-elem">
                    <span class="title">Tomenbagalar</span>
                    <span class="sub-title">Админ</span>
                </div>
            </div>
            <div class="mp-links">
                <div class="top-links">
                    <div :class="{'link': true, 'active': global.mode==i.view}" v-for="(i, ind) in items" :key="ind" :title="i.name" @click="changeMode(i.view); global.order_id = null;">
                        <div class="icon-wrap"><i :class="i.icon"></i></div>
                        <div class="label">{{i.name}}</div>
                    </div>
                </div>
                <div class="bottom-links">
                    <div class="version">© 2022 Tomenbagalar-CMS Lite Beta v1.2</div>
                    <div class="link" title="Logout" @click="logout">
                        <div class="icon-wrap"><i class="fi fi-rs-power"></i></div>
                        <div class="label" style="font-weight: normal;">Выйти</div>
                    </div>
                </div>
            </div>
        </div>
    </div> -->
</template>

<script>
import { inject } from '@vue/runtime-core'
import { useDark, useToggle } from '@vueuse/core'
import {
  SwitchButton
} from '@element-plus/icons-vue'
export default {
    data() {
        return {
            SwitchButton,
            ready: false,
            changeMode: Function,
            global: {},
            items: [
                {
                    name: 'Все заказы',
                    view: '/',
                    icon: 'Menu'
                },
                // {
                //     name: 'Сообщения',
                //     view: 'Messages',
                //     icon: 'Menu'
                // },
                // {
                //     name: 'Товарооборот',
                //     view: 'Circulation',
                //     icon: 'Menu'
                // },
                {
                    name: 'База данных',
                    view: '/stock',
                    icon: 'FolderOpened'
                },
                {
                    name: 'Сотрудники',
                    view: '/members',
                    icon: 'UserFilled'
                },
                {
                    name: 'База клиентов',
                    view: '/clients',
                    icon: 'Management'
                },
                {
                    name: 'Управление',
                    view: '/management',
                    icon: 'Setting',
                    children: [
                        {
                            name: 'Баннеры',
                            view: '/management',
                            icon: 'Setting',
                        }
                    ]
                }
            ],
            darkmode: true
        }
    },
    mounted() {
        this.changeMode = inject('changeMode');
        this.global = inject('global');
        this.ready = true;

        
        /* ROLES
        0 -> гость
        1 -> курьер
        2 -> сборщик
        3 -> оператор
        4 -> директор

        5 -> крыса
    */
    },
    methods: {
        logout() {
            delete this.global.account.login;
            localStorage.removeItem('rauzaadmin');
            this.changeMode('Home');
            document.location.reload();
        },
        toggleDarkmode() {
            const isDark = useDark()
            const toggleDark = useToggle(isDark);
            toggleDark(this.darkmode);
        }
    }
}
</script>

<style scoped>
    * {
        --transp: rgb(231, 221, 255);
    }
    .el-menu-vertical-demo {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .logout {
        width: 100%;
        justify-content: flex-start;
    }
    .menu-panel {
        width: 190px;
        height: 100%;
        display: flex;
        background-color: #0b2239;
        box-sizing: border-box;
        overflow: hidden;
        color: #fff;
    }
    .mp-content {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .mp-top{
        width: 100%;
        height: 60px;
        box-sizing: border-box;
        display: flex;
        gap: 10px;
        align-items: center;
        padding-top: 10px;
        padding-bottom: 10px;
    }
    .mp-top .mp-logo{
        height: 40px;
        margin-left: 20px;
    }
    .mp-top .mp-elem{
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .mp-top .title{
        font-weight: 700;
        font-size: 12px;
    }
    .mp-top .sub-title{
        font-size: 13px;;
        color: var(--main-color);
    }
    .mp-links {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: space-between;
        flex-direction: column;
    }
    .mp-links .link {
        width: 100%;
        height: 55px;
        
        display: flex;
        flex-direction: row;
        align-items: center;

        cursor: pointer;
        padding: 10px 20px;
        box-sizing: border-box;
        transition: 0.2s all;
        border-left: 2px solid transparent;
        color: #869fb2;
    }
    .mp-links .link:hover{
        background-color: #061a2e;
    }
    .mp-links .link:hover i{
        color: var(--main-color);
    }
    .mp-links .link.active {
        color: #fff;
        border-left: 2px solid var(--main-color);
        background-color: #061a2e;
    }
    .mp-links .link.active i{
        color: var(--main-color);
    }
    .mp-links .link .label {
        font-weight: bold;
        padding-left: 20px;
    }
    .mp-links .version{
        width: 100%;
        padding: 10px 20px;
        box-sizing: border-box;
        color: #fff;
        font-size: 14px;
    }
    .fi-kaspi {
        width: 1rem;
        height: 1rem;
        mask-image: url('../assets/icons/kaspi-icon.svg');
        background-color: #869fb2;
    }
    .mp-links .link.active .fi-kaspi{
        background-color: var(--main-color);
    }
    .mp-links .link:hover .fi-kaspi{
        background-color: var(--main-color);
    }
    @media screen and (max-width: 768px){
        .menu-panel {
            width: 100%;
            height: 50px;
            position: fixed;
            top: 0;
            z-index: 20;
        }
        .mp-content {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0;
        }
        .mp-top{display: none;}
        .mp-links .version{display: none;}

        .mp-links {
            flex-direction: row;
            justify-content: space-between;
            margin: 0;
            width: max-content;
            height: max-content;
        }
        .mp-links .top-links {
            display: flex;
            height: max-content;
        }
        .mp-links .link {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: max-content;
            padding: 10px 20px;
            text-align: center;
        }
        .mp-links .link .label {
            display: none;
        }
    }
    .bottom-part {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
</style>