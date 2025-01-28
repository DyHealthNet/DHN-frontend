<template>
  <v-app-bar class="page-borders-nav" height="110" scroll-behavior="elevate" app>
      <img src="../assets/figures/DyHealthNet_Logo.png" width="270" height="140"/>
    <v-app-bar-title class="text-indigo"></v-app-bar-title>

    <v-spacer></v-spacer>

    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/" color="primary-darken-1" cl="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-home-outline</v-icon>
            </template>
            Home</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/context" color="primary-darken-1" class="mx-1" v-bind="props" @click="contextState.showIndicator = false">
          <template v-slot:prepend>
            <v-badge v-if="contextState.showIndicator" dot color="error">
              <v-icon>mdi-tune-vertical</v-icon>
            </v-badge>
            <v-icon v-else>mdi-tune-vertical</v-icon>
          </template>
          Contexts</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/overview" color="primary-darken-1" class="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-chart-line</v-icon>
            </template>
            Overview</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/network" color="primary-darken-1" class="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-graph-outline</v-icon>
            </template>
            Network</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/about-us" color="primary-darken-1" class="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-book-outline</v-icon>
            </template>
            Documentation</v-btn>
      </template>
    </v-menu>

    <v-icon color="primary-darken-1">mdi-white-balance-sunny</v-icon>
    <v-switch
        v-model="isDark"
        hide-details
        inset
        @click="toggleTheme"
        class="mx-2">
    </v-switch>
    <v-icon class="mr-5" color="primary-darken-1">mdi-weather-night</v-icon>

    <v-menu>
      <template v-slot:activator="{ props }">
          <v-btn @click="handleAuth" color="primary-darken-1" class="mx-1" :icon=icon></v-btn>
      </template>
    </v-menu>
  </v-app-bar>
  <v-row>
      <div class="text-center ma-2">
        <v-snackbar
            v-model="contextState.taskStarted"
            :color="contextState.taskType"
        >
          <v-icon class="my-0 mr-2">
            mdi-information-outline
          </v-icon>
          {{ contextState.taskInfo }}

          <template v-slot:actions>
            <v-btn
                variant="text"
                @click="contextState.taskStarted = false"
            >
              Close
            </v-btn>
          </template>
        </v-snackbar>
      </div>
    </v-row>
</template>

<script>
import router from "@/router.js";
import { authState, checkLogin, getCookie } from '@/components/authentication/auth.js';
import {reactive, onMounted, computed} from 'vue';
import {useRoute} from "vue-router";
import { ref, watch, inject } from 'vue';
import { contextState } from '@/components/contexts/contextStatus.js';
import {BASE_URL} from "../components/constants.js";

export default {
  computed: {
    contextState() {
      return contextState
    },
    finishedIndicator() {
      // check if we're already on the contexts page in which case we don't want to show the snackbar
      if (this.$route.path === '/context') {
        return false
      }
      // we only want to show the indicator if the user hasn't seen it yet
      if (this.indicatorSeen) {
        this.indicatorSeen = false;
        return false
      }
      return contextState.processFinished
    }
  },
  setup() { // setup (Composition API) runs before mounted and provides access to reactive "APIs" (here authState)
    const route = useRoute(); // to get current route because this.router doesn't work in setup()
    // computed property for dynamic icon
    // computed is reactivity-based -> automatically updates when underlying reactive data changes (here route.path & authState.isLoggedIn)
    const icon = computed(() => {
      if (route.path === '/login') {
        return 'mdi-account'; // Show account icon on login page
      } else {
        return authState.isLoggedIn ? 'mdi-logout' : 'mdi-login';
      }
    });

    // Fetch login status on component mount
    // mounted is a lifecycle hook (Options API) & is called when a component has been added to DOM
    onMounted(() => {
      checkLogin(); // Ensures login status is up to date when navbar loads
    });

    // Handle Login/ Logout page navigation
    const handleAuth = async () => {
      if (authState.isLoggedIn) {
        router.push("/logout");// Redirect to logout page
      } else {
        // Redirect to login page
        router.push("/login"); // Update with your login route
      }
    };

    return {
      icon,
      handleAuth,
    };
  },
  data() {
    return {
      isDark: false,
      darkModeText: "",
      isLoggedIn: false, //TODO remove?

      taskStarted: false,
      taskInfo: "",
      taskType: "",

      indicatorSeen: false,
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
  },
  created() {
    this.defaultTheme()
    this.darkModeText = this.$vuetify.theme.global.name === 'dyHealthNetTheme' ? "Light mode" : "Dark mode";
  },
}
</script>

<style>
.page-borders-nav {
  border-left: 50px solid rgb(var(--v-theme-surface));
  border-right: 50px solid rgb(var(--v-theme-surface));
}
</style>