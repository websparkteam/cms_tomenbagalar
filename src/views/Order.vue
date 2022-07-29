<template>
<div class="order-window" ref="order-window">
    <div class="rauza-header">
        <div class="group">
            <div class="item-row">
                <el-button @click="global.order_id = null;" :icon="ArrowLeft">Назад</el-button>
                <h2 style="margin-left: 10px;">Сведения о заказе <span>#{{id}}</span></h2>
            </div>
        </div>
        <div class="buttons">
            <el-button :icon="ArrowDown" size="large" circle @click="scrollDown"/>
            <el-button :loading="loadingResetSync" @click="sync" :icon="Refresh" size="large" circle/>
        </div>
    </div>
    <div class="item-row" v-if="loading">
        <div class="cms-loading"></div>
    </div>
    <el-divider content-position="left" style="margin-top: 10px; margin-bottom: 10px;"><el-icon><Promotion /></el-icon>Комментарии</el-divider>
    <div class="order-data" ref="orderwindow" v-if="ready">
        <Catalog v-if="openCatalog" :myCatalog="myCatalog"/>
        <div id="comments">
            <div class="comments-wrap">
                <div class="comment" v-for="(i, ind) in otherReasons" :key="ind" :style="{borderLeftColor: getCommentTheme(orderOp.getRole(i.owner_role)).color}">
                    <span class="icon"><i :class="getCommentTheme(orderOp.getRole(i.owner_role)).icon"></i></span>
                    <div v-html="`<strong>${i.owner_login}</strong> (${orderOp.getRole(i.owner_role)}): ${i.text}`"></div>
                </div>
                <el-alert :title="`${i.owner_login} (${orderOp.getRole(i.owner_role)})`" :description="i.text" :closable="i.owner_id==global.account.id" @close="deleteComment(i)" style="color: var(--el-text-color-primary);" type="info" show-icon v-for="(i, ind) in data.comments" :key="ind"/>
                <!-- <div :class="{'comment': true, 'report': i.isReport}" v-for="(i, ind) in data.comments" :key="ind" :style="{borderLeftColor: getCommentTheme(orderOp.getRole(i.owner_role)).color}">
                    <span class="icon spaceloading" v-if="i.loading"></span>
                    <span class="icon" v-if="!i.loading"><i :class="i.isReport ? 'fi-rs-shield-exclamation' : 'fi fi-rs-user'"></i></span>
                    <div>
                        <strong>{{i.isReport ? 'Жалоба от ' : ''}}{{i.owner_login}}</strong>
                        ({{orderOp.getRole(i.owner_role)}}): {{i.text}}
                    </div>
                    <i class="fi-rs-trash delete" v-if="i.owner_id==global.account.id" @click="deleteComment(i)"></i>
                </div> -->
            </div>
            <el-input v-model="newComment.value" @keydown.enter.prevent="leaveComment" :placeholder="newComment.loading ? 'Отправка...' : 'Введите текст...'" style="margin-top: 7.5px;">
                <template #prepend>Добавить комментарий:</template>
                <template #append>
                    <el-button :icon="Promotion" />
                </template>
            </el-input>
            <!-- <div class="input">
                <div class="group">
                    <i :class="newComment.loading ? 'fi-rs-paper-plane' : 'fi-rs-comment'"></i>
                    <input type="text" :placeholder="newComment.loading ? 'Отправка...' : 'Добавить комментарии'" v-model="newComment.value" @keydown.enter.prevent="leaveComment">
                </div>
                
            </div> -->
        </div>
        <el-divider content-position="left" style="margin-top: 15px; margin-bottom: 20px;"><el-icon><Tickets /></el-icon>Детали заказа</el-divider>
        <el-row :gutter="12">
            <el-col :span="12">
                <el-card class="box" shadow="always">
                    <div class="item-row">
                        <OrderState :data="data"/>
                    </div>
                    <ul class="list">
                        <li style="color: var(--red);" v-if="data.state==-1">
                            <span class="name">Причина отказа</span>
                            <span class="value"><strong>{{cancelOrderReason.owner_login}} ({{orderOp.getRole(cancelOrderReason.owner_role)}}): {{cancelOrderReason.text}}</strong></span>
                        </li>
                        <li>
                            <span class="name">Тип заказа</span>
                            <span class="value">
                                <template v-if="data.type=='1'"><i class="fi-rs-box-alt"></i>&nbsp; Доставка</template>
                                <template v-else><i class="fi-rs-location-alt"></i>&nbsp; Самовынос</template>
                            </span>
                        </li>
                        <li>
                            <span class="name">Номер телефона</span>
                            <span class="value"><strong>{{mask(data.phone, '+7 (###) ### ##-##')}}</strong></span>
                        </li>
                        <li>
                            <span class="name">Имя и Фамилия</span>
                            <span class="value">{{data.fullname}} <template v-if="!isNaN(getAge(data.owner_birthday))">({{getAge(data.owner_birthday)}} лет)</template></span>
                        </li>
                        <li>
                            <span class="name">Время заказа</span>
                            <span class="value">{{moment(data.createdAt).format('DD/MM/YYYY, HH:mm')}}</span>
                        </li>
                        <li>
                            <span class="name">Корзина</span>
                            <span class="value" v-if="allPositionsLinked">{{data.cart.length}} {{(data.cart.length == 1) ? 'товар' : (data.cart.length >= 5 ? 'товаров': 'товара')}} на {{orderOp.getOrderTotalPrice(data.cart).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</span>
                        </li>
                        <template v-if="data.type=='1'">
                            <li>
                                <span class="name">Тип доставки</span>
                                <span class="value">{{deliveryType(data.delivery_type)}}</span>
                            </li>
                            <li>
                                <span class="name">Стоимость доставки</span>
                                <span class="value" v-if="allPositionsLinked">{{data.delivery_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</span>
                            </li>
                        </template>
                        <!-- <li v-if="deliveryList.length">
                            <span class="name">Состояние доставки</span>
                            <span class="value" v-if="allPositionsLinked">{{deliveryList[0].status == '1' ? 'Успешно отправлен' : deliveryList[0].error}}</span>
                        </li>
                        <li v-if="data.promo">
                            <span class="name">Промо-код</span>
                            <span class="value">{{data.promo.code}} [{{data.promo.sale.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸]</span>
                        </li> -->
                    </ul>
                </el-card>
            </el-col>
            <el-col :span="12">
                <el-card class="box" shadow="always">
                    <!-- IF DELIVERY -->
                    <div class="box location" v-if="data.type == '1'">  <!-- If delivery and for couriers or operators -->
                        <div class="section-title">2. Детали маршрута</div>

                        <div class="spaceloading" v-if="mapPathLoading"></div>

                        <div class="adress">
                            <el-form :model="form" label-width="120px" label-position="top">
                                <el-form-item label="Откуда:">
                                    <el-select placeholder="Выберите аптеку..." v-model="data.pharmacy" @change="startPointChanged" :disabled="!isOperator" style="width: 100%;">
                                        <el-option
                                        v-for="(i, ind) in funcs.pharmacies"
                                        :key="ind"
                                        :label="i.text"
                                        :value="i.value"
                                        />
                                    </el-select>
                                </el-form-item>
                                <el-form-item v-if="changePharmacy.changed" label="Причина смены аптеки:">
                                    <el-input placeholder="Причина смены..." v-model="changePharmacy.reason"/>
                                </el-form-item>
                                <el-form-item label="Куда:">
                                    <el-input v-model="data.address" disabled placeholder="Клиент не указал адрес" />
                                </el-form-item>
                            </el-form>
                        </div>

                        <div class="space-between" v-if="data.coords!=''">
                            <a class="open-in-2gis" target="_blank" rel="noopener noreferrer" :href="`https://2gis.kz/almaty/geo/${data.coords?.to?.longitude}%2C${data.coords?.to?.latitude}?m=${data.coords?.to?.longitude}%2C${data.coords?.to?.latitude}%2F12`">
                                <span>Открыть в</span>
                                <img src="../assets//images/2gis.svg">
                            </a>
                        </div>
                        
                        <ul class="list">
                            <li v-if="skippedAnyExtraInfo">
                                <span class="name">Клиент не указал никаких данных</span>
                            </li>
                            <li v-if="data.extra_info?.house">
                                <span class="name">Дом</span>
                                <span class="value">{{data.extra_info?.house}}</span>
                            </li>
                        <li v-if="data.extra_info?.apartment">
                                <span class="name">Квартира, Офис</span>
                                <span class="value">{{data.extra_info?.apartment}}</span>
                            </li>
                            <li v-if="data.extra_info?.intercom">
                                <span class="name">Домофон</span>
                                <span class="value">{{data.extra_info?.intercom}}</span>
                            </li>
                            <li v-if="data.extra_info?.entrance">
                                <span class="name">Подъезд</span>
                                <span class="value">{{data.extra_info?.entrance}}</span>
                            </li>
                            <li v-if="data.extra_info?.floor">
                                <span class="name">Этаж</span>
                                <span class="value">{{data.extra_info?.floor}}</span>
                            </li>
                            <li v-if="data.extra_info?.comment">
                                <span class="name">Комментарий к курьеру</span>
                                <span class="value">{{data.extra_info?.comment}}</span>
                            </li>
                        </ul>
                    </div>

                    <template v-if="data.type == '2'">
                        <div class="box location">
                            <div class="section-title">2. Пункт самовывоза:</div>
                            
                            <div class="group">
                                <span class="label">откуда:</span>
                                <select v-model="data.pharmacy" disabled>
                                    <option v-for="(i, ind) in funcs.pharmacies" :key="ind" :value="i.value">{{i.text}}</option>
                                </select>
                            </div>
                        </div>
                    </template>
                </el-card>
            </el-col>
        </el-row>
        <el-divider content-position="left" style="margin-top: 30px; margin-bottom: 10px;"><el-icon><ShoppingCart/></el-icon>Корзина</el-divider>
        <div class="page">
            <template v-if="isCourier">
                <RauzaButton v-if="data.state==2" @click="passOrder" :loading="loadingPassCourier" width="100%" height="49px" flaticon="fi-sr-rocket" text="Взяться за заказ" background="rgba(26, 206, 40, 0.17)" color="rgb(1,128,15)" padding="15px 20px"/>
                <RauzaButton v-if="data.state==3" @click="passOrder" :loading="loadingPassCourier" width="100%" height="49px" flaticon="fi-sr-check" text="Заказ доставлен" background="rgba(26, 206, 40, 0.17)" color="rgb(1,128,15)" marginTop="20px" padding="15px 20px"/>
                <RauzaButton v-if="data.state==3" @click="passOrder(-1)" :loading="loadingPassCourier" width="100%" height="49px" flaticon="fi-sr-angle-double-left" text="Возврат товара" background="rgba(251, 81, 81, 0.17)" color="rgb(251, 81, 81)" marginTop="20px" padding="15px 20px"/>
            </template>
            <!-- Для сборщиков и если доставка-->
            <!-- <template v-if="data.type == '1' && (isCollector)">
                <div class="item-section">
                    <div class="item-row"><span><strong>Пункт вывоза для доставки:</strong></span></div>
                    <div class="item-row">
                        <div class="circleletter" style="border-color: rgba(165, 57, 254, 1);">A</div>
                        <select v-model="data.pharmacy" disabled>
                            <option v-for="(i, ind) in funcs.pharmacies" :key="ind" :value="i.value">{{i.text}}</option>
                        </select>
                    </div>
                    <div class="item-row">
                        <div class="circleletter" style="border-color: var(--purple);">B</div>
                        {{data.address}}
                    </div>
                </div>
            </template> -->
            <!-- PICKUP -->
            <!-- <div class="item-row" style="padding-left: 20px; box-sizing: border-box;"><i class="fi-sr-shopping-cart" style="margin-right: 5px;"></i><h3>Корзина:</h3></div> -->
            <div class="box cart cart-section">
                <div class="item-row boxrow" style="flex-direction: column;">
                    <div class="header-item">
                        <div class="item-col">
                            <div class="row" :style="{minWidth: '30px', maxWidth: '30px'}">#</div>
                            <div class="row" :style="{minWidth: '50px', maxWidth: '50px'}"></div>
                            <div class="row" v-if="isCollector" :style="{minWidth: '30px', maxWidth: '30px'}"></div>
                            <div class="row" v-for="(i, ind) in cartList" :key="ind" :style="{minWidth: i.width, maxWidth: i.width}">{{i.name}}</div>
                            <div class="row" :style="{minWidth: '250px', maxWidth: '250px', marginLeft: '20px'}">Название товара</div>
                            <div class="row" :style="{width: '130px', marginLeft: '20px'}">Количество</div>
                            <!-- <div class="row" :style="{width: '174px'}" v-if="isOperator">Действия</div> -->
                            <!-- <div class="row" :style="{width: '200px'}" v-if="isOperator">Откуда</div> -->
                        </div>
                    </div>
                    <div class="item-select-list" v-if="itemSelect.active" :style="{left: itemSelect.coords.x+'px', top: itemSelect.coords.y+'px', height: itemSelect.coords.top+'px', width: itemSelect.coords.width+'px'}" ref="itemselector">
                        <input type="text" placeholder="Поиск по остаткам..." v-model="itemSelect.value" @input="searchAutocomplete">
                        <div class="list-options">
                            <div class="selectItem itemloading" v-if="searchAutocompleteLoading"></div>
                            <div class="selectItem itemPadding" v-show="!searchAutocompleteLoading" v-for="(i, ind) in itemSelect.items" :key="ind" @click="linkCartItem(i)">
                                <div class="medname" v-html="`${(i.med_name.toLowerCase().replace(itemSelect.value.toLowerCase(), '<b>'+itemSelect.value.toLowerCase()+'</b>'))} (${i.vendor_name})`"></div>
                                <div class="desc">
                                    <div class="desc-item s-pharmacy">{{pharmaName(i.pharma)}}</div>
                                    <div class="desc-item s-price">{{i.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</div>
                                    <div class="desc-item s-amount">Осталось {{i.qtty}} шт.</div>
                                    <div class="desc-item s-iid">{{i.iid}}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="cart-list">
                        <div class="item" v-for="(i, ind) in data.cart" :key="ind" :outofstock="cartStock[i.iid]?.qtty <= 0" :style="{opacity: (i.amount > 0 && (cartStock[i.iid]?.pharma == data.pharmacy) || !cartStock[i.iid]) ? 1 : 0.5}">
                            <input class="cart-checkbox" type="checkbox" v-if="isCollector" :checked="getCheckboxVal(i.id)" @change="checkedItem($event, i.id)">
                            <div class="row" :style="{minWidth: '30px', maxWidth: '30px'}">{{ind+1}}</div>
                            <div class="row" :style="{minWidth: '50px', maxWidth: '50px'}">
                                <img v-if="getLoadedData(i.med_id)" :src="chooseImage(getLoadedData(i.med_id))" @error="$event.target.src = require('../assets/images/no-image.jpg');">
                            </div>
                            <div class="row" v-for="(j, jind) in cartList" :key="jind" :style="{minWidth: j.width, maxWidth: j.width}" v-html="j.val(i)"></div>
                            <div class="row capitalize" :style="{minWidth: '250px', maxWidth: '250px'}">{{i.name[0].toUpperCase() + i.name.toLowerCase().substring(1)}}{{getLoadedData(i.med_id)?.vendor_name ? ` (${getLoadedData(i.med_id)?.vendor_name})` : ''}}</div>
                            <div class="row" :style="{minWidth: '175px', maxWidth: '175px', marginLeft: '20px'}">
                                <i class="change-amount fi fi-sr-caret-left" @click="changeAmount(i, false)" :style="{visibility: (i.iid && cartStock[i.iid]?.pharma == data.pharmacy || !cartStock[i.iid]) ? 'visible' : 'hidden'}"></i>
                                <span style="width: 50px; text-align: center;">{{i.amount}} шт.</span>
                                <i class="change-amount fi fi-sr-caret-right" @click="changeAmount(i, true)" :style="{visibility: (i.iid && cartStock[i.iid]?.pharma == data.pharmacy || !cartStock[i.iid]) ? 'visible' : 'hidden'}"></i>
                            </div>
                            <div class="item-select" :selected="itemSelect.ind == ind" @click="itemSelected(ind, i.iid)" :ref="'itemSelect'+ind">
                                <div class="selectItem" v-if="cartStock[i.iid]">
                                    <div class="medname">{{cartStock[i.iid].med_name}} ({{cartStock[i.iid].vendor_name}})</div>
                                    <div class="desc">
                                        <i class="fi-sr-undo" style="margin-right: 5px;" v-if="cartStock[i.iid].pharma != data.pharmacy" title="Позиция идет с другой аптеки"></i>
                                        <i class="fi fi-sr-bulb" v-if="cartStock[i.iid].guess" title="Автоподбор" style="margin-right: 5px;"></i>
                                        <div class="desc-item s-pharmacy">{{pharmaName(cartStock[i.iid].pharma)}}</div>
                                        <div class="desc-item s-price">{{cartStock[i.iid].price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</div>
                                    
                                        <div class="desc-item s-amount">В нал. {{cartStock[i.iid].qtty}} шт.</div>
                                        <div class="desc-item s-iid">{{cartStock[i.iid]?.iid}}</div>
                                    </div>
                                    <i class="open-list fi fi-sr-caret-down"></i>
                                </div>
                                <div class="selectItem" v-else>
                                    <div class="medname">Нажмите чтобы выбрать...</div>
                                    <div class="desc">
                                        <div class="desc-item s-pharmacy">Нет в наличии</div>
                                    </div>
                                    <i class="open-list fi fi-sr-caret-down"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="item-row aftercart-total">
                        <i class="fi-sr-shopping-cart" style="margin-right: 10px;"></i>
                        <template v-if="allPositionsLinked">
                            <span>Корзина: <strong>{{(orderOp.getOrderTotalPrice(data.cart)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</strong></span>
                        </template>
                        <span v-else><strong>Привяжите все товары</strong></span>
                    </div>
                    <div class="item-row aftercart-total">
                        <i class="fi-sr-checkbox" style="margin-right: 10px;"></i>
                        <template v-if="allPositionsLinked">
                            <span>Итого: <strong>{{(totalPrice).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</strong></span>
                        </template>
                    </div>
                </div>
            </div>
            <el-row style="margin-top: 20px;">
                <el-button v-if="isOperator" style="width: 250px; justify-content: flex-start;" :icon="CirclePlusFilled" @click="newCartItem">Добавить позицию</el-button>
            </el-row>
            <el-row style="margin-top: 10px;">
                <el-button v-if="isOperator" style="width: 250px; justify-content: flex-start;" :icon="Refresh" @click="cartTryToLink(true)">Автоподбор всех позиций</el-button>
            </el-row>
            <el-divider content-position="left" style="margin-top: 30px; margin-bottom: 10px;"><el-icon><Money /></el-icon>Платежи</el-divider>
            <div class="box cart cart-section">
                <div class="item-row boxrow" style="flex-direction: column;">
                    <div class="header-item">
                        <div class="item-col">
                            <div class="row" :style="{width: '150px'}">Состояние оплаты</div>
                            <div class="row" :style="{width: '120px'}">Сумма оплаты</div>
                            <div class="row" :style="{width: '150px'}">Телефон плательщика</div>
                            <div class="row" :style="{width: '120px'}">Квитанция</div>
                            <div class="row" :style="{width: '150px'}">Время оплаты</div>
                            <div class="row" :style="{width: '150px'}">Комментарий</div>
                        </div>
                    </div>
                    <div class="cart-list">
                        <div class="item-row aftercart-total" style="color: #7C7C7C;" v-if="receipts.length <= 0">
                            <i class="fi-sr-cross" style="margin-right: 10px;"></i>
                            <span>По данному заказу пока не было транзакций</span>
                        </div>
                        <div class="item receiptitem" v-for="(i, ind) in receipts" :key="ind" :error="i.code=='error'">
                            <div class="row" :style="{width: '150px', fontWeight: 'bold'}" v-html="parseHalykCode(i.code)"></div>
                            <div class="row" :style="{width: '120px'}"><b>{{i.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</b></div>
                            <div class="row" :style="{width: '150px'}">{{mask(i.phone, '+7 (###) ### ##-##')}}</div>
                            <div class="row" :style="{width: '120px'}">{{i.reference}}</div>
                            <div class="row" :style="{width: '150px'}">{{i.code=='ok' ? moment(i.payment_date).calendar() : ''}}</div>
                        </div>
                    </div>
                    <div class="item-row aftercart-total">
                        <i class="fi-sr-checkbox" style="margin-right: 10px;"></i>
                        <span>Оплачено: <strong>{{(receiptsTotalPaid).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</strong></span>
                    </div>
                    <div class="item-row aftercart-total" v-if="totalPrice!=receiptsTotalPaid && receiptsTotalPaid > 0">
                        <i class="fi-sr-receipt" style="margin-right: 10px;"></i>
                        <span>Осталось: {{(totalPrice).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸ - {{(receiptsTotalPaid).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸ = <strong>{{(totalPrice-receiptsTotalPaid).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}} ₸</strong></span>
                    </div>
                </div>
            </div>
            <!-- Buttons -->
            <el-divider content-position="left" style="margin-top: 30px; margin-bottom: 20px;"><el-icon><Operation /></el-icon>Действия</el-divider>
                <!-- If operator -->
            <RauzaButton v-if="data.state == 3" @click="passOrder(2)" :loading="loadingPassCourier" width="100%" height="49px" flaticon="fi-sr-checkbox" text="Принять подтверждения" background="rgba(26, 206, 40, 0.17)" color="rgb(1,128,15)" marginTop="20px" padding="15px 20px"/>
            
            <template v-if="isOperator && data.state != 1">
                <div class="warning" v-if="data.pharmacy == '-1'">Не выбрана аптека для передачи</div>
                <el-row><el-button type="success" :icon="CircleCheckFilled" round v-if="data.state==0 && data.pharmacy != '-1'" @click="passOrder()" :loading="loadingPassCourier">{{`Передать заказ аптеке на ${pharmaName(data.pharmacy)}`}}</el-button></el-row>
                <el-row style="margin-top: 5px;"><el-button type="warning" :icon="FolderChecked" round @click="saveOrder(false)" :loading="loadingSaveOrder">Сохранить</el-button></el-row>
                <el-row style="margin-top: 5px;"><el-button :icon="Refresh" round @click="sync" :loading="loadingResetSync">Сбросить изменения</el-button></el-row>

                <el-divider style="margin-top: 15px; margin-bottom: 10px;"></el-divider>

                <el-row style="margin-top: 5px;"><el-button :icon="CircleCheckFilled" round v-if="data.state!=5 && data.state!=-1" @click="confirmer('Вы действительно хотите полностью завершить заказ?<br>Заказ будет иметь статус Завершенного.', ()=>passOrder(1))" :loading="loadingPassCourier">Отправить в завершенные</el-button></el-row>

                <el-row style="margin-top: 5px;"><el-button type="danger" :icon="CircleCloseFilled" round v-if="data.state!=5 && data.state!=-1" @click="confirmer('Введите причину отказа:', (e)=>cancelOrder(e), true, 'Причина отказа')" :loading="loadingPassCourier">Отменить заказ</el-button></el-row>
                <el-row style="margin-top: 5px;"><el-button :icon="Refresh" round v-if="(data.state==-1 || data.state == 5)" @click="confirmer('Вы действительно хотите восстановить заказ?', ()=>passOrder(-3))" :loading="loadingPassCourier">Восстановить заказ</el-button></el-row>
            </template>
            <template v-if="data.state == 1">
                <div class="warning">Ожидание ответа от ИА...</div>

                <RauzaButton v-if="data.state!=5 && data.state!=-1" @click="confirmer('Вы действительно хотите полностью завершить заказ?<br>Заказ будет иметь статус Завершенного.', ()=>passOrder(1))" :loading="loadingPassCourier" width="100%" height="49px" flaticon="fi-sr-checkbox" text="[Форс-мажор] Отправить в завершенные (Скоро будет недоступно)" background="rgba(26, 206, 40, 0.17)" color="rgb(1,128,15)" marginTop="20px" padding="15px 20px"/>
            </template>
            <!-- Курьеру не нужно что либо менять -->
            <!-- <template v-if="isCollector">
                <RauzaButton v-if="data.state==1" @click="passOrder" :loading="loadingPassCourier" width="100%" height="49px" flaticon="fi-sr-ambulance" :text="data.type=='1' ? 'Передать заказ курьеру' : 'Заказ готов к выносу'" background="rgba(26, 206, 40, 0.17)" color="rgb(1,128,15)" padding="15px 20px"/>
                <RauzaButton v-if="data.state==1" @click="passOrder(-1)" :loading="loadingPassCourier" width="100%" height="49px" flaticon="fi-sr-angle-double-left" text="Вернуть товар оператору" background="rgba(251, 81, 81, 0.17)" color="rgb(251, 81, 81)" marginTop="20px" padding="15px 20px"/>

                <RauzaButton v-if="data.state==4" @click="passOrder" :loading="loadingPassCourier" width="100%" height="49px" flaticon="fi-sr-check" text="Клиент забрал заказ" background="rgba(26, 206, 40, 0.17)" color="rgb(1,128,15)" marginTop="20px" padding="15px 20px"/>
            </template> -->
        </div>
    </div>
</div>
</template>

<script>
import { inject } from '@vue/runtime-core'
import { mask } from 'maska'
import RauzaButton from '../components/RauzaButton'
import Catalog from '../components/Catalog.vue'
import { nanoid } from 'nanoid'
import OrderState from '../components/OrderState.vue'
import moment from 'moment';
import {
  ArrowLeft,
  ArrowDown,
  Refresh,
  Promotion,
  CirclePlusFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  FolderChecked
} from '@element-plus/icons-vue'
export default {
    data() {
        return {
            ArrowLeft,
            ArrowDown,
            Refresh,
            Promotion,
            CirclePlusFilled,
            CircleCheckFilled,
            CircleCloseFilled,
            FolderChecked,
            ready: false,
            global: {},
            data: {},
            id: null,
            loadedData: [],
            announce: [],
            changeMode: Function,
            orderOp: Function,
            serverQuery: Function,
            confirmer: Function,
            funcs: Object,
            waybill: {
                url: null
            },
            mask,
            moment,
            loading: true,
            searchAutocompleteLoading: false,
            loadingSaveOrder: false,
            loadingPassCourier: false,
            loadingResetSync: false,
            mapPathLoading: false,
            openCatalog: false,
            catalogsData: {},
            orderStates: {},
            receipts: [],
            deliveryList: [],
            myCatalog: '',
            showMap: false,
            newComment: {
                active: false,
                value: '',
                loading: false
            },
            changePharmacy: {
                changed: false,
                reason: '',
                original: ''
            },
            cartStock: {},
            cartAmounts: {},
            itemSelect: {
                active: false,
                ind: -1,
                iid: null,
                coords: {
                    x: 0,
                    y: 0,
                    top: 0
                },
                value: '',
                items: []
            },
            cartList: [
                {
                    width: '65px',
                    name: 'Артикул',
                    val: (e) => e.med_id
                },
                // {
                //     width: '75px',
                //     name: 'Кол-во',
                //     val: (e) => `${e.amount} шт.`
                // },
                // {
                //     width: '75px',
                //     name: 'Наличие',
                //     val: (e) => this.getItemQttyinPharma(e, e.pharma) > 0 ? this.getItemQttyinPharma(e, e.pharma)+' шт.' : 'Нет в нал.'
                // },
                // {
                //     width: '100px',
                //     name: 'Сумма',
                //     val: (e) => `${(parseInt(e.price) * e.amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₸`
                // },
            ],
            commentIcon: [
                {
                    role: 'ИнфоАптека',
                    color: '#339af0',
                    icon: 'fi fi-rs-database'
                },
                {
                    role: 'Оператор',
                    color: '#F0A433',
                    icon: 'fi fi-rs-user'
                }
            ],
            pharmaData: [
                {
                    value: '1',
                    coords: [51.09470639755518,71.42909863483106],
                    name: 'Аптека Низких Цен на Бокейхан, 32'
                },
                {
                    value: '2',
                    coords: [51.15594555130653,71.45435680019433],
                    name: 'Pharmteka на Пушкина 1',
                },
                {
                    value: '3',
                    coords: [51.15510482496643,71.47776682679496],
                    name: 'Шалфей на Жумабаева 3',
                },
                {
                    value: '4',
                    coords: [51.13140869732561,71.37792959325407],
                    name: 'Tomenbagalar на Е-753, д.2 (Сыганак)',
                },
            ]
        }
    },
    components: {
        RauzaButton,
        OrderState,
        Catalog,
    },
    async mounted() {
        this.global = inject('global');
        this.orderOp = inject('orders');
        this.announce = inject('announce');
        this.confirmer = inject('confirmer');
        this.catalogsData = inject('catalogsData');
        this.serverQuery = inject('serverQuery');
        this.changeMode = inject('changeMode');
        this.orderStates = inject('orderStates');

        this.funcs = inject('funcs');

        this.id = this.global.order_id;

        this.$refs['order-window'].addEventListener('scroll', this.windowScroll);
        document.addEventListener('click', this.windowClick);

        await this.sync();

        this.ready = true;
        this.loading = false;
    },
    beforeUnmount() {
        this.$refs['order-window'].removeEventListener('scroll', this.windowScroll);
        document.removeEventListener('click', this.windowClick);
    },
    methods: {
        windowScroll() {
            if (!this.itemSelect.active) return;
            let rect = this.$refs['itemSelect'+this.itemSelect.ind][0],
                bounds = rect.getBoundingClientRect();
            this.itemSelect.coords.top =  window.innerHeight - bounds.top - 100;
        },
        windowClick(event) {
            if (!this.itemSelect.active) return;
            let isClickInside = this.$refs['itemSelect'+this.itemSelect.ind][0].contains(event.target);
            if (!isClickInside) {
                if (this.$refs.itemselector.contains(event.target)) return false;
                this.itemSelect.active = false;
                this.itemSelect.ind = -1;
                this.itemSelect.kaspi_id = -1;
            }
        },
        sync() {
            return new Promise((resolve) => {
                (async() => {
                    this.loadingResetSync = true;
                    let res = (await this.serverQuery('admin', 'getParticularOrder', {orderid: this.id})).data.message;
        
                    this.orderOp.parseOrder(res);
                    this.data = res;

                    let cart_medids = (this.data.cart.map(e=>e.med_id));
                    let response = await this.serverQuery('admin', 'getStockItem', {list: JSON.stringify(cart_medids)}),
                        data = response.data.message;

                    this.funcs.arrayify_parse(data, this.loadedData);
  
                    console.log(this.data.cart);

                    this.changePharmacy.changed = false;
                    this.changePharmacy.reason = '';
                    this.changePharmacy.original = this.data.pharmacy; // Pharmacy at the beginning (if you change, then we know what it used to be)

                    try{this.data.extra_info = JSON.parse(this.data.extra_info);}catch(e){console.log(e)}

                    if (this.myCatalog != '') {
                        delete this.catalogsData[this.myCatalog];
                    }

                    this.myCatalog = nanoid();
                    this.catalogsData[this.myCatalog] = this.data;

                    this.loadingResetSync = false;
                    
                    await this.cartTryToLink();
                    await this.getOrderReceipts();
                    // await this.getOrderDelivery();

                    resolve();
                })();
            });
        },
        changeAmount(i, add) {
            let ind = this.data.cart.findIndex(e => e.iid == i.iid),
                data = this.data.cart[ind];
            console.log(this.data.cart, i)
            if (add === true) data.amount++;
            else if (add === false) data.amount--;
			if(data.amount > 999) data.amount = 999;
			if(data.amount <= 0) {
                data.amount = 0;
                if (!data.med_id) {
                    this.data.cart.splice(ind, 1);
                }
            }
		},
        async getOrderReceipts() {
            this.receipts.splice(0, this.receipts.length);
            let response = (await this.serverQuery('admin', 'getOrderReceipts', {order_id: this.data.id})).data.message;
            for(let i in response) {
                this.receipts.push(response[i]);
            }
            console.log('response', response);
            console.log('this.receipts', this.receipts);
        },
        async getOrderDelivery() {
            this.deliveryList.splice(0, this.deliveryList.length);
            let response = (await this.serverQuery('admin', 'getOrderDelivery', {order_id: this.data.id})).data.message;
            for(let i in response) {
                this.deliveryList.push(response[i]);
            }
            console.log('this.deliveryList', this.deliveryList, this.deliveryList.length);
        },
        async saveOrder(auto) {
            if (!this.allPositionsLinked) return this.announce.push({type: 'E', message: 'Не все товары привязаны к штрих коду.'});
            return new Promise((resolve) => {
                (async() => {
                    this.data.cart = this.data.cart.filter(e => e.amount > 0);
                    // Update coords
                    let ind = this.pharmaData.findIndex(e=>e.value == this.data.pharmacy);
                    console.log(this.pharmaData, ind);
                    let newCoords = JSON.stringify({
                        from: {
                            address: this.pharmaData[ind].name,
                            longitude: this.pharmaData[ind].coords[1],
                            latitude: this.pharmaData[ind].coords[0]
                        },
                        to: this.data?.coords?.to
                    });
                    this.loadingSaveOrder = true;
                    let res = await this.serverQuery('admin', 'updateParticularOrder', {
                        order_data: JSON.stringify({...this.data, coords: newCoords})
                    });
                    console.log('updateParticularOrder', newCoords)
                    this.loadingSaveOrder = false;
                    if(res.status) {
                        if (!auto) this.announce.push({type: 'S', message: 'Заказ успешно обновлен.'});
                    }

                    if (this.changePharmacy.original != this.data.pharmacy) {
                        let text = `Смена с аптеки ${this.pharmaName(this.changePharmacy.original)} на ${this.pharmaName(this.data.pharmacy)}. Причина: ${this.changePharmacy.reason}`;
                        await this.leaveReason(text, 2); // 1 -> canceled, 2 -> changed pharma
                        
                        this.changePharmacy.changed = false;
                        this.changePharmacy.reason = '';
                        this.changePharmacy.original = this.data.pharmacy;
                    }
                    resolve();
                })();
            });
        },
        pharmaName(value) {
            let pharma_ind = this.funcs.pharmacies.findIndex(e=>e.value == value);
            if (pharma_ind == -1) return;
            return this.funcs.pharmacies[pharma_ind].short;
        },
        deliveryType(type) {
            switch(parseInt(type)) {
                case 1: return 'Яндекс.Доставка';
                case 2: return 'Экспресс-доставка Raketa';
            }
        },
        async passOrder(metadata) {
            if (!this.allPositionsLinked) return this.announce.push({type: 'E', message: 'Не все товары привязаны к штрих коду.'});
            if (this.isOperator) await this.saveOrder(true); // Operator should save changes before passing an order
            this.loadingPassCourier = true;
            let res = await this.serverQuery('admin', 'updateOrderState', {
                order_id: this.data.id,
                metadata,
            });
            this.loadingPassCourier = false;
            console.log(res);
            if(res.status) {
                this.announce.push({type: 'S', message: 'Статус заказа обновлен.'});
                this.data.state = parseInt(res.data.message);
                this.orderStates[this.data.id] = this.data.state;
            }
            else {
                
                this.announce.push({type: 'E', message: res.data.message});
            }
        },
        async leaveComment() {
            let text = this.newComment.value;
            if (text.length < 2) return this.announce.push({type: 'S', message: 'Слишком короткий текст комментария.'});
            this.newComment.loading = true;
            this.newComment.value = '';
            let newComment = await this.serverQuery('admin', 'orderNewComment', {order_id: this.data.id, text});
            if (newComment.status) {
                this.data.comments.push(newComment.data.message);
            }
            this.newComment.loading = false;
        },
        async cancelOrder(text) {
            this.passOrder(-2);
            this.leaveReason(text, 1);
        },
        async leaveReason(text, reason_id) {
            return new Promise((resolve) => {
                (async () => {
                    let reason_data = {order_id: this.data.id, text, reason_id};
                    await this.serverQuery('admin', 'orderNewReason', reason_data);
                    this.data.reasons.push({...reason_data, owner_login: this.global.account.login, owner_role: this.global.account.role});
                    resolve();
                })();
            });
        },
        async deleteComment(i) {
            i.loading = true;
            await this.serverQuery('admin', 'orderDeleteComment', {order_id: this.data.id, comment_hash: i.hash});

            let ind = this.data.comments.findIndex(e=>e.hash==i.hash);
            if (ind != -1) {
                this.data.comments.splice(ind, 1);
            }

            i.loading = false;
        },
        async searchAutocomplete() {
			let thisMoment = Date.now(),
				name = this.itemSelect.value;
			this.lastLetter = thisMoment;
            this.searchAutocompleteLoading = true;
            let response = (await this.serverQuery('admin', 'searchInStock', {med_name: this.itemSelect.value, pharma: this.data.pharmacy})).data.message;
			if (this.lastLetter != thisMoment) {
				console.log(`Item search by '${name}' is skipped.`);
				return;
			}
            this.searchAutocompleteLoading = false
            this.itemSelect.items = response;
		},
        newCartItem() {
            this.data.cart.push({
                med_id: null,
                name: 'Новая позиция',
                price: null,
                amount: 1,
                pharma: null,
                iid: null
            });
        },
        async itemSelected(ind, iid) {
            let rect = this.$refs['itemSelect'+ind][0];
            console.log('itemSelected', rect);
            let bounds = rect.getBoundingClientRect();
            this.itemSelect.ind = ind;
            this.itemSelect.iid = iid;
            this.itemSelect.coords = {
                x: this.cumulativeOffset(rect).left - 200,
                y: this.cumulativeOffset(rect).top,
                top: window.innerHeight - bounds.top - 100,
                width: bounds.width
            };
            this.itemSelect.active = true;

            this.searchAutocomplete();
        },
        async linkCartItem(i) {
            let ind = this.data.cart.findIndex(e => e.iid == this.itemSelect.iid);
            if (ind == -1) return;
            this.data.cart[ind].pharma = i.pharma;
            this.data.cart[ind].iid = i.iid;
            this.data.cart[ind].price = i.price;

            console.log(i.pharma, this.data.pharmacy);
            if (i.pharma != this.data.pharmacy) {
                this.data.cart[ind].amount = 0;
            }
            else {
                if (this.data.cart[ind].amount == 0) {
                    this.data.cart[ind].amount = 1;
                }
            }

            if (!this.data.cart[ind].med_id) {
                this.data.cart[ind].med_id = i.med_id;
                this.data.cart[ind].name = i.med_name;
            }

            this.cartStock[i.iid] = i;
            delete this.cartStock[this.itemSelect.iid];


            this.itemSelect.active = false;
            this.itemSelect.ind = -1;
            this.itemSelect.value = '';
            this.itemSelect.iid = -1;

            // TEMPORARY
            let cart_medids = (this.data.cart.map(e=>e.med_id));
            let response = await this.serverQuery('admin', 'getStockItem', {list: JSON.stringify(cart_medids)}),
                data = response.data.message;

            this.funcs.arrayify_parse(data, this.loadedData);
        },
        async cartTryToLink(guess) {
            if (guess) {
                this.data.cart.forEach((e) => {
                    if (!this.cartStock[e.iid]) return;
                    this.cartStock[e.iid].guess = true;
                });
            }
            let cartIids = [];
            this.data.cart.forEach((e) => {
                cartIids.push({iid: this.cartStock[e.iid]?.guess ? null : e.iid, med_id: e.med_id});
            });
            console.log(cartIids);
            if (!cartIids.length) return;
            let response = await this.serverQuery('admin', 'tryToLink', {list: JSON.stringify(cartIids), pharma: this.data.pharmacy}),
                data = response.data.message;
            console.log('tryToLink', data);
            data.forEach(e => {
                let c = e.res[0]; // chosen IID
                this.cartStock[c.iid] = c;
                
                this.cartStock[c.iid].guess = e.isGuess;

                let ind = this.data.cart.findIndex(i => i.iid == c.iid);
                if (ind == -1) {
                    ind = this.data.cart.findIndex(i => i.med_id == c.med_id);
                }
                this.data.cart[ind].iid = c.iid;
                this.data.cart[ind].pharma = c.pharma;
            });

            console.log('this.cartStock', this.cartStock);
        },
        startPointChanged() {
            if (this.changePharmacy.original != this.data.pharmacy && this.changePharmacy.original != '-1') {
                this.changePharmacy.changed = true;
                this.changePharmacy.reason = '';
            }
            else {
                this.changePharmacy.changed = false;
            }

            console.log(this.data);

            this.data.cart.forEach(e => {
                e.pharma = this.data.pharmacy;
            });
            this.cartTryToLink();
        },
        getAge(dateString) {
            if (!dateString) return NaN;
            let today = new Date(),
                birthDate = new Date(dateString),
                age = today.getFullYear() - birthDate.getFullYear(),
                m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        },
        checkedItem(v, id) {
            let checked = v.target.checked,
                list = JSON.parse(localStorage.getItem('rauza_checked_items'));
            let ind = list.findIndex(e => (e.item_id == id && e.order_id == this.data.id));
            if (ind != -1 && !checked) list.splice(ind, 1);
            else list.push({order_id: this.data.id, item_id: id})
            localStorage.setItem('rauza_checked_items', JSON.stringify(list));
        },
        getCheckboxVal(id) {
            let list = JSON.parse(localStorage.getItem('rauza_checked_items')),
                ind = list.findIndex(e => (e.item_id == id && e.order_id == this.data.id));
            if (ind == -1) return false;
            return true;
        },
        scrollDown() {
            let ref = this.$refs['order-window'];
            if (!ref) return;
            ref.scrollTo({top: ref.scrollHeight, behavior: 'smooth'});
        },
        chooseImage(data) {
            if (data.item_data?.images?.length) return data.item_data?.images[0];
			else return require('../assets/images/no-image.jpg');
		},
        getLoadedData(med_id) {
            return this.loadedData[this.loadedData.findIndex(e => e.med_id == med_id)];
        },
        getCommentTheme(role) {
            let ind = this.commentIcon.findIndex(e=>e.role == role);
            if (ind == -1) return {
                color: '#339af0',
                icon: 'fi fi-rs-user'
            };
            return this.commentIcon[ind];
        },
        cumulativeOffset(element) {
            var top = 0, left = 0;
            do {
                top += element.offsetTop  || 0;
                left += element.offsetLeft || 0;
                element = element.offsetParent;
            } while(element);

            return {
                top: top,
                left: left
            };
        },
        parseHalykCode(code) {
            switch(code) {
                case 'ok': return '<span style="display: flex; color: green;"><i class="fi fi-sr-check" style="margin-right: 5px;"></i>Оплачено</span>';
                case 'error': return '<span style="display: flex; color: #df0000;"><i class="fi fi-sr-cross" style="margin-right: 5px;"></i>Провалено</span>';
                case 'pending': return '<span style="display: flex; color: #9b9b9b;"><i class="fi fi-sr-clock" style="margin-right: 5px;"></i>Ожидание</span>';
                default: return '<span style="display: flex; color: #df0000;"><i class="fi fi-sr-cross" style="margin-right: 5px;"></i>Ошибка</span>';
            }
        }
    },
    computed: {
        isCourier() {return this.global.account.role == 1;},
        isCollector() {return this.global.account.role == 2;},
        isOperator() {return this.global.account.role == 3;},
        isDirector() {return this.global.account.role == 4;},
        paidTotalDifference() {return this.orderOp.getOrderTotalPrice(this.data.cart)},
        skippedAnyExtraInfo() {return !this.data.extra_info?.house && !this.data.extra_info?.apartment && !this.data.extra_info?.intercom && !this.data.extra_info?.entrance && !this.data.extra_info?.floor && !this.data.extra_info?.comment},
        cancelOrderReason() {
            let ind = this.data.reasons.findIndex(e=>e.reason_id == 1);
            if (ind == -1) return false;
            else return this.data.reasons[ind];
        },
        otherReasons() {
            return this.data.reasons.filter(e=>e.reason_id != 1);
        },
        allPositionsLinked() {
            let linked = true;
            this.data.cart.forEach(e => {
                if (e.price == null) linked = false;
            });
            return linked;
        },
        receiptsTotalPaid() {
            let total = 0;
            this.receipts.forEach((e) => {
                if (e.code != 'ok') return;
                total += parseInt(e.amount);
            });
            return total;
        },
        totalPrice() {
            console.log(this.data);
            let total = this.orderOp.getOrderTotalPrice(this.data.cart) + this.data.delivery_price;
            if (this.data.promo) {
                total -= parseInt(this.data.promo.sale);
            }
            if (total < 0) total = 0;
            return total;
        }
    }
}
</script>

<style>
    .orderitemname {
        font-weight: bold;
        box-sizing: border-box;
        overflow: hidden;
        display: -webkit-box;
        white-space: pre-wrap;
        word-wrap: break-word;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        vertical-align: top;
    }
    .order-window .el-form-item {
        margin-bottom: 7.5px;
    }
    .order-window .el-form-item__label {
        margin-bottom: 2.5px !important;
    }
</style>
<style scoped>
    .order-window {
        position: absolute;
        top: 60px;
        left: 200px;
        background-color: var(--el-bg-color);
        width: calc(100% - 200px);
        height: calc(100vh - 60px);
        padding: 20px 50px;
        overflow-y: scroll;
        box-sizing: border-box;
        z-index: 100;
        padding-bottom: 40px;
    }
    .boxrow {
        border-radius: 5px;
        border: 1px solid var(--el-border-color-light);
        box-shadow: var(--el-box-shadow-light);
        overflow: hidden;
    }
    /* ===== HEADER STYLES ===== */
    .rauza-header {
        flex-direction: row;
        justify-content: space-between;
        position: relative;
    }
    .rauza-header .buttons {
        display: flex;
        align-items: center;
    }
    .rauza-header .option {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 35px;
        height: 35px;
        border-radius: 100px;
        border: 2px solid var(--border);
        background-color: #fff;
        color: var(--black);
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
    }
    .rauza-header .option:hover {
        color: var(--black);
        border-color: #ccc;
    }
    .rauza-header .option:last-child{
        color: var(--red);
    }
    .rauza-header h2 span{
        font-weight: 600;
        color: var(--main-color);
    }
    @media screen and (max-width: 480px){
        .rauza-header, .rauza-header .item-row{align-items: unset !important;flex-direction: column;}
        .rauza-header .buttons{position: absolute; top: 0;right: 0;}
    }
    /* ===== END HEADER STYLES ===== */



    .section-title{
        font-weight: 600;
        padding-bottom: 10px;
    }



    /* ===== COMMENTS STYLES ===== */
    #comments {
        padding: 15px 0;
        box-sizing: border-box;
    }
    .comments-wrap{
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .comment {
        display: flex;
        align-items: center;
        max-width: 100%;
        width: max-content;
        height: max-content;
        padding: 7px 12px;
        box-sizing: border-box;
        background-color: var(--el-color-info-light-8);
        border-left: 2px solid #339af0;
        border-radius: 3px;
        animation: newMessage 1s;
        font-size: 14px;
    }
    .comment.report {
        border-left: 2px solid var(--red);
        color: var(--red);
        animation: newCommentRed 1s;
    }
    .comment .icon{
        padding-right: 10px;
        box-sizing: border-box;
    }
    .comment .delete{
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--red);
        border-radius: 20px;
        color: #fff;
        font-size: 12px;
        margin-left: 10px;
        cursor: pointer;
    }
    #comments .input{
        display: flex;
        flex-direction: column;
    }
    #comments .input .group{
        position: relative;
    }
    #comments .input .group i{
        position: absolute;
        top: 50%;
        left: 10px;
        transform: translateY(-50%);
        pointer-events: none;
    }
    #comments .input input{
        width: 100%;
        outline: none;
        border: none;
        border-radius: 3px;
        background-color: transparent;
        box-shadow: none;
        font-family: 'Roboto', sans-serif;
        margin: 0;
        padding: 10px 20px;
        padding-left: 40px;
        box-sizing: border-box;
        transition: .4s ease-in-out;
    }
    #comments .input input:focus{
        background-color: rgb(99,230,190,.1);
        box-shadow: 0 5px 5px rgb(185 185 185 / 10%);
    }
    #comments .input .notice{
        display: flex;
        font-size: 10px;
        color: #999;
    }
    .row-icon {
        width: 16px;
        height: 16px;
    }
    .row.non-profit {
        color: rgb(216, 0, 0);
    }
    .row.non-profit i{
        margin-right: 5px;
    }
    /* ===== END COMMENTS STYLES ===== */

    

    /* ===== BOX STYLES ===== */
    .page {
        width: 100%;
        display: flex;
        flex-direction: column;
    }
    @media screen and (max-width: 780px){
        .page, #comments{padding: 0 20px;box-sizing: border-box;}
        .order-window {
            position: fixed;
            padding: 0;
            width: 100vw;
            height: 100vh;
            padding-bottom: 10px;
        }
    }
    .grid-box{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }
    @media screen and (max-width: 900px){.grid-box{grid-template-columns: 1fr;}}
    .box .list{
        width: 100%;
        padding: 0;
        margin: 10px 0;
        list-style-type: none;
    }
    .box .list li{
        display: flex;
        justify-content: space-between;
        padding: 10px;
        border-bottom: 1px solid var(--el-border-color);
    }
    .box .list li span{
        display: flex;
        font-size: 15px;
        background-color: var(--el-bg-color-overlay);
        position: relative;
    }
    .box .list li span.value{
        text-align: right;
    }

    .box .note{
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 24px;
    }
    
    .text{
        color: #708086;
    }
    .adress{
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .adress .group{
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .adress .label{color: #708086; font-size: 14px;}
    .adress h4{
        font-size: 16px;
        margin: 0;
        padding: 7px;
        border: 1px solid var(--border);
        border-radius: 3px;
    }
    .adress select, .adress input{
        margin-left: 0;
        box-shadow: none;
        border: 1px solid var(--border);
    }

    .open-in-2gis {
        width: max-content;
        padding: 7px 14px;
        text-decoration: none;
        color: #fff;
        display: flex;
        align-items: center;
        background-color: #9bbc24;
        border-radius: 3px;
    }
    .open-in-2gis img {
        height: 15px;
        margin-left: 10px;
    }
    .space-between{
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 10px;
    }
    /* ===== END BOX STYLES ===== */
    


    /* ===== BOX STYLES ===== */
    /* ===== END BOX STYLES ===== */

    .state {
        border-radius: 10px;
        background-color: rgb(252, 137, 71, 0.2);
        color: rgb(252, 137, 71);
        font-weight: bold;
        padding: 5px 10px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
    }
    .state i {
        margin-right: 10px;
    }
    .order-title {
        margin-left: 10px;
    }
    .server-name {
        margin-left: 10px;
        border-radius: 10px;
        background-color: rgb(252, 137, 71, 0.2);
        color: rgb(252, 137, 71);
        padding: 5px 10px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
    }
    .item-section {
        width: 100%;
        height: max-content;
        background-color: #fff;
        padding: 20px 20px;
        box-sizing: border-box;
        border-radius: 20px;
    }
    .cart-section {
        width: 100%;
        height: max-content;
        box-sizing: border-box;
        border-radius: 20px;
        margin-top: 10px;
        background-color: var(--el-bg-color-overlay);
        color: var(--el-text-color-primary);
    }
    .item-row {
        width: 100%;
        align-items: center;
        display: flex;
        flex-direction: row;
    }
    .item-row h2 {
        margin: 0;
    }
    .item-row:last-child {
        margin-bottom: 0;
    }
    .line {
        width: 100%;
        height: 1px;
        background-color: var(--border);
        margin: 20px 0;
    }
    .cart-list {
        width: 100%;
        padding: 15px 20px;
        box-sizing: border-box;
    }
    .cart-list .item {
        width: 100%;
        display: flex;
        cursor: pointer;
        align-items: center;
        height: 70px;
        transition: 0.2s all;
    }
    .cart-list .item:hover {
        background-color: var(--el-color-info-light-8);
    }
    .cart-list .item[outofstock="true"] {
        background-color: var(--el-color-info-light-8);
        border-radius: 20px;
    }
    .receiptitem:nth-child(2n) {
        background-color: var(--el-bg-color-overlay);
    }
    .receiptitem[error="true"] {
        background-color: var(--el-bg-color-overlay);
    }
    .cart-list .item .number {
        width: 7%;
        padding: 5px 10px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        margin-right: 5px;
        height: 100%;
    }
    .cart-list .item:hover .name{
        /* background-color: rgb(166, 57, 254, 0.1); */
        color: rgb(166, 57, 254);
    }
    .cart-list .item .amount {
        font-size: 1rem;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        height: calc(100% - 10px);
    }
    .cart-checkbox {
        width: 30px;
        height: 30px;
        border-radius: 20px;
        cursor: pointer;
        margin: 0;
    }
    .cart-checkbox:checked {
        background-color: var(--blue);
    }
    .amount-button:first-child {
        background-color: rgba(251, 81, 165, 0.2);
        color: rgb(251, 81, 165);
    }
    .amount-button:nth-child(3) {
        background-color: rgba(251, 139, 73, 0.2);
        color: rgb(251, 139, 73);
    }
    .delete-button {
        background-color: rgba(251, 81, 81, 0.2) !important;
        color: rgb(251, 81, 81) !important;
    }
    .item .amount .amount-button {
        height: 100%;
        display: flex;
        align-items: center;
        padding: 0 10px;
        border-radius: 10px;
        font-weight: bold;
        width: 10px;
        text-align: center;
        justify-content: center;
    }
    .extra-button {
        background-color: rgb(166, 57, 254, 0.1);
        color: rgb(166, 57, 254);
        margin-left: 10px;
    }
    .item .amount input {
        margin: 0 10px;
        height: 100%;
        display: flex;
        align-items: center;
        border: none;
        outline: none;
        text-align: center;
        width: 50px;
        font-weight: bold;
        border-bottom: 1px solid rgb(235, 235, 235);
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .add-new {
        padding-bottom: 5px;
        font-weight: bold;
        display: flex;
        background-color: #fff;
        padding: 5px 10px;
        border-radius: 10px;
        cursor: pointer;
        margin-top: 20px;
    }
    .add-new:hover {
        background-color: rgb(24, 24, 24);
        color: #fff;
    }
    iframe {
        width: 100%;
        height: 350px;
        margin-top: 10px;
    }
    .order-data {
        /* height: calc(100% - 50px); */
        height: max-content;
        padding-right: 10px;
    }
    .circleletter {
        width: 30px;
        min-width: 30px;
        height: 30px;
        border: 3px solid rgb(235, 235, 235);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 10px;
    }
    .item-row select {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        color: #2c3e50;
        border: none;
        font-size: 1rem;
        outline: none;
        width: 100%;
        border-bottom: 1px solid rgb(235, 235, 235);
    }
    .surcharge {
        display: flex;
        align-items: center;
    }
    .surcharge strong {
        margin-left: 10px;
    }
    .header-item {
        width: 100%;
        height: max-content;
        padding: 15px 20px !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        position: relative;
        background-color: var(--el-bg-color-overlay);
        border-top-right-radius: 5px;
        border-top-left-radius: 5px;
        box-shadow: var(--el-box-shadow-lighter);
    }
    .item-col {
        width: 100%;
        display: flex;
    }
    .item-col .row:first-child {
        margin-left: 0;
    }
    .cart-list .item .row {
        margin-left: 20px;
        height: 100%;
        display: flex;
        align-items: center;
    }
    .row img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .cart-list .item .row:first-child {
        margin-left: 0;
    }
    .aftercart-total {
        padding: 10px 20px;
        box-sizing: border-box;
    }
    .item-col .row {
        margin-left: 20px;
        cursor: pointer;
        color: rgb(124, 124, 124);
        letter-spacing: .5px;
        font-weight: lighter;
    }
    .warning {
        text-align: center;
        color: rgb(124, 124, 124);
        font-weight: bold;
        user-select: none;
    }
    .cms-loading {
        width: 165px;
        height: 165px;
        mask-image: url('../assets/images/logo.png');
        mask-size: 100%;
        mask-position: center;
        mask-repeat: no-repeat;
        background: linear-gradient(270deg, #cccccc, #e9e9e9, #cccccc);
        background-size: 400% 400%;
        animation: flicker-loading 1s infinite !important;
        position: absolute;
        top: calc(50% - 50px);
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .item-select {
        width: 100%;
        height: 100%;
        cursor: pointer;
    }
    .item-select[selected="true"] .selectItem{
        background-color: var(--el-color-primary-light-9) !important;
    }
    .selectItem {
        height: 100%;
        display: flex;
        justify-content: center;
        flex-direction: column;
        position: relative;
        padding-left: 20px;
        background-color: var(--el-bg-color);
    }
    .selectItem:nth-child(2n) {
        background-color: var(--el-bg-color-page);
    }
    .selectItem:hover {
        background-color: var(--el-color-info-light-8);
    }
    .selectItem .desc {
        display: flex;
        color: var(--el-color-info-dark-2);
        font-size: 14px;
    }
    .selectItem .desc .desc-item {
        margin-right: 5px;
    }
    .desc-item.s-pharmacy {
        font-weight: bold;
    }
    .desc-item.s-nonprofit {
        color: rgb(185, 0, 0);
        font-weight: bold;
    }
    .desc-item:after {
        content: ' - ';
    }
    .desc-item:last-child:after {
        content: '';
    }
    .selectItem .medname {
        text-transform: lowercase;
        white-space: pre-wrap;
        word-wrap: break-word;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        vertical-align: middle;
        overflow: hidden;
    }
    .selectItem .medname::first-letter{text-transform: capitalize;}
    .selectItem .open-list {
        position: absolute;
        right: 20px;
        font-size: 1.5rem;
        top: 50%;
        transform: translate(0, -50%);
    }
    .change-amount {
        font-size: 1.1rem;
        cursor: pointer;
        border-radius: 10px;
        padding: 5px;
        transition: 0.1s all;
        background-color: var(--el-color-info-light-7);
    }
    .change-amount .spaceloading {
        width: 1.1rem;
        height: 1.1rem;
    }
    .change-amount.fi-sr-caret-left {
        margin-right: 10px;
    }
    .change-amount.fi-sr-caret-right {
        margin-left: 10px;
    }
    .change-amount.fi-sr-check {
        margin-left: 10px;
    }
    .change-amount:hover {
        background-color: rgb(214, 214, 214);
    }
    .selectItem.itemPadding {
        padding: 5px 20px;
    }
    .item-select-list {
        width: 400px;
        height: max-content;
        position: absolute;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
        background-color: var(--el-bg-color);
        border-radius: 10px;
        z-index: 100000;
    }
    .item-select-list input {
        width: 100%;
        outline: none;
        border: none;
        border-radius: 3px;
        background-color: transparent;
        margin: 0;
        padding: 10px 20px;
        font-size: 1rem;
        box-sizing: border-box;
    }
    .item-select-list .list-options {
        height: calc(100% - 38px);
        overflow-y: scroll;
    }
    .item-select-list .list-options .selectItem {
        min-height: 55px;
        height: max-content;
        cursor: pointer;
    }
    .capitalize {
        white-space: pre-wrap;
        word-wrap: break-word;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        vertical-align: middle;
        overflow: hidden;
        font-weight: bold;
    }
    .itemloading {
        height: 300px !important;
        background: linear-gradient(270deg, var(--el-color-info-light-9), var(--el-color-info-light-7), var(--el-color-info-light-9));
        background-size: 400% 400%;

        animation: flicker-loading 2s infinite !important;
    }
    .nomargintop {
        margin-top: 10px !important;
    }
    @media screen and (max-width: 1017px){
        .item-row {
            overflow: scroll;
        }
        .cart-list .item {
            width: max-content;
        }
        .header-item {
            align-items: flex-start;
        }
        .header-item .item-col{
            width: max-content;
        }
        .order-data {
            padding-right: 0;
        }
    }
</style>