<template>
    <div class="technical-works">
        <img src="../assets/images/no-image.jpg" class="back">
        <img src="../assets/icons/works.svg"/>
        <div class="tlabel">Сейчас на сайте выполняются технические работы.</div>
        <div class="minilabel">Вы не должны были это заметить.<br>Обычно это занимает несколько секунд...<br>Перезагрузите страницу позже.</div>
    </div>
</template>

<style scoped>
    /* Technical */
    .technical-works {
        width: 100vw;
        height: 100vh;
        z-index: 999999999;
        position: fixed;
        background-color: rgba(0, 0, 0, .9);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        user-select: none;
        top: 0;
        left: 0;
    }
    .technical-works img {
        width: 100px;
        height: 100px;
    }
    .technical-works .tlabel, .technical-works .minilabel{
        font-weight: bold;
        font-size: 2rem;
        text-align: center;
        margin-top: 10px;
        width: 70%;
    }
    .technical-works .minilabel {
        font-size: 1.5rem;
        font-weight: 200;
        margin-top: 10px;
    }
    .technical-works .back {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: -1;
        width: 30vw;
        height: 30vw;
        opacity: 0.1;
    }
/* Technical */
</style>