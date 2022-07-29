<template>
    <div class="announce" v-if="ready && announce.length > 0"></div>
</template>

<script>
import { inject } from "vue";
import { useToast } from "vue-toastification";
export default {
    data() {
        return {
            ready: false,
            announce: []
        }
    },
    watch: {
        announceUpdate(newVal) {
            let newAn = this.announce[newVal-1];
            switch(newAn.type) {
                case 'E': this.toast(newAn.message, {timeout: 4000, bodyClassName: ['uadeeError'], toastClassName: "announcement", hideProgressBar: true}); break;
                case 'S': this.toast(newAn.message, {timeout: 2500, bodyClassName: ['uadeeSuccess'], toastClassName: "announcement", hideProgressBar: true}); break;
                case 'I': this.toast(newAn.message, {timeout: 4000, bodyClassName: ['uadeeInfo'], toastClassName: "announcement", hideProgressBar: true}); break;
                default: this.toast(newAn.message, this.options); break;
            }
        }
    },
    computed: {
        announceUpdate() {
            return this.announce.length;
        }
    },
    setup() {
        const toast = useToast(),
            options = {
                bodyClassName: ['uadeeInfo'],
                toastClassName: "announcement",
                hideProgressBar: true
            };

        return { toast, options }
    },
    mounted() {
        this.announce = inject('announce');

        this.ready = true;
    },
    methods: {
        annIcon(type) {
            switch(type) {
                case 'E': return require('../assets/icons/warning.svg');
                case 'S': return require('../assets/icons/ok.svg');
                case 'I': return require('../assets/icons/information.svg');
                default: return require('../assets/icons/warning.svg');
            }
        },
        annColor(type) {
            switch(type) {
                case 'E': return 'rgb(214, 0, 0)'
                case 'S': return 'var(--black)'
                case 'I': return 'var(--black)'
                default: return 'var(--black)';
            }
        }
    }
}
</script>

<style scoped>
    .announce {
        position: absolute;
        top: 60px;
        right: 0;
        width: 300px;
        height: max-content;
        z-index: 1000001;
        overflow: hidden;
        display: flex;
        flex-wrap: wrap-reverse;
    }
    .error-unit {
        min-height: 50px;
        height: max-content;
        background-color: #FFF;
        box-sizing: border-box;
        width: calc(100% - 20px);
        border-radius: 10px;
        margin-bottom: 10px;
        margin-right: 30px;
        float: left;
        cursor: pointer;
    }
    .error-icon {
        width: 30px;
        height: 30px;
        background-size: cover;
        background-position: center;
        float: left;
        margin-left: 10px;
        margin-top: 25px;
        transform: translate(0, -50%);
    }
    .error-lab {
        font-size: 1.3rem;
        color: var(--black);
        width: calc(100% - 80px);
        margin-left: 10px;
        height: max-content;
        float: left;
        margin-top: 13px;
        padding-bottom: 10px;
    }
</style>

<style>
    .Vue-Toastification__toast {
        border-radius: 8px !important;
        font-weight: normal;
        cursor: pointer;
        z-index: 9999;
    }
    .Vue-Toastification__toast--default.announcement {
        background-color: #FFF;
        padding: 10px;
        max-width: 100px;
        min-height: 0px;
        
    }
    .Vue-Toastification__toast-body.uadeeError {
        font-size: 1.3rem;
        font-weight: normal;
        color: rgb(214, 0, 0);
        height: max-content;
        margin-top: 3px;
    }
    .Vue-Toastification__toast-body.uadeeInfo {
        font-size: 1.3rem;
        font-weight: normal;
        color: #1d1c1a;
        height: max-content;
        margin-top: 3px;
    }
    .Vue-Toastification__toast-body.uadeeSuccess {
        font-size: 1.3rem;
        font-weight: normal;
        color: #1d1c1a;
        height: max-content;
        margin-top: 3px;
    }
    .Vue-Toastification__container.top-right.my-container-class{
        top: 50px;
        z-index: 1000000;
    }
    .Vue-Toastification__icon, .Vue-Toastification__close-button{
        filter: invert();
        opacity: 0.9;
    }
    @media screen and (max-width: 1175px) {
        .Vue-Toastification__toast--default.announcement {
            left: 40px;
        }
    }
</style>