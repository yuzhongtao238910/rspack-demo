import Router from 'vue-router';

import Vue from 'vue';
Vue.use(Router); // 使用Vue Router插件
 
const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import("@/views/Home.vue")
    },
    {
        path: '/about',
        name: 'About',
        component: () => import("@/views/About.vue")
    }
];
 
const router = new Router({
    mode: 'history', // 使用HTML5历史模式
    routes // （缩写）相当于 routes: routes
});

export default router