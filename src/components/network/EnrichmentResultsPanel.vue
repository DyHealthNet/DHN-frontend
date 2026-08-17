<template>
  <v-card v-if="open" outlined class="mt-4 enrichment-results-panel">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary-darken-1" class="mr-2">mdi-table-large</v-icon>
      Results
      <v-spacer></v-spacer>
      <v-btn icon variant="text" @click="$emit('update:open', false)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-tabs :model-value="tab" color="primary-darken-1" @update:model-value="$emit('update:tab', $event)">
      <v-tab v-if="enrichmentRan || enrichmentLoading" value="enrichment">Subset Protein Enrichment</v-tab>
      <v-tab v-if="reactomeEnrichmentRan || reactomeEnrichmentLoading" value="reactomeEnrichment">Subset Reactome Enrichment</v-tab>
      <v-tab v-if="geminiRan || geminiLoading" value="gemini">Subset Gemini Label</v-tab>
      <v-tab v-if="communityAnnotationAvailable" value="communityAnnotation">Community Annotation</v-tab>
    </v-tabs>
    <v-card-text>
      <!-- Each v-window-item owns its own loading state (via DownloadableDataTable's
           :loading), so a run in progress only ever shows a loading placeholder inside
           its own tab -- switching to an already-finished tab is never blocked by it. -->
      <v-window :model-value="tab">
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
        <v-window-item value="communityAnnotation">
          <div v-if="communityAnnotationStatus === 'running'" class="mt-4">
            <div class="d-flex align-center mb-2">
              <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-3"></v-progress-circular>
              <span class="text-caption text-medium-emphasis">{{ communityAnnotationProgressText }}</span>
            </div>
            <v-progress-linear
              v-if="communityAnnotationProgress && communityAnnotationProgress.total"
              :model-value="(communityAnnotationProgress.completed / communityAnnotationProgress.total) * 100"
              color="primary"
              height="6"
              rounded
            ></v-progress-linear>
          </div>
          <div v-else-if="communityAnnotationStatus === 'success'" class="mt-4">
            <v-btn color="primary" variant="outlined" class="mb-4" @click="$emit('run-community-annotation')">
              Re-run Community Annotation
            </v-btn>
            <p v-if="!communityAnnotationCommunityIds.length" class="text-caption text-medium-emphasis">
              No community annotation results returned.
            </p>
            <v-expansion-panels v-else variant="accordion">
              <v-expansion-panel v-for="communityId in communityAnnotationCommunityIds" :key="communityId">
                <v-expansion-panel-title>
                  <div>
                    <div class="text-subtitle-2">
                      Community {{ communityId }} ({{ communityAnnotationResults[communityId].node_count }} nodes)<template v-if="communityAnnotationResults[communityId].label"> &mdash; {{ communityAnnotationResults[communityId].label }}</template>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      <template v-if="topGProfilerTerm(communityId)">Top term: {{ topGProfilerTerm(communityId).name }}</template>
                      <template v-if="topReactomePathway(communityId)"><span v-if="topGProfilerTerm(communityId)"> &middot; </span>Top pathway: {{ topReactomePathway(communityId).name }}</template>
                      <template v-if="!topGProfilerTerm(communityId) && !topReactomePathway(communityId)">No significant enrichment found.</template>
                    </div>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p v-if="communityAnnotationResults[communityId].rationale" class="text-caption text-medium-emphasis">
                    {{ communityAnnotationResults[communityId].rationale }}
                  </p>
                  <div class="text-subtitle-2 mt-2">g:Profiler (top 20)</div>
                  <GProfilerResultsTable
                    :items="communityAnnotationResults[communityId].gprofiler"
                    :filename="`community-${communityId}-gprofiler.csv`"
                  />
                  <div class="text-subtitle-2 mt-4">Reactome (top 20)</div>
                  <ReactomeResultsTable
                    :results="communityAnnotationResults[communityId].reactome"
                    :filename="`community-${communityId}-reactome.csv`"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          <div v-else class="mt-4">
            <p class="text-caption text-medium-emphasis">
              Runs g:Profiler and Reactome enrichment, then a single Gemini call grounded in those
              results, for every community at the active resolution. This can take a few minutes.
            </p>
            <v-btn color="primary" variant="outlined" class="mt-2" @click="$emit('run-community-annotation')">
              Run Community Annotation
            </v-btn>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script>
// Full-width results panel shown below the network view once a Protein
// Enrichment (g:Profiler), Reactome Enrichment, Gemini Label, or Community Annotation
// action has been run from the Analysis panel -- pulled out of data-network.vue so
// that already-large file doesn't grow further with result-table markup.
// Purely presentational/controlled: data-network.vue owns all the state
// and run-methods, this only renders it and reports open/tab changes back.
import GProfilerResultsTable from '@/components/network/GProfilerResultsTable.vue';
import ReactomeResultsTable from '@/components/network/ReactomeResultsTable.vue';

export default {
  name: 'EnrichmentResultsPanel',
  components: { GProfilerResultsTable, ReactomeResultsTable },
  props: {
    open: { type: Boolean, default: false },
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

    // Community Annotation: g:Profiler + Reactome + Gemini for every community at the active
    // resolution, run as a background job (see data-network.vue's runCommunityAnnotation).
    // Unlike the three tabs above, this isn't gated on a node selection -- it's available
    // whenever a clustering run exists.
    communityAnnotationAvailable: { type: Boolean, default: false },
    communityAnnotationStatus: { type: String, default: 'idle' }, // 'idle' | 'running' | 'success'
    communityAnnotationProgress: { type: Object, default: null }, // {stage, completed, total}
    communityAnnotationResults: { type: Object, default: () => ({}) },
  },
  emits: ['update:open', 'update:tab', 'run-community-annotation'],
  computed: {
    communityAnnotationProgressText() {
      const progress = this.communityAnnotationProgress;
      if (!progress) return 'Starting...';
      if (progress.stage === 'gprofiler') return 'Running g:Profiler enrichment...';
      if (progress.stage === 'reactome') return `Reactome enrichment: ${progress.completed} / ${progress.total} communities`;
      if (progress.stage === 'gemini') return 'Generating Gemini labels...';
      return 'Running...';
    },
    // Numeric-aware sort (so "Community 2" comes before "Community 14") -- community ids are
    // plain numeric strings ("0", "1", ...) but object key order isn't guaranteed to reflect
    // that.
    communityAnnotationCommunityIds() {
      return Object.keys(this.communityAnnotationResults).sort((a, b) => {
        const [numA, numB] = [Number(a), Number(b)];
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
    },
  },
  methods: {
    topGProfilerTerm(communityId) {
      return this.communityAnnotationResults[communityId]?.gprofiler?.[0] ?? null;
    },
    topReactomePathway(communityId) {
      return this.communityAnnotationResults[communityId]?.reactome?.[0] ?? null;
    },
  },
};
</script>
