<template>
    <div class="rauza-auth">
        <div class="panel">
            <template v-if="mode=='login'">
            <el-form :model="inputs" label-width="120px" label-position="top" status-icon :rules="signRules" ref="authRef">
                <h2>Авторизация</h2>
                <el-form-item label="Ваш логин" prop="login">
                    <el-input v-model="inputs.login"/>
                </el-form-item>
                <el-form-item label="Ваш пароль" prop="password">
                    <el-input v-model="inputs.password" @keydown.enter="auth(false)"/>
                </el-form-item>
                <el-button type="primary" @click="auth(false)" :loading="loading">Войти</el-button>
                <el-button @click="mode='signup'">Регистрация</el-button>
            </el-form>
                <!-- <h2>Авторизация</h2>
                <RauzaInput title="Ваш логин" v-model="inputs.login"/>
                <RauzaInput title="Ваш пароль" v-model="inputs.password" @enter="auth(false)"/>
                <RauzaButton  width="100%" height="49px" text="Войти" background="rgba(166, 57, 254, 0.1)" color="rgb(166, 57, 254)" marginTop="20px" padding="15px 20px"/>
                <div class="errors">
                    <div class="unit" v-for="(i, ind) in errors" :key="ind">{{i}}</div>
                </div>
                <h4>У вас еще нет аккаунта? <span >Зарегистрируйтесь</span></h4> -->
            </template>
            <template v-else>
                <h2>Регистрация</h2>
                <RauzaInput title="Придумайте логин" v-model="inputs.login"/>
                <RauzaInput title="Придумайте пароль" v-model="inputs.password" @enter="signup"/>
                <RauzaButton @click="signup" :loading="loading" width="100%" height="49px" text="Зарегистрироваться" background="rgba(166, 57, 254, 0.1)" color="rgb(166, 57, 254)" marginTop="20px" padding="15px 20px"/>
                <div class="errors">
                    <div class="unit" v-for="(i, ind) in errors" :key="ind">{{i}}</div>
                </div>
                <h4>У вас уже есть аккаунт? <span @click="mode='login'">Войдите</span></h4>
            </template>
        </div>
    </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { inject } from '@vue/runtime-core'
import RauzaInput from './RauzaInput'
import RauzaButton from './RauzaButton'
export default {
    components: {
        RauzaInput,
        RauzaButton
    },
    data() {
        return {
            mode: 'login',
            inputs: {
                login: '',
                password: ''
            },
            errors: [],
            serverQuery: Function,
            global: {},
            loading: false,
            signRules: {
                login: [
                    { required: true, message: 'Логин является обязательным полем', trigger: 'blur' },
                    { min: 2, max: 128, message: 'Длина логина от 2-х до 128 символов', trigger: 'blur' },
                ],
                password: [
                    { required: true, message: 'Пожалуйста, введите пароль', trigger: 'blur' },
                    { min: 2, max: 128, message: 'Длина пароля от 2-х до 128 символов', trigger: 'blur' },
                ],
            }
        }
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.global = inject('global');
        this.auth(true);
    },
    methods: {
        async auth(auto) {
            if (!this.$refs.authRef) return;
            await this.$refs.authRef.validate(async (valid) => {
                if (!valid && !auto) {
                    return;
                }
                let data = {login: this.inputs.login, password: this.inputs.password};
                if (auto) {
                    let json = localStorage.getItem('rauzaadmin');
                    if (json == 'null' || json == null) return;
                    json = JSON.parse(json);
                    data = {login: json.login, password: json.password};
                }
                this.loading = true;
                let response = await this.serverQuery('admin', 'loginMember', data);
                this.loading = false;
                console.log(response);
                let loading = document.querySelector('.cms-loading');
                if (loading) loading.remove();

                this.$parent.ready = true;
                if (response.status) {
                    let user = response.data.message;
                    user.role = parseInt(user.role);
                    // this.$parent.global.account = user;
                    this.global.account = user;
                    localStorage.setItem('rauzaadmin', JSON.stringify(data));
                    ElMessage({
                        showClose: true,
                        message: 'Успешная авторизация.',
                        type: 'success',
                    });
                }
                else {
                    if (!auto) {
                        ElMessage({
                            showClose: true,
                            message: response.data.message,
                            type: 'error',
                        });
                    }
                }
            });
        },
        async signup() {
            let data = {login: this.inputs.login, password: this.inputs.password};
            this.loading = true;
            let response = await this.serverQuery('admin', 'newMember', data);
            this.loading = false;
            console.log(response);
            if (response.status) {
                this.auth(false);
            }
            else {
                this.errors = [response.data.message];
            }
        }
    },
    watch: {
        mode() {
            this.errors.splice(0, this.errors.length);
            this.inputs.password = '';
        }
    }
}
</script>

<style scoped>
    .rauza-auth {
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        background-color: var(--el-bg-color);
        z-index: 99;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: center;
    }
    .panel {
        width: 400px;
        height: max-content;
        box-shadow: var(--el-box-shadow);
        padding: 20px;
        box-sizing: border-box;
        background-color: var(--el-bg-color-overlay);
    }
    h4 {
        font-weight: 300;
        text-align: center;
        margin-top: 20px;
    }
    h4 span{
        font-weight: 600;
        cursor: pointer;
    }
    h4 span:hover {
        color: rgb(166, 57, 254);
    }
    .errors {
        display: flex;
        flex-direction: column;
        margin-top: 10px;
    }
    .errors .unit {
        color: rgb(209, 0, 0);
        margin-bottom: 10px;
    }
</style>