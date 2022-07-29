<template>
    <div class="rauza-header">
        <div class="item-row">
            <div class="rauza-back" :style="{display: mode=='' ? 'none' : 'flex'}" @click="mode=''">
                <i class="fi fi-rs-arrow-small-left"></i>&nbsp;
                <span>Назад</span>
            </div>
            <h2>Управление</h2>
        </div>
        <h3>интернет-магазином</h3>
    </div>
    <div class="rauza-innercontent">
        <div class="overflow-y">
            <div class="item-row" v-if="loading">
                <div class="spaceloading"></div>
                <span>Загрузка данных...</span>
            </div>
            <div class="menu" v-if="mode==''">
                <div class="item" v-for="(i, ind) in items" :key="ind" @click="mode=i.name">
                    <i :class="i.icon"></i>
                    <span>{{i.name}}</span>
                </div>
            </div>
            <template v-if="!loading">
                <template v-if="mode=='Отзывы'">
                    <section id="reviews">
                        <div class="text">Всего голосов: {{polls_stats['3'] + polls_stats['2'] + polls_stats['1']}}</div>
                        <div class="counters">
                            <div class="item">
                                <i class="fi fi-rs-laugh"></i>
                                <span>В восторге - {{polls_stats['3']}}</span>
                            </div>
                            <div class="item">
                                <i class="fi fi-rs-smile"></i>
                                <span>Удовлетворены - {{polls_stats['2']}}</span>
                            </div>
                            <div class="item">
                                <i class="fi fi-rs-sad"></i>
                                <span>С жалобами - {{polls_stats['1']}}</span>
                            </div>
                        </div>
                        <div class="list">
                            <div class="line italic">
                                <div class="item">Оценка</div>
                                <div class="item">Отзыв</div>
                                <div class="item">Номер</div>
                                <div class="item">Дата</div>
                            </div>
                            <div class="scrollable" @scroll="listScroll" ref="list">
                                <div class="line" v-for="(i, ind) in polls" :key="ind">
                                    <div class="item"><i :class="getPollData(i.rate).icon" :style="{color: getPollData(i.rate).color}"></i></div>
                                    <div class="item" v-html="i.feedback ?? `<i>${getPollData(i.rate).label}</i>`"></div>
                                    <div class="item">{{i.poll_additional}}</div>
                                    <div class="item">{{moment(i.voted_at).fromNow()}}</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </template>
                <template v-if="mode=='Параметры'">
                    <RauzaInput title="Увеличить цены товаров из Info Apteka (в процентах)" marginTop="10px" v-model="config.priceaddition"/>
                    <RauzaButton @click="updateStockdata" flaticon="fi-sr-disk" :loading="saveLoading" width="100%" height="49px" text="Сохранить" background="rgba(166, 57, 254, 0.1)" color="rgb(166, 57, 254)" marginTop="20px" padding="15px 20px"/>
                </template>
                <template v-if="mode=='Отчеты'">
                    <div class="single-row">
                        <span>Построить отчет:</span>
                        с
                        <input type="date" placeholder="С" v-model="settings.reportFrom">
                        по
                        <input type="date" placeholder="ПО" v-model="settings.reportTo">
                        <button @click="reportUpdate">Показать</button>
                    </div>
                    <div class="rauza-table-wrap">
                        <div class="rauza-table-header">
                            <div class="title">Отчёт о завершенных заказах по операторам:</div>
                            <div class="excel-button" @click="reportDownloadExcel(1)"><i class="fi fi-rs-document-signed"></i>&nbsp; Скачать в Excel</div>
                        </div>
                        <table class="rauza-table">
                            <thead>
                                <tr>
                                    <td>Сотрудник</td>
                                    <td>Роль</td>
                                    <td>Завершено заказов</td>
                                    <td>На сумму</td>
                                    <td>Список заказов</td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="i, ind in operatorsList" :key="ind">
                                    <td>{{i.name}}</td>
                                    <td>{{i.role}}</td>
                                    <td>{{i.count}}</td>
                                    <td>{{i.revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</td>
                                    <td style="max-width: max-content;"><span class="clickableSpan" v-for="(j, jind) in i.orders" :key="jind" @click="openOrder(j)">{{j}}</span></td>
                                </tr>					
                            </tbody>
                        </table>
                    </div>
                    <div class="rauza-table-wrap">
                        <div class="rauza-table-header">
                            <div class="title">Отчёт о завершенных заказах по аптекам:</div>
                            <div class="excel-button" @click="reportDownloadExcel(2)"><i class="fi fi-rs-document-signed"></i>&nbsp; Скачать в Excel</div>
                        </div>
                        <table class="rauza-table">
                            <thead>
                                <tr>
                                    <td>Название аптеки</td>
                                    <td>Завершено заказов</td>
                                    <td>На сумму</td>
                                    <td>Список заказов</td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="i, ind in pharmaciesList" :key="ind">
                                    <td>{{i.name}}</td>
                                    <td>{{i.count}}</td>
                                    <td>{{i.revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</td>
                                    <td style="max-width: max-content;"><span class="clickableSpan" v-for="(j, jind) in i.orders" :key="jind" @click="openOrder(j)">{{j}}</span></td>
                                </tr>					
                            </tbody>
                        </table>
                    </div>

                    <!-- <h3 style="margin-top:40px;">Статистика интернет-магазина:</h3>
                    <div class="single-row">
                        <span>Показать отчеты по: </span>
                        <select v-model="settings.time" @change="chartInit()">
                            <option value="days">дням</option>
                            <option value="months">месяцам</option>
                        </select>
                    </div>
                    <div class="single-chart">
                        <canvas ref="chart"></canvas>
                    </div> -->
                </template>
                <template v-if="mode=='Баннеры'">
                    <Banners/>
                </template>
                <template v-if="mode=='Регуляторы'">
                    <RegulatorsList/>
                </template>
                <template v-if="mode=='Аптеки-конкуренты'">
                    <Parser/>
                </template>
            </template>
        </div>
    </div>
</template>

<script>
import RauzaInput from '../components/RauzaInput'
import RauzaButton from '../components/RauzaButton'
import RegulatorsList from '../components/RegulatorsList.vue'
import Banners from '../components/Banners.vue'
import Parser from '../components/Parser.vue'
import { inject } from '@vue/runtime-core'
// import Chart from 'chart.js/auto';
// import localization from 'moment/locale/ru'
import moment from 'moment';
import axios from 'axios'

export default {
    components: {
        RauzaInput,
        RauzaButton,
        RegulatorsList,
        Parser,
        Banners
    },
    data() {
        return {
            serverQuery: Function,
            mode: '',
            saveLoading: false,
            loading: false,
            announce: [],
            polls: [],
            items: [
                // {
                //     name: 'Аптеки-конкуренты',
                //     icon: 'fi-rs-shopping-bag',
                // },
                // {
                //     name: 'Регуляторы',
                //     icon: 'fi-rs-browser',
                // },
                {
                    name: 'Отчеты',
                    icon: 'fi-rs-chart-pie-alt'
                },
                // {
                //     name: 'Отзывы',
                //     icon: 'fi-rs-grin-alt',
                //     desc: 'Оценки от клиентов'
                // },
                {
                    name: 'Баннеры',
                    icon: 'fi-rs-layout-fluid',
                },
                // {
                //     name: 'Все категории',
                //     icon: 'fi-rs-book-alt'
                // },
                // {
                //     name: 'Параметры',
                //     icon: 'fi-rs-settings',
                //     desc: 'Конфигурация интернет-магазина'
                // }
            ],
            config: {
                priceaddition: ''
            },
            settings: {
                time: 'days',
                reportFrom: moment().format('YYYY-MM-DD'),
                reportTo: moment().format('YYYY-MM-DD'),
            },
            loadingOffset: false,
            polls_stats: {},
            moment,
            offset: 0,
            operatorsList: [],
            pharmaciesList: []
        }
    },
    mounted() {
        this.serverQuery = inject('serverQuery');
        this.announce = inject('announce');
    },
    watch: {
        mode(newval) {
            this.$nextTick(async () => {
                switch(newval) {
                    case 'Параметры': {
                        this.loading = true;
                        let response = await this.serverQuery('admin', 'getConfig'),
                            data = response.data.message;
                        for(let i in data) {
                            this.config[data[i].name] = data[i].value;
                        }
                        this.loading = false;
                        console.log(this.config)
                    } break;
                    case 'Отчеты': {
                        this.chartInit();
                        this.reportUpdate();
                    } break;
                    case 'Отзывы': {
                        this.polls.splice(0, this.polls.length);
                        this.polls_sync();
                        let response = await this.serverQuery('products', 'getPollsStats');
                        this.polls_stats = response.data.message;
                    } break;
                }
            });
        }
    },
    methods: {
        async reportUpdate() {
            console.log('reportUpdate', this.settings);

            let params = {
                'from': this.settings.reportFrom+' 00:00:00',
                'to': this.settings.reportTo+' 23:59:59'
            };
            let response = await axios('http://tomenbagalar.akukaz.beget.tech/api/generators/reports/operatorReport.php', {
                params
            });
            this.operatorsList = response.data;

            let pharmacyResponse = await axios('http://tomenbagalar.akukaz.beget.tech/api/generators/reports/pharmacyReport.php', {
                params
            });
            this.pharmaciesList = pharmacyResponse.data;
        },
        reportDownloadExcel(which) {
            let params = {
                'from': this.settings.reportFrom+' 00:00:00',
                'to': this.settings.reportTo+' 23:59:59'
            };
            if (which == 1) {
                window.open(`http://tomenbagalar.akukaz.beget.tech/api/generators/reports/operatorReport.php?excel&from=${params.from}&to=${params.to}`, '_blank').focus();
            }
            else {
                window.open(`http://tomenbagalar.akukaz.beget.tech/api/generators/reports/pharmacyReport.php?excel&from=${params.from}&to=${params.to}`, '_blank').focus();
            }
        },
        async updateStockdata() {
            this.announce.push({type: 'I', message: 'Внимание, начинается процесс переценообразования.'});
            this.saveLoading = true;
            let response = await this.serverQuery('admin', 'updateStockdata', {priceaddition: this.config.priceaddition});
            console.log(response);
            if (response.status) this.announce.push({type: 'S', message: 'Процесс переценообразования завершен.'});
            this.saveLoading = false;
        },
        async chartInit() {
            // if (!this.$refs.chart) return;
            // let response = await this.socket.emit('getOrdersStats', {time: this.settings.time});
            // console.log('response!', response);
            // if (!response.status) return;
            // let ctx = this.$refs.chart.getContext('2d');
            // Chart.defaults.plugins.legend.display = true;
            // if (!ctx) return;
            // let d = response.response,
            //     labels = [],
            //     data = [],
            //     completedOrders = [],
            //     format = '',
            //     label = '';
            // switch(this.settings.time) {
            //     case 'days': format = 'DD.MM.YYYY'; label = 'Прибыль за день ₸'; break;
            //     case 'months': format = 'MMMM YYYY'; label = 'Прибыль за месяц ₸'; break;
            // }
            // for(let i in d) {
            //     let day = d[i];
            //     labels.unshift(moment(day.name).locale("ru", localization).format(format));
            //     data.unshift(day.profit);
            //     completedOrders.unshift(day.count);
            // }
            // if (this.pie) {
            //     this.pie.destroy();
            // }
            // this.pie = new Chart(ctx, {
            //     type: 'scatter',
            //     data: {
            //         labels,
            //         datasets: [
            //             {
            //                 type: 'bar',
            //                 label,
            //                 data,
            //                 yAxisID: 'A',
            //                 backgroundColor: [
            //                     'rgba(255, 99, 132, 0.2)',
            //                 ],
            //                 tension: 0.4
            //             },
            //             {
            //                 type: 'bar',
            //                 label: 'Выполненных заказов',
            //                 data: completedOrders,
            //                 yAxisID: 'B',
            //                 backgroundColor: [
            //                     'rgba(75, 192, 192, 0.2)',
            //                 ],
            //                 tension: 0.4
            //             }
            //         ]
            //     },
            //     options: {
            //         responsive: true,
            //         maintainAspectRatio: false,
            //         scales: {
            //             yAxes: [
                            
            //             ]
            //         }
            //     },
            // });
        },
        listScroll(e) {
            let scrollBottom = e.target.scrollTop+e.target.offsetHeight;
            if(scrollBottom > (e.target.scrollHeight-10)) {
                this.lazyLoad();
            }
        },
        async polls_sync() {
            let response = await this.serverQuery('products', 'getAllPolls', {offset: this.offset}),
                data = response.data.message,
                polls = data['polls'],
                toAdd = [];
            for(let i in polls) {
                let ind = toAdd.findIndex(e=>e.ip == polls[i].ip);
                let rate, feedback;
                if (polls[i].poll_id == '1') {
                    rate = polls[i].poll_value;
                }
                else {
                    feedback = polls[i].poll_value;
                }
                if (ind == -1) {
                    toAdd.push({...polls[i], rate, feedback});
                }
                else {
                    rate ? toAdd[ind].rate = rate : false;
                    feedback ? toAdd[ind].feedback = feedback : false;
                }
            }
            toAdd.reverse();
            toAdd.forEach(e => this.polls.push(e));
        },
        async lazyLoad() {
            if (this.loadingOffset || this.maxOffset) return;
            this.loadingOffset = true;
            this.offset += 40;
            console.log('lazy load')
            await this.polls_sync();
            this.loadingOffset = false;
            console.log('Updated!')
        },
        openOrder(id) {
            window.open(document.location.origin+'?order='+id, 'Заказ', "height=800,width=500");
        },
        getPollData(poll) {
            switch(poll) {
                case '1': return {label: 'С жалобами', color: '#CE0000', icon: 'fi fi-rs-sad'};
                case '2': return {label: 'Удовлетворены', color: '#00c3ff', icon: 'fi fi-rs-smile'};
                case '3': return {label: 'В восторге', color: '#00CE5D', icon: 'fi fi-rs-laugh'};
                default: return {};
            }
        },
    }
}
</script>

<style scoped>
    .clickableSpan {
        color: rgb(77, 60, 226);
        margin-right: 5px;
        cursor: pointer;
    }
    .clickableSpan:hover {
        text-decoration: underline;
    }
    .overflow-y{        
        width: 100%;
        height: 100%;
        padding-bottom: 120px;
        overflow-y: scroll;
    }   
    h2 {
        font-weight: bold;
        letter-spacing: .1px;
    }
    .rauza-innercontent {
        height: 100%;
        margin-top: 15px;
        display: flex;
        flex-direction: column;
    }
    .menu {
        width: 100%;
        height: max-content;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
    }
    .menu .item {
        height: 50px;
        background-color: var(--el-color-info-light-7);
        display: flex;
        align-items: center;
        justify-content: flex-start;
        border-radius: 10px;
        cursor: pointer;
        transition: 0.1s all;
        padding: 20px;
        box-sizing: border-box;
    }
    .menu .item:hover {
        background-color: var(--el-color-info-light-5);
        color: #fff;
    }
    .item i {
        margin-right: 10px;
    }
    .item span {
        font-size: 1.2rem;
        font-weight: bold;
    }
    .item-row {
        width: 100%;
        align-items: center;
        display: flex;
        flex-direction: row;
    }
    .single-chart {
        width: 100%;
        height: 400px;
    }
    .single-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 10px 0;
    }
    .single-row span{font-size: 14px;}
    .single-row input{margin: 0;}
    .single-row button{
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 7px 14px;
        border: none;
        border-radius: 3px;
        background-color: var(--main-color);
        box-shadow: 0 5px 5px rgba(185, 185, 185, 0.1);
        outline: none;
        color: #fff;
        cursor: pointer;
    }
    
    section {
        padding: 25px 0;
        box-sizing: border-box;
    }
    #reviews {
        display: flex;
        flex-direction: column;
        gap: 15px;
        height: calc(100% - 200px);
    }
    .counters {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }
    .counters .item {
        width: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 12px;
        box-sizing: border-box;
        border-radius: 3px;
        background-color: #fff;
        border: 1px solid var(--border);
        text-align: center;
    }
    .counters .item span{font-size: 15px;}
    .counters .item i{font-size: 22px;}

    /* .counters .item:nth-child(1){border-left: 2px solid rgb(0, 206, 93);} */
    /* .counters .item:nth-child(2){border-left: 2px solid rgb(255, 196, 0);} */
    /* .counters .item:nth-child(3){border-left: 2px solid rgb(206, 0, 0);} */
    .counters .item:nth-child(1) i{color: rgb(0, 206, 93);}
    .counters .item:nth-child(2) i{color: #00c3ff;}
    .counters .item:nth-child(3) i{color: rgb(206, 0, 0);}
    .rauza-table-wrap {
        margin-bottom: 20px;
    }
    .rauza-table, .rauza-table-header {
        color: var(--el-text-color-regular) !important;
    }
    .list {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .list .scrollable {
        overflow-y: scroll;
        display: flex;
        flex-direction: column;
    }
    .list .line {
        display: grid;
        grid-template-columns: 70px repeat(3, 250px);
        background-color: #fff;
        border-bottom: 1px solid var(--border);
    }
    .italic{font-style: italic; font-size: 12px;}
    .list .line .item {
        padding: 7px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
    }
    i {
        display: flex;
        align-items: center;
    }
</style>