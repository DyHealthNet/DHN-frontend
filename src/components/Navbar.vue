<template>
  <v-app-bar class="page-borders-nav" height="110" scroll-behavior="elevate" app>
      <img src="../assets/figures/DyHealthNet_Logo.png" width="270" height="140"/>
    <v-app-bar-title class="text-indigo"></v-app-bar-title>

    <v-spacer></v-spacer>

    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/" color="primary-darken-1" cl="mx-1" v-bind="props">Home</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/context" color="primary-darken-1" class="mx-1" v-bind="props">Context Creation</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/overview" color="primary-darken-1" class="mx-1" v-bind="props">Data Overview</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/network" color="primary-darken-1" class="mx-1" v-bind="props">Network</v-btn>
      </template>
    </v-menu>
    <!--<v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn color="#104D63" v-bind="props">API</v-btn>
      </template>
    </v-menu>-->
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/about-us" color="primary-darken-1" class="mx-1" v-bind="props"> About Us</v-btn>
      </template>
    </v-menu>
  </v-app-bar>

</template>

<style>
.page-borders-nav {
  border-left: 50px solid #FAFAFA;
  border-right: 50px solid #FAFAFA;
}
</style>