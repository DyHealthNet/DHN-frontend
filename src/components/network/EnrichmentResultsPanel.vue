<template>
  <v-card outlined class="mt-4 enrichment-results-panel">
    <v-tabs :model-value="tab" color="primary-darken-1" @update:model-value="$emit('update:tab', $event)">
      <ClosableTab v-if="(enrichmentRan || enrichmentLoading) && !gprofilerSubTabDismissed" value="enrichment" @close="$emit('close-tab', 'gprofiler')">
        gProfiler
      </ClosableTab>
      <ClosableTab v-if="(reactomeEnrichmentRan || reactomeEnrichmentLoading) && !reactomeSubTabDismissed" value="reactomeEnrichment" @close="$emit('close-tab', 'reactome')">
        Reactome
      </ClosableTab>
    </v-tabs>
    <div class="pa-4">
      <p v-if="!hasAnyResult" class="text-caption text-medium-emphasis">
        Perform an enrichment from the Analysis panel to see results here.
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
  </v-card>
</template>

<script>
// Per-node/subset enrichment results (gProfiler, Reactome) for whatever is currently selected --
// embedded as the "Enrichment" tab of NetworkTablesPanel. Unlike the top-level tab (always
// shown, not closable), these two sub-tabs only appear once that method has actually been run
// (or is running), and each is individually closable from then on -- closing one just hides it
// (gprofilerSubTabDismissed/reactomeSubTabDismissed, owned by data-network.vue) until that
// method is run again, at which point the run-method resets its own dismissed flag. Purely
// presentational/controlled: data-network.vue owns all the state and run-methods, this only
// renders it and reports tab/close changes back. Community Annotation lives in its own
// component/tab (CommunityAnnotationPanel.vue), and Gemini's node-set label lives in its own tab
// too (NodeSetAnnotationResultsPanel.vue) -- enrichment (gProfiler/Reactome) and node-set
// annotation (Gemini) are conceptually distinct.
import ClosableTab from '@/components/network/ClosableTab.vue';
import GProfilerResultsTable from '@/components/network/GProfilerResultsTable.vue';
import ReactomeResultsTable from '@/components/network/ReactomeResultsTable.vue';

export default {
  name: 'EnrichmentResultsPanel',
  components: { ClosableTab, GProfilerResultsTable, ReactomeResultsTable },
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
  computed: {
    hasAnyResult() {
      return ((this.enrichmentRan || this.enrichmentLoading) && !this.gprofilerSubTabDismissed)
        || ((this.reactomeEnrichmentRan || this.reactomeEnrichmentLoading) && !this.reactomeSubTabDismissed);
    },
  },
};
</script>
