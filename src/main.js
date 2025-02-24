import Vue from 'vue';
import './style.css';
import App from './App.vue';
import router from "./router"
import "./test.less"




new Vue({
    router,
    render(h) {
        return h(App);
    },
}).$mount('#app'); 