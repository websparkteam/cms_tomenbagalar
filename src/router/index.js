import { createRouter, createWebHistory } from 'vue-router'
// import Home from '../views/Home'
import OrdersList from '../views/Orders'
import Order from '../views/Order'
import Messages from '../views/Messages'
import Conversation from '../views/Conversation'
import Items from '../views/Items'
import Members from '../views/Members'
import Clients from '../views/Clients'
import Member from '../views/Member'
import Client from '../views/Client'
import Item from '../views/Item'
import Gallery from '../views/Gallery'
import Management from '../views/Management.vue'
import Circulation from '../views/Circulation.vue'
import NewBanner from '../views/NewBanner.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: OrdersList
    },
    {
        path: '/order/:id',
        name: 'Order',
        component: Order
    },
    {
        path: '/messages',
        name: 'Messages',
        component: Messages
    },
    {
        path: '/conversation/:id',
        name: 'Conversation',
        component: Conversation
    },
    {
        path: '/circulation',
        name: 'Circulation',
        component: Circulation
    },
    {
        path: '/stock',
        name: 'Stock',
        component: Items
    },
    {
        path: '/banners/new/:id',
        name: 'NewBanner',
        component: NewBanner
    },
    {
        path: '/members',
        name: 'Members',
        component: Members
    },
    {
        path: '/clients',
        name: 'Clients',
        component: Clients
    },
    {
        path: '/client/:id',
        name: 'Client',
        component: Client
    },
    {
        path: '/member/:id',
        name: 'Member',
        component: Member
    },
    {
        path: '/item/:id',
        name: 'Item',
        component: Item
    },
    {
        path: '/gallery',
        name: 'Gallery',
        component: Gallery
    },
    {
        path: '/management',
        name: 'Management',
        component: Management
    },
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router