<template>
  <v-toolbar
      v-if="showToolbar"
      :color="filterToolbarColor"
      density="compact"
      class="stick-to-top mt-2 mb-5 filter-toolbar"
      :class="{ 'is-sticky': isSticky }"
      rounded="lg"
      elevation="5"
      ref="filterToolbar"
  >
    <v-combobox
        :prepend-icon="isSticky ? '' : 'mdi-filter-outline'"
        v-model="selectedContext"
        :items="contexts"
        placeholder="Static network"
        hide-details
        single-line
        :class="isSticky ? '' : 'ml-3'"
        item-value="text"
        item-title="text"
    >
      <!-- Slot to customize items -->
      <template #item="{ item, props }">
        <v-list-item v-bind="props">
          <template v-slot:append>
            <v-icon :color="item.raw.color">mdi-circle</v-icon>
          </template>
        </v-list-item>
      </template>
    </v-combobox>
    <v-btn icon
           @click="clearSelection"
           v-if="selectedContext !== null"
    >
      <v-icon>mdi-close-circle-outline</v-icon>
    </v-btn>
  </v-toolbar>
</template>

<script>
import {BASE_URL} from "@/components/constants.js";
import {authState, getCookie} from "@/components/authentication/auth.js";

export default {
  name: 'FilterToolbar',
  emits: ['changeContext'],

  props: {
    disableMove: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      // only show toolbar if user is logged in
      showToolbar: authState.isLoggedIn,
      contexts: [{'text': 'Context1', 'color': '#00000', 'lightVariant': '#00000', 'darkVariant': '#00000'}],

      selectedContext: null,
      filterToolbarColor: "primary-darken-1",
      isSticky: false,
    };
  },
  methods: {
    clearSelection() {
      this.selectedContext = null;
      this.filterToolbarColor = "primary-darken-1";
      this.$emit('changeContext', this.selectedContext);
    },

    changeColorOnSelectedContext() {
      if (!this.selectedContext) {
        return;
      }
      this.filterToolbarColor = this.selectedContext.lightVariant;
    },


    async retrieveContexts() {
      const wantedFields = ['contextName', 'contextValue', 'colors']
      let url = new URL(`${BASE_URL}/context/api/retrieveContexts/`);
      url.search = new URLSearchParams({fields: wantedFields});

      await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie("csrftoken")
        },
        credentials: 'include',
      })
          .then(response => response.json())
          .then(data => {
            this.contexts = data.result.map((context) => {
              return {
                text: context.contextName,
                value: context.contextValue,
                color: context.colors.color,
                lightVariant: context.colors.lightVariant,
                darkVariant: context.colors.darkVariant,
              };
            });
            // filter out contexts where color is black
            this.contexts = this.contexts.filter((context) => context.color !== '#000000');
          })
          .catch((error) => {
            console.error('Error:', error);
          });
    }
  },

  mounted() {
    if (this.disableMove) {
      this.$refs.filterToolbar.$el.classList.remove('stick-to-top');
      return;
    }
    window.addEventListener('scroll', () => {
      try {
        if (this.disableMove) {
          return;
        }
        const toolbar = this.$refs.filterToolbar.$el.getBoundingClientRect();
        this.isSticky = toolbar.top === 140;
      } catch (error) {
        // ignore
      }
    });
  },
  created() {
    this.retrieveContexts();
  },

  watch: {
    selectedContext: function () {
      this.changeColorOnSelectedContext();
      this.$emit('changeContext', this.selectedContext);
    },
  },
}
</script>


<style scoped>
.stick-to-top {
  position: sticky;
  top: 140px;
  z-index: 10;
}

.filter-toolbar {
  margin: 0 auto;
  width: 40%;
}

.stick-to-top.is-sticky {
  transform: translateX(calc(48vw - 80px));
  width: 12%;
  left: 0;
}

.v-combobox input::placeholder {
  color: #000;
  font-weight: normal;
  opacity: 1;
}
</style>