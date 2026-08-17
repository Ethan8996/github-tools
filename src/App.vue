<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
  <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
   <router-view></router-view>
  <!-- <Home/> -->
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
// import Home from './views/Home.vue';

export default {
  name: 'App',
  components: {
    // Home
  }
}
</script>

<style>
html,
body {
  min-height: 100%;
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  min-height: 100vh;
}
</style>
