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
    label="Static network"
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
import {authState} from "@/components/authentication/auth.js";

export default {
  name: 'FilterToolbar',
  emits: ['cangeContext'],
  props: {
    contexts: {
      type: Array,
      required: true
    }
  },

  data() {
    return {
      // only show toolbar if user is logged in
      showToolbar: authState.isLoggedIn,

      selectedContext: null,
      filterToolbarColor: "primary-darken-1",
      isSticky: false,
    };
  },
  methods: {
    clearSelection() {
      this.selectedContext = null;
      this.filterToolbarColor = "primary-darken-1";
      this.$emit('cangeContext', this.selectedContext);
    },

    changeColorOnSelectedContext() {
      if (!this.selectedContext) {
        return;
      }
      this.filterToolbarColor = this.selectedContext.darkVariant;
    },

  },

  mounted() {
    window.addEventListener('scroll', () => {
      try {
        const toolbar = this.$refs.filterToolbar.$el.getBoundingClientRect();
        this.isSticky = toolbar.top === 140;
      } catch (error) {
        // ignore
      }
  });
    console.log(this.isLoggedIn);
  },

  watch: {
    selectedContext: function() {
      this.changeColorOnSelectedContext();
      this.$emit('cangeContext', this.selectedContext);
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
</style>