<template>
  <v-app-bar height="80" color="#FAFAFA" scroll-behavior="elevate" app>
    <v-app-bar-title class="text-indigo"
      ><strong>DyHealthNet</strong></v-app-bar-title
    >
    <v-spacer></v-spacer>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <a href="/">
          <v-btn color="indigo" v-bind="props">Home</v-btn>
        </a>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn color="indigo" v-bind="props">Visualization</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn color="indigo" v-bind="props">Network</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn color="indigo" v-bind="props">API</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <a href="/about-us" target="_blank">
          <v-btn color="indigo" v-bind="props"> About Us</v-btn>
        </a>
      </template>
    </v-menu>
  </v-app-bar>
</template>
