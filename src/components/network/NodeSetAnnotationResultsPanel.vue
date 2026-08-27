<template>
  <div class="pa-4">
    <div v-if="geminiLoading" class="d-flex align-center">
      <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-3"></v-progress-circular>
      <span class="text-caption text-medium-emphasis">Generating label...</span>
    </div>
    <div v-else-if="geminiLabel">
      <div class="text-subtitle-1 font-weight-medium">{{ geminiLabel.label }}</div>
      <p class="text-caption text-medium-emphasis">{{ geminiLabel.rationale }}</p>
    </div>
    <p v-else class="text-caption text-medium-emphasis">
      No label returned.
    </p>
  </div>
</template>

<script>
// Per-selection "Node Set Annotation" results (currently just Gemini's proposed label) -- its
// own top-level tab in NetworkTablesPanel, split out of EnrichmentResultsPanel/"Enrichments"
// since Gemini's node-set annotation is conceptually distinct from g:Profiler/Reactome pathway
// enrichment. Purely presentational/controlled: data-network.vue owns the state.
export default {
  name: 'NodeSetAnnotationResultsPanel',
  props: {
    geminiLabel: { type: Object, default: null },
    geminiLoading: { type: Boolean, default: false },
  },
};
</script>
