<template>
  <v-card outlined class="mt-4 enrichment-results-panel">
    <v-tabs :model-value="tab" color="primary-darken-1" @update:model-value="$emit('update:tab', $event)">
      <v-tab v-if="!gprofilerSubTabDismissed" value="enrichment">
        gProfiler
        <v-icon size="16" class="ml-2" @click.stop="$emit('close-tab', 'gprofiler')">mdi-close</v-icon>
      </v-tab>
      <v-tab v-if="!reactomeSubTabDismissed" value="reactomeEnrichment">
        Reactome
        <v-icon size="16" class="ml-2" @click.stop="$emit('close-tab', 'reactome')">mdi-close</v-icon>
      </v-tab>
    </v-tabs>
    <div class="pa-4">
      <!-- Each v-window-item owns its own loading state (via DownloadableDataTable's
           :loading), so a run in progress only ever shows a loading placeholder inside
           its own tab -- switching to an already-finished tab is never blocked by it. -->
      <v-window :model-value="tab">
        <v-window-item value="enrichment">
          <p v-if="!enrichmentRan && !enrichmentLoading" class="text-caption text-medium-emphasis">
            No gProfiler enrichment performed for the currently selected nodes.
          </p>
          <GProfilerResultsTable v-else :items="enrichmentResults" :loading="enrichmentLoading" />
        </v-window-item>
        <v-window-item value="reactomeEnrichment">
          <p v-if="!reactomeEnrichmentRan && !reactomeEnrichmentLoading" class="text-caption text-medium-emphasis">
            No Reactome enrichment performed for the currently selected nodes.
          </p>
          <ReactomeResultsTable v-else :results="reactomeEnrichmentResults" :loading="reactomeEnrichmentLoading" />
        </v-window-item>
      </v-window>
    </div>
  </v-card>
</template>

<script>
// Per-node/subset enrichment results (gProfiler, Reactome) for whatever is currently selected --
// embedded as the "Enrichment" tab of NetworkTablesPanel. Unlike the top-level tabs (always
// shown, not closable), these two sub-tabs are each individually closable -- closing one just
// hides it (gprofilerSubTabDismissed/reactomeSubTabDismissed, owned by data-network.vue) until
// that method is run again. Purely presentational/controlled: data-network.vue owns all the
// state and run-methods, this only renders it and reports tab/close changes back. Community
// Annotation lives in its own component/tab (CommunityAnnotationPanel.vue), and Gemini's
// node-set label lives in its own tab too (NodeSetAnnotationResultsPanel.vue) -- enrichment
// (gProfiler/Reactome) and node-set annotation (Gemini) are conceptually distinct.
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
    gprofilerSubTabDismissed: { type: Boolean, default: false },

    reactomeEnrichmentRan: { type: Boolean, default: false },
    reactomeEnrichmentResults: { type: Array, default: () => [] },
    reactomeEnrichmentLoading: { type: Boolean, default: false },
    reactomeSubTabDismissed: { type: Boolean, default: false },
  },
  emits: ['update:tab', 'close-tab'],
};
</script>
