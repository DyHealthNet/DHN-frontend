<template>
  <v-tab :value="value">
    <slot></slot>
    <v-icon size="16" class="ml-2" @click.stop="$emit('close')">mdi-close</v-icon>
  </v-tab>
</template>

<script>
// A v-tab with a close (x) icon that emits its own 'close' rather than switching to that tab --
// the shared shape behind every closable sub-tab in the Tables panel (gProfiler/Reactome within
// Enrichment, Gemini within Node Set Annotation, one per node within Neighbors of). Pulled out
// once the same v-tab-plus-mdi-close markup started showing up in three different result panels.
export default {
  name: 'ClosableTab',
  props: {
    value: { type: [String, Number], required: true },
  },
  emits: ['close'],
};
</script>
