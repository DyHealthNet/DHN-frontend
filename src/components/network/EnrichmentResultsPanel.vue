<template>
  <div class="enrichment-results-panel">
    <v-tabs :model-value="tab" color="primary-darken-1" @update:model-value="$emit('update:tab', $event)">
      <v-tab v-if="enrichmentRan || enrichmentLoading" value="enrichment">Subset Protein Enrichment</v-tab>
      <v-tab v-if="reactomeEnrichmentRan || reactomeEnrichmentLoading" value="reactomeEnrichment">Subset Reactome Enrichment</v-tab>
    </v-tabs>
    <div class="pa-4">
      <p v-if="!hasAnyResult" class="text-caption text-medium-emphasis">
        Run Protein Enrichment or Reactome Enrichment from the Analysis panel to see results here.
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
      </v-window>
    </div>
  </div>
</template>

<script>
// Per-node/subset enrichment results (Protein, Reactome) for whatever is currently selected --
// embedded as the "Enrichment" tab of NetworkTablesPanel. Purely presentational/controlled:
// data-network.vue owns all the state and run-methods, this only renders it and reports tab
// changes back. Community Annotation lives in its own component/tab (CommunityAnnotationPanel.vue),
// and Gemini's node-set label lives in its own tab too (NodeSetAnnotationResultsPanel.vue) --
// enrichment (g:Profiler/Reactome) and node-set annotation (Gemini) are conceptually distinct.
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
  },
  emits: ['update:tab'],
  computed: {
    hasAnyResult() {
      return this.enrichmentRan || this.enrichmentLoading
        || this.reactomeEnrichmentRan || this.reactomeEnrichmentLoading;
    },
  },
};
</script>
