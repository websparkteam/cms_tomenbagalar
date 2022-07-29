<template>
    <div :class="{'search-material-input spacebutton': true, 'mobileadapted': mobileadapted}" :loading="loading" ref="parent" :title="text" :style="{width, height, minHeight: height, marginLeft, marginTop, padding, justifyContent: align, background, color, border, borderRadius}">
        <div id="image" v-if="preIcon" :style="{backgroundColor: color, maskImage: `url(${preIcon})`, width: imageSize, height: imageSize}"></div>
        <div class="spaceloading" v-if="loading"></div>
        <div class="spacetext" v-else><i v-if="flaticon" :class="flaticon"></i>{{text}}</div>
    </div>
</template>
<script>
export default {
    props: {
        width: String,
        height: String,
        text: String,
        padding: String,
        preIcon: String,
        marginLeft: String,
        marginTop: String,
        align: String,
        imageSize: String,
        loading: Boolean,
        mobileadapted: Boolean,
        border: String,
        borderRadius: String,
        flaticon: String,
        background: {
            type: String,
            default: 'transparent'
        },
        color: {
            type: String,
            default: '#000'
        }
    },
    mounted() {
        let parent = this.$refs.parent;
        parent.addEventListener('mousedown', (e) => {
            let el = parent.getBoundingClientRect();
            let lx = e.clientX - el.left,
                ly = e.clientY - el.top;
            let span = document.createElement('div');
            span.className = 'ripple';
            span.style.left = lx+'px';
            span.style.top = ly+'px';
            parent.appendChild(span);
            setTimeout(() => {
                span.remove();
            }, 1000);
        });
    }
}
</script>
<style scoped>
    .search-material-input {
        background-color: #0000;
        width: max-content;
        height: 22px;
        border-radius: 20px;
        padding: 0 15px 0 15px;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        transition: 0.2s background-color;
        cursor: pointer;
        justify-content: center;
    }
    .search-material-input:hover {
        background-color: #E5E5E5;
    }
    ::-webkit-input-placeholder {
        color: var(--text-black);
    }
    :-ms-input-placeholder {
        color: var(--text-black);
    }
    #image {
        width: 20px;
        height: 20px;
        mask-repeat: no-repeat;
        mask-position: center;
    }
    #image:first-child {
        margin-right: 10px;
    }
    .spacetext {
        font-weight: bold;
        display: flex;
    }
    .spacetext i {
        margin-right: 10px;
    }
    .spaceloading {
        width: 32px;
        height: 32px;
        mask-image: url(../assets/loading.svg);
        mask-size: cover;
        background-color: #fff;
    }
    .spacebutton[loading="true"] {
        cursor: not-allowed;
    }
    
    @media (max-width: 900px) {
        .spacebutton.mobileadapted .spacetext {
            display: none;
        }
        .spacebutton.mobileadapted #image {
            min-width: 20px;
            min-height: 20px;
            margin-right: 0;
        }
    }
</style>
<style>
    .spacebutton .ripple {
        position: absolute;
        background-color: rgb(214, 214, 214);
        transform: translate(-50%, -50%);
        pointer-events: none;
        border-radius: 50%;
        animation: animate .9s ease;
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
</style>