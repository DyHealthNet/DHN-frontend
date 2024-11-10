<template>
  <v-app-bar class="page-borders-nav" height="110" scroll-behavior="elevate" app>
      <img src="../assets/figures/DyHealthNet_Logo.png" width="270" height="140"/>
    <v-app-bar-title class="text-indigo"></v-app-bar-title>

    <v-spacer></v-spacer>
    <v-icon>mdi-white-balance-sunny</v-icon>
    <v-switch
        v-model="isDark"
        hide-details
        inset
        @click="toggleTheme"
        class="mx-2">
    </v-switch>
    <v-icon class="mr-2">mdi-weather-night</v-icon>

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

<script>
export default {
  data() {
    return {
      isDark: false,
      darkModeText: ""
    }
  },
  methods: {
    toggleTheme() {
      const currentTheme = this.$vuetify.theme.global.name
      this.$vuetify.theme.global.name = currentTheme === 'dyHealthNetTheme' ? 'dyHealthNetThemeDark' : 'dyHealthNetTheme'
      this.isDark = currentTheme === 'dyHealthNetTheme'
      localStorage.setItem('theme', this.$vuetify.theme.global.name)
      this.darkModeText = currentTheme === 'dyHealthNetTheme' ? "Light mode" : "Dark mode";
    },
    defaultTheme() {
      if (localStorage.getItem('theme')) {
        this.$vuetify.theme.global.name = localStorage.getItem('theme')
        this.isDark = localStorage.getItem('theme') === 'dyHealthNetThemeDark'
        return
      }
      const getSystemMode = () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      this.$vuetify.theme.global.name = getSystemMode() === "dark" ? "dyHealthNetThemeDark" : "dyHealthNetTheme"
      this.isDark = getSystemMode() === "dark"
    }
  },
  created() {
    this.defaultTheme()
    this.darkModeText = this.$vuetify.theme.global.name === 'dyHealthNetTheme' ? "Light mode" : "Dark mode";
  }
}
</script>

<style>
.page-borders-nav {
  border-left: 50px solid rgb(var(--v-theme-surface));
  border-right: 50px solid rgb(var(--v-theme-surface));
}
</style>