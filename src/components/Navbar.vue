<template>
  <v-app-bar height="110" color="#FAFAFA" scroll-behavior="elevate" app>
    <v-image>
      <img src="../assets/figures/DyHealthNet_Logo.png" width="270" height="140"/>
    </v-image>
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
        <v-btn color="#104D63" v-bind="props">Data Overview</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn color="#104D63" v-bind="props">Network</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn color="#104D63" v-bind="props">API</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <a href="/about-us" target="_blank">
          <v-btn color="#104D63" v-bind="props"> About Us</v-btn>
        </a>
      </template>
    </v-menu>
  </v-app-bar>
</template>

