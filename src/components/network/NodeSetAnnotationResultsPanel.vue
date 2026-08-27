<template>
  <div class="node-set-annotation-results-panel">
    <v-tabs :model-value="tab" color="primary-darken-1" @update:model-value="$emit('update:tab', $event)">
      <v-tab v-if="!geminiSubTabDismissed" value="gemini">
        Gemini
        <v-icon size="16" class="ml-2" @click.stop="$emit('close-tab', 'gemini')">mdi-close</v-icon>
      </v-tab>
    </v-tabs>
    <div class="pa-4">
      <v-window :model-value="tab">
        <v-window-item value="gemini">
          <div v-if="geminiLoading" class="d-flex align-center">
            <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-3"></v-progress-circular>
            <span class="text-caption text-medium-emphasis">Generating label...</span>
          </div>
          <div v-else-if="geminiLabel">
            <div class="text-subtitle-1 font-weight-medium">{{ geminiLabel.label }}</div>
            <p class="text-caption text-medium-emphasis">{{ geminiLabel.rationale }}</p>
          </div>
          <p v-else class="text-caption text-medium-emphasis">
            No Gemini label generated for the currently selected nodes.
          </p>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script>
// Per-selection "Node Set Annotation" results -- its own top-level tab in NetworkTablesPanel,
// split out of EnrichmentResultsPanel/"Enrichment" since Gemini's node-set annotation is
// conceptually distinct from g:Profiler/Reactome pathway enrichment. Structured the same way as
// EnrichmentResultsPanel (a v-tabs/v-window with one sub-tab per method, each individually
// closable) even though there's only one method (Gemini) today, so another node-set annotation
// method can be added the same way g:Profiler/Reactome sit side by side in the Enrichment tab.
// Purely presentational/controlled: data-network.vue owns the state.
export default {
  name: 'NodeSetAnnotationResultsPanel',
  props: {
    tab: { type: String, default: 'gemini' },

    geminiLabel: { type: Object, default: null },
    geminiLoading: { type: Boolean, default: false },
    geminiSubTabDismissed: { type: Boolean, default: false },
  },
  emits: ['update:tab', 'close-tab'],
};
</script>
