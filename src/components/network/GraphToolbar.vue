<template>
  <v-toolbar :color="color" :density="density">
    <v-toolbar-title>
      <slot name="title"></slot>
    </v-toolbar-title>
    <slot name="prepend"></slot>
    <v-switch
      v-if="showHideUnconnected"
      :model-value="hideUnconnected"
      @update:model-value="$emit('update:hideUnconnected', $event)"
      color="white"
      hide-details
      density="compact"
      class="mr-3"
    >
      <template #label>
        <span class="text-caption">{{ hideUnconnected ? 'Show unconnected' : 'Hide unconnected' }}</span>
      </template>
    </v-switch>
    <v-switch
      :model-value="physicsOn"
      @update:model-value="$emit('update:physicsOn', $event)"
      color="white"
      hide-details
      density="compact"
      class="mr-3"
    >
      <template #label>
        <span class="text-caption">{{ physicsOn ? 'Disable Physics' : 'Enable Physics' }}</span>
      </template>
    </v-switch>
    <v-btn icon variant="text" @click="$emit('save-image')">
      <v-icon>mdi-camera</v-icon>
    </v-btn>
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
  emits: ['update:physicsOn', 'update:hideUnconnected', 'save-image'],
};
</script>
