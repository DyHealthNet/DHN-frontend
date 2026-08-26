<template>
  <div class="enrichment-results-panel">
    <v-tabs :model-value="tab" color="primary-darken-1" @update:model-value="$emit('update:tab', $event)">
      <v-tab v-if="enrichmentRan || enrichmentLoading" value="enrichment">Subset Protein Enrichment</v-tab>
      <v-tab v-if="reactomeEnrichmentRan || reactomeEnrichmentLoading" value="reactomeEnrichment">Subset Reactome Enrichment</v-tab>
      <v-tab v-if="geminiRan || geminiLoading" value="gemini">Subset Gemini Label</v-tab>
    </v-tabs>
    <div class="pa-4">
      <p v-if="!hasAnyResult" class="text-caption text-medium-emphasis">
        Run Protein Enrichment, Reactome Enrichment, or Gemini Label from the Analysis panel to see results here.
      </p>
      <!-- Each v-window-item owns its own loading state (via DownloadableDataTable's
           :loading), so a run in progress only ever shows a loading placeholder inside
           its own tab -- switching to an already-finished tab is never blocked by it. -->
      <v-window v-else :model-value="tab">
        <v-window-item value="enrichment">
          <GProfilerResultsTable :items="enrichmentResults" :loading="enrichmentLoading" />
        </v-window-item>
        <v-window-item value="reactomeEnrichment">
          <ReactomeResultsTable :results="reactomeEnrichmentResults" :loading="reactomeEnrichmentLoading" />
        </v-window-item>
        <v-window-item value="gemini">
          <div v-if="geminiLoading" class="d-flex align-center mt-4">
            <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-3"></v-progress-circular>
            <span class="text-caption text-medium-emphasis">Generating label...</span>
          </div>
          <div v-else-if="geminiLabel" class="mt-4">
            <div class="text-subtitle-1 font-weight-medium">{{ geminiLabel.label }}</div>
            <p class="text-caption text-medium-emphasis">{{ geminiLabel.rationale }}</p>
          </div>
          <p v-else class="text-caption text-medium-emphasis mt-4">
            No label returned.
          </p>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script>
// Per-node/subset enrichment results (Protein, Reactome, Gemini label) for whatever is
// currently selected -- embedded as the "Enrichments" tab of NetworkTablesPanel. Purely
// presentational/controlled: data-network.vue owns all the state and run-methods, this
// only renders it and reports tab changes back. Community Annotation used to be a fourth
// tab here but now lives in its own component/tab -- see CommunityAnnotationPanel.vue.
import GProfilerResultsTable from '@/components/network/GProfilerResultsTable.vue';
import ReactomeResultsTable from '@/components/network/ReactomeResultsTable.vue';

export default {
  name: 'EnrichmentResultsPanel',
  components: { GProfilerResultsTable, ReactomeResultsTable },
  props: {
    tab: { type: String, default: 'enrichment' },

    enrichmentRan: { type: Boolean, default: false },
    enrichmentResults: { type: Array, default: () => [] },
    enrichmentLoading: { type: Boolean, default: false },

    reactomeEnrichmentRan: { type: Boolean, default: false },
    reactomeEnrichmentResults: { type: Array, default: () => [] },
    reactomeEnrichmentLoading: { type: Boolean, default: false },

    geminiRan: { type: Boolean, default: false },
    geminiLabel: { type: Object, default: null },
    geminiLoading: { type: Boolean, default: false },
  },
  emits: ['update:tab'],
  computed: {
    hasAnyResult() {
      return this.enrichmentRan || this.enrichmentLoading
        || this.reactomeEnrichmentRan || this.reactomeEnrichmentLoading
        || this.geminiRan || this.geminiLoading;
    },
  },
};
</script>
