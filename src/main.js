import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Maska from 'maska'

import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

let app = createApp(App);
app.use(router);
app.use(Toast, {
    containerClassName: "my-container-class",
    transition: "Vue-Toastification__fade",
    newestOnTop: true
});

app.use(Maska);

app.use(ElementPlus)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.mount('#app');