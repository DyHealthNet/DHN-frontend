import './assets/main.css'

import { createApp } from 'vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// PrimeVue (used by DownloadableDataTable.vue)
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'

// Components
import App from './App.vue'

const dyHealthNetTheme = {
  dark: false,
    colors: {
    "background": "#F5F5F5",
    "surface": "#FAFAFA",
    "surface-bright": "#FFFFFF",
    "surface-light": "#F5F5F5",
    "surface-variant": "#E0E0E0",
    "on-surface-variant": "#4D4D4D",
    "darken-1": "#333333",
    "white-surface": "#FAFAFA",

    "primary": "#A5BFDC",
    "primary-backup": "#A5BFDC",
    "primary-darken-1": "#516F84",
    "primary-darken-1-backup": "#516F84",

    "secondary": "#C1A1D3",
    "secondary-darken-1": "#7D5E9A",

    "error": "#E57373",
    "info": "#3398DB",
    "success": "#81C784",
    "warning": "#FFB74D",

    "orcid_button": "#A6CE39",
    "github_button": "#121212",

    "chart": '#707070',
    "chart-grid": '#E0E0E0',

    "node-logo-background": "#CDDDE8",

    "text": "#000000",
    "node-border": "#A5BFDC",
  },
}

const dyHealthNetThemeDark = {
  dark: true,
  colors: {
    "background": "#1E1E1E",
    "surface": "#2A2A2A",
    "surface-bright": "#3C3C3C",
    "surface-light": "#474747",
    "surface-variant": "#555555",
    "on-surface-variant": "#D1D1D1",
    "darken-1": "#FFFFFF",
    "white-surface": "#FAFAFA",

    "primary": "#516F84",
    "primary-darken-1": "#A5BFDC",

    "secondary": "#C1A1D3",
    "secondary-darken-1": "#5E3A6B",

    "error": "#E57373",
    "info": "#3398DB",
    "success": "#81C784",
    "warning": "#FFB74D",

    "orcid_button": "#54691a",
    "github_button": "#FAFAFA",

    "chart": '#B0B0B0',
    "chart-grid": '#555555',

    "text": "#FFFFFF",
    "node-border": "#A5BFDC",
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

createApp(App)
  .use(vuetify)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      // Color comes from Vuetify's own --v-theme-* CSS vars (see DownloadableDataTable.vue),
      // not PrimeVue's dark-mode class -- disable its own dark-mode token swapping.
      options: { darkModeSelector: false },
    },
  })
  .mount('#app')
