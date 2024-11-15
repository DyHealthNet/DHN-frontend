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
    <v-icon class="mr-5">mdi-weather-night</v-icon>

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
    <v-menu>
      <template v-slot:activator="{ props }">
          <v-btn @click="handleAuth" color="primary-darken-1" class="mx-1" :icon="loginStatus"></v-btn>
      </template>
    </v-menu>
  </v-app-bar>

</template>

<script>
import router from "@/router.js";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
export default {
  data() {
    return {
      isDark: false,
      darkModeText: "",
      isLoggedIn: false
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
    },
    async handleAuth() {
      if (this.isLoggedIn) {
        // If the user is logged in, log them out
        await this.logout();
      } else {
        // If the user is not logged in, redirect to login page
        this.$router.push("/login");
      }
    },
    async logout() {
      try {
        const csrfToken = this.getCookie("csrftoken"); // Get the CSRF token from cookies
        console.log(csrfToken)
        const response = await fetch(`${BASE_URL}/network/api/logout/`, {
          method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken // Include the CSRF token in the request header
        },
        credentials: 'include',
        }).then(response => response.json())
          .then(async data => {
            // Check the response to determine success
            if (data.status === 'success') {
              console.log("Logged out successfully");
              this.isLoggedIn = false;
              await router.push("/logout");  // Redirect to login page
          } else {
          console.error("Logout failed:", response.statusText);
        }
      })
      } catch (error) {
        console.error("Error during logout:", error);
      }
    },
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
  },
  created() {
    this.defaultTheme()
    this.darkModeText = this.$vuetify.theme.global.name === 'dyHealthNetTheme' ? "Light mode" : "Dark mode";
  },
  computed: {
    loginStatus() {
      // check if we're on the login page or not
      if (this.$route.path === "/login") {
        return "mdi-account"
      } else {
        try {
          fetch(`${BASE_URL}/network/api/checklogin/`, {
            method: 'GET',
            credentials: 'include',  // Ensures session cookies are sent with the request
          }).then(response => response.json())
          .then( data => {
            this.isLoggedIn = data.is_logged_in;
          })
        } catch (error) {
          console.error('Error submitting form:', error);
        };
        console.log(this.isLoggedIn);
        console.log(this.isLoggedIn ? "mdi-logout" : "mdi-login");
        return this.isLoggedIn ? "mdi-logout" : "mdi-login";
      }
    }
  }
}
</script>

<style>
.page-borders-nav {
  border-left: 50px solid rgb(var(--v-theme-surface));
  border-right: 50px solid rgb(var(--v-theme-surface));
}
</style>