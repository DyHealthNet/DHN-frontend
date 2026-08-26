<template>
  <v-app-bar class="px-1 px-sm-4 px-md-8 px-lg-12" :height="appBarHeight" density="comfortable" scroll-behavior="elevate" app>
    <router-link to="/">
      <v-img class="forkmeFigure" :src="logoSrc"
        :width="logoWidth"
        :aspect-ratio="270 / 140"
        alt="DyHealthNet Logo">
      </v-img>
      </router-link>

    <v-app-bar-title class="text-indigo"></v-app-bar-title>

    <v-spacer></v-spacer>

    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/" :size="btnSize" color="primary-darken-1" cl="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-home-outline</v-icon>
            </template>
            Home</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/context" :size="btnSize" color="primary-darken-1" class="mx-1" v-bind="props" @click="contextState.showIndicator = false">
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
          <v-btn to="/overview" :size="btnSize" color="primary-darken-1" class="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-chart-line</v-icon>
            </template>
            Overview</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/network" :size="btnSize" color="primary-darken-1" class="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-graph-outline</v-icon>
            </template>
            Network</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/modina" :size="btnSize" color="primary-darken-1" class="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-vector-difference</v-icon>
            </template>
            moDiNA</v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
          <v-btn to="/about-us" :size="btnSize" color="primary-darken-1" class="mx-1" v-bind="props">
            <template v-slot:prepend>
              <v-icon>mdi-book-outline</v-icon>
            </template>
            About</v-btn>
      </template>
    </v-menu>
    <v-icon :size="btnSize" color="primary-darken-1">mdi-white-balance-sunny</v-icon>
    <v-switch
        v-model="isDark"
        hide-details
        inset
        density="compact"
        @click="toggleTheme"
        class="mx-2">
    </v-switch>
    <v-icon :size="btnSize" class="mr-5" color="primary-darken-1">mdi-weather-night</v-icon>

    <v-menu>
      <template v-slot:activator="{ props }">
          <v-btn @click="handleAuth" :size="btnSize" color="primary-darken-1" class="mx-1" :icon=icon></v-btn>
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
import logoSrc from '@/assets/figures/DyHealthNet_Logo.png';
import { authState, checkLogin, getCookie } from '@/components/authentication/auth.js';
import {reactive, onMounted, computed} from 'vue';
import {useRoute} from "vue-router";
import { ref, watch, inject } from 'vue';
import { useDisplay } from 'vuetify';
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

    // Scale the whole navbar down together at narrower widths instead of
    // letting Vuetify's overflow:hidden toolbar clip the trailing login icon.
    // Vuetify's "lg" bucket (1280-1919px, typical laptop widths) is where the
    // bar used to overflow, so it needs to shrink too, not just xs/sm/md.
    const { name: breakpointName } = useDisplay();
    const logoWidth = computed(() => ({ xs: 100, sm: 130, md: 160, lg: 190, xl: 230 }[breakpointName.value] ?? 270));
    const appBarHeight = computed(() => ({ xs: 64, sm: 72, md: 80, lg: 90, xl: 100 }[breakpointName.value] ?? 110));
    const btnSize = computed(() => ({ xs: 'x-small', sm: 'x-small', md: 'small', lg: 'small' }[breakpointName.value] ?? 'default'));

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
      logoSrc,
      logoWidth,
      appBarHeight,
      btnSize,
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