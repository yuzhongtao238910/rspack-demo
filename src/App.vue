<template>
	<div class="container">
		<div>
			<h1>apple</h1>
		</div>
		<HelloWorld msg="Rspack + Vue" />
        <div id="apple">
            <nav>
                <router-link to="/">Home</router-link>
                <router-link to="/about">About</router-link>
            </nav>
            <router-view></router-view> <!-- 路由匹配到的组件将渲染在这里 -->
        </div>
	</div>
</template>
<script>
import HelloWorld from "./components/HelloWorld.vue";
export default {
	components: { 
        HelloWorld 
    },
    mounted() {
        console.log(process.env)
    }
};
</script>
<style lang="less" scoped>
#apple {
    font-size: 20px;
}
</style>