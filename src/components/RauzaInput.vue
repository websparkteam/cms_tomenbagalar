<template>
    <div class="group" :style="{marginTop, width}">
        <input type="text" :value="modelValue" @input="update" required @keydown.enter="$emit('enter')">
        <span class="bar"></span>
        <label>{{title}}</label>
    </div>
</template>

<script>
export default {
    props: {
        modelValue: String,
        title: String,
        marginTop: String,
        width: String
    },
    methods: {
        update(e) {
            this.$emit('update:modelValue', e.target.value);
        }
    },
}
</script>

<style scoped>
    .group {
        position: relative;
        margin-top: 5px;
        width: 100%;
        padding-top: 10px;
    }
    input {
        font-size: 16px;
        padding: 10px;
        display: block;
        width: 100%;
        border: none;
        border-bottom: 1px solid #ccc;
        box-sizing: border-box;
    }
    input:focus {
        outline: none;
    }
    label {
        color: #999;
        font-size: 18px;
        position: absolute;
        pointer-events: none;
        left: 10px;
        bottom: 10px;
        transition: 0.2s ease all;
        -moz-transition: 0.2s ease all;
        -webkit-transition: 0.2s ease all;
    }

    /* active state */
    input:focus ~ label, input:valid ~ label {
        bottom: 32px;
        font-size: 14px;
        color: #5264AE;
    }
    /* BOTTOM BARS ================================= */
    .bar {
        position: relative;
        display: block;
        width: 100%;
    }
    .bar:before, .bar:after {
        content: "";
        height: 2px;
        width: 0;
        bottom: 0;
        position: absolute;
        background: #5264AE;
        transition: 0.2s ease all;
        -moz-transition: 0.2s ease all;
        -webkit-transition: 0.2s ease all;
    }
    .bar:before {
        left: 50%;
    }
    .bar:after {
        right: 50%;
    }

    /* active state */
    input:focus ~ .bar:before,
    input:focus ~ .bar:after {
        width: 50%;
    }
</style>