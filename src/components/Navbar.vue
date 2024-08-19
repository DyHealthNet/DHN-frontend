<template>
  <v-app-bar class="page-borders-nav" height="110" color="#FAFAFA" scroll-behavior="elevate" app>
    <v-img>
      <img src="../assets/figures/DyHealthNet_Logo.png" width="270" height="140"/>
    </v-img>
    <v-app-bar-title class="text-indigo"
      ></v-app-bar-title
    >
    <v-spacer></v-spacer>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <a href="/">
          <v-btn color="#104D63" v-bind="props">Home</v-btn>
        </a>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <a href="/overview" >
          <v-btn color="#104D63" v-bind="props">Data Overview</v-btn>
        </a>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <a href="/network" >
          <v-btn color="#104D63" v-bind="props">Network</v-btn>
        </a>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <a href="/about-us">
          <v-btn color="#104D63" v-bind="props"> About Us</v-btn>
        </a>
      </template>
    </v-menu>
  </v-app-bar>

</template>

<style>
.page-borders-nav {
  border-left: 50px solid #FAFAFA; /* Change the color and size as needed */
  border-right: 50px solid #FAFAFA; /* Change the color and size as needed */
}
</style>
