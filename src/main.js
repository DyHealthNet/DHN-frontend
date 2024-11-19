import './assets/main.css'

import { createApp } from 'vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Components
import App from './App.vue'

const dyHealthNetTheme = {
  dark: false,
    colors: {
    "background": "#FFFFFF",
    "surface": "#FAFAFA",
    "surface-bright": "#FFFFFF",
    "surface-light": "#F5F5F5",
    "surface-variant": "#E0E0E0",
    "on-surface-variant": "#4D4D4D",
    "darken-1": "#333333",
    "white-surface": "#FAFAFA",

    "primary": "#A5BFDC",
    "primary-darken-1": "#164F65",

    "secondary": "#C1A1D3",
    "secondary-darken-1": "#7D5E9A",

    "error": "#E57373",
    "info": "#3398DB",
    "success": "#81C784",
    "warning": "#FFB74D",

    "orcid_button": "#A6CE39",
    "github_button": "#121212"
  },
}

const dyHealthNetThemeDark = {
  dark: true,
  colors: {
    "background": "#121212",
    "surface": "#1E1E1E",
    "surface-bright": "#2A2A2A",
    "surface-light": "#333333",
    "surface-variant": "#444444",
    "on-surface-variant": "#E0E0E0",
    "white-surface": "#FAFAFA",

    "primary": "#0A2835",  // Keep similar to provide brand consistency
    "primary-darken-1": "#A5BFDC",  // Darker shade for contrast #A5BFDC

    "secondary": "#C1A1D3",
    "secondary-darken-1": "#5E3A6B",

    "error": "#E57373",
    "info": "#3398DB",
    "success": "#81C784",
    "warning": "#FFB74D",

    "orcid_button": "#54691a",
    "github_button": "#FAFAFA",
  },
}

const vuetify = createVuetify({
    theme: {
      defaultTheme: 'dyHealthNetTheme',
        themes: {
          dyHealthNetTheme,
          dyHealthNetThemeDark
        }
    },
    options: {
      customProperties: true,
    },
  components,
  directives,
})

createApp(App).use(vuetify).use(router).mount('#app')
