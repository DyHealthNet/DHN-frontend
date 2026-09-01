<template>
  <v-toolbar :color="color" :density="density">
    <v-toolbar-title>
      <slot name="title"></slot>
    </v-toolbar-title>
    <slot name="prepend"></slot>
    <v-tooltip
      v-if="showHideUnconnected"
      :text="hideUnconnected ? 'Show unconnected' : 'Hide unconnected'"
      location="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          icon
          variant="text"
          v-bind="props"
          class="mr-3"
          @click="$emit('update:hideUnconnected', !hideUnconnected)"
        >
          <v-icon>{{ hideUnconnected ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-tooltip :text="physicsOn ? 'Disable Physics' : 'Enable Physics'" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          icon
          variant="text"
          v-bind="props"
          class="mr-3"
          @click="$emit('update:physicsOn', !physicsOn)"
        >
          <v-icon>{{ physicsOn ? 'mdi-pause' : 'mdi-play' }}</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-tooltip text="Reset view" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn icon variant="text" v-bind="props" class="mr-3" @click="$emit('fit-view')">
          <v-icon>mdi-fit-to-page-outline</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-tooltip text="Download image" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn icon variant="text" v-bind="props" class="mr-3" @click="$emit('save-image')">
          <v-icon>mdi-camera</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <slot name="append"></slot>
  </v-toolbar>
</template>

<script>
// Shared by data-network.vue and differential-network.vue: both pages built up
// near-identical toolbars (physics switch, camera/save-image button, and now
// the hide-unconnected switch) independently, with only their page-specific
// extras (topN slider, selection-mode toggle, clear-network button, ...)
// actually differing -- those extras go through the prepend/append slots
// instead of being duplicated here.
export default {
  name: 'GraphToolbar',
  props: {
    color: { type: String, default: 'primary-darken-1' },
    density: { type: String, default: 'compact' },
    physicsOn: { type: Boolean, required: true },
    hideUnconnected: { type: Boolean, default: false },
    showHideUnconnected: { type: Boolean, default: false },
  },
  emits: ['update:physicsOn', 'update:hideUnconnected', 'save-image', 'fit-view'],
};
</script>
