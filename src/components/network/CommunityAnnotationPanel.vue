<template>
  <div class="community-annotation-panel pa-4">
    <div v-if="status === 'running'">
      <div class="d-flex align-center mb-2">
        <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-3"></v-progress-circular>
        <span class="text-caption text-medium-emphasis">{{ progressText }}</span>
      </div>
      <v-progress-linear
        v-if="progress && progress.total"
        :model-value="(progress.completed / progress.total) * 100"
        color="primary"
        height="6"
        rounded
      ></v-progress-linear>
    </div>
    <div v-else-if="status === 'success'">
      <p v-if="!communityIds.length" class="text-caption text-medium-emphasis">
        No community annotation results returned.
      </p>
      <v-expansion-panels v-else variant="accordion">
        <v-expansion-panel v-for="communityId in communityIds" :key="communityId">
          <v-expansion-panel-title>
            <div>
              <div class="text-subtitle-2">
                Community {{ communityId }} ({{ results[communityId].node_count }} nodes)<template v-if="results[communityId].label"> &mdash; {{ results[communityId].label }}</template>
              </div>
              <div class="text-caption text-medium-emphasis">
                <template v-if="topGProfilerTerm(communityId)">Top term: {{ topGProfilerTerm(communityId).name }}</template>
                <template v-if="topReactomePathway(communityId)"><span v-if="topGProfilerTerm(communityId)"> &middot; </span>Top pathway: {{ topReactomePathway(communityId).name }}</template>
                <template v-if="!topGProfilerTerm(communityId) && !topReactomePathway(communityId)">No significant enrichment found.</template>
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p v-if="results[communityId].rationale" class="text-caption text-medium-emphasis">
              {{ results[communityId].rationale }}
            </p>
            <div class="text-subtitle-2 mt-2">g:Profiler (top 20)</div>
            <GProfilerResultsTable
              :items="results[communityId].gprofiler"
              :filename="`community-${communityId}-gprofiler.csv`"
            />
            <div class="text-subtitle-2 mt-4">Reactome (top 20)</div>
            <ReactomeResultsTable
              :results="results[communityId].reactome"
              :filename="`community-${communityId}-reactome.csv`"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <div v-else>
      <p class="text-caption text-medium-emphasis">
        Run Community Annotation from the Analysis panel to see results here -- it scores
        g:Profiler and Reactome enrichment, then a single Gemini call grounded in those results,
        for every community at the active resolution. This can take a few minutes.
      </p>
    </div>
  </div>
</template>

<script>
// Community Annotation results (g:Profiler + Reactome + Gemini per community, run as a
// background job -- see data-network.vue's runCommunityAnnotation), extracted out of
// EnrichmentResultsPanel.vue so it can live in its own Tables sub-tab instead of being
// bundled with the per-node enrichment results. Purely a results display -- triggering a run is
// only possible from the Analysis panel now (AnalysisPanel.vue's Community Annotation dialog).
import GProfilerResultsTable from '@/components/network/GProfilerResultsTable.vue';
import ReactomeResultsTable from '@/components/network/ReactomeResultsTable.vue';

export default {
  name: 'CommunityAnnotationPanel',
  components: { GProfilerResultsTable, ReactomeResultsTable },
  props: {
    status: { type: String, default: 'idle' }, // 'idle' | 'running' | 'success' | 'error'
    progress: { type: Object, default: null }, // {stage, completed, total}
    results: { type: Object, default: () => ({}) },
  },
  computed: {
    progressText() {
      const progress = this.progress;
      if (!progress) return 'Starting...';
      if (progress.stage === 'gprofiler') return 'Running g:Profiler enrichment...';
      if (progress.stage === 'reactome') return `Reactome enrichment: ${progress.completed} / ${progress.total} communities`;
      if (progress.stage === 'gemini') return 'Generating Gemini labels...';
      return 'Running...';
    },
    // Numeric-aware sort (so "Community 2" comes before "Community 14") -- community ids are
    // plain numeric strings ("0", "1", ...) but object key order isn't guaranteed to reflect
    // that.
    communityIds() {
      return Object.keys(this.results).sort((a, b) => {
        const [numA, numB] = [Number(a), Number(b)];
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
    },
  },
  methods: {
    topGProfilerTerm(communityId) {
      return this.results[communityId]?.gprofiler?.[0] ?? null;
    },
    topReactomePathway(communityId) {
      return this.results[communityId]?.reactome?.[0] ?? null;
    },
  },
};
</script>
