<template>
  <div class="analysis-panel">
    <p class="text-subtitle-2">Community</p>
    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-tooltip :disabled="!clusteringDisabled" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps">
            <v-btn
              :color="clusteringActive ? 'primary' : 'primary-darken-1'"
              :variant="clusteringActive ? 'flat' : 'outlined'"
              :loading="isClusteringLoading"
              :disabled="clusteringDisabled"
              @click="clusteringDialogOpen = true"
            >Clustering</v-btn>
          </span>
        </template>
        {{ clusteringDisabledReason }}
      </v-tooltip>

      <v-tooltip :disabled="!communityAnnotationDisabled" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps">
            <v-btn
              color="primary-darken-1"
              variant="outlined"
              :loading="communityAnnotationStatus === 'running'"
              :disabled="communityAnnotationDisabled"
              @click="communityAnnotationDialogOpen = true"
            >Annotation</v-btn>
          </span>
        </template>
        {{ communityAnnotationDisabledReason }}
      </v-tooltip>
    </div>

    <p class="text-subtitle-2">Enrichments</p>
    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-tooltip :disabled="!gprofilerDisabled" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps">
            <v-btn
              color="primary-darken-1"
              variant="outlined"
              :loading="enrichmentLoading"
              :disabled="gprofilerDisabled"
              @click="gprofilerDialogOpen = true"
            >g:Profiler</v-btn>
          </span>
        </template>
        {{ gprofilerDisabledReason }}
      </v-tooltip>

      <v-tooltip :disabled="!reactomeRunDisabled" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps">
            <v-btn
              color="primary-darken-1"
              variant="outlined"
              :loading="reactomeEnrichmentLoading"
              :disabled="reactomeRunDisabled"
              @click="reactomeDialogOpen = true"
            >Reactome</v-btn>
          </span>
        </template>
        {{ reactomeDisabledReason }}
      </v-tooltip>
    </div>

    <p class="text-subtitle-2">Node Set Annotation</p>
    <div class="d-flex flex-wrap ga-2 mb-2">
      <v-tooltip :disabled="!geminiDisabled" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps">
            <v-btn
              color="primary-darken-1"
              variant="outlined"
              :loading="geminiLoading"
              :disabled="geminiDisabled"
              @click="geminiDialogOpen = true"
            >Gemini</v-btn>
          </span>
        </template>
        {{ geminiDisabledReason }}
      </v-tooltip>
    </div>

    <!-- Community Detection / Clustering -->
    <AnalysisDialog v-model="clusteringDialogOpen" title="Community Detection">
      <v-select
        :model-value="selectedAlgorithm"
        @update:model-value="$emit('update:selectedAlgorithm', $event)"
        :items="communityAlgorithms"
        item-title="label"
        item-value="value"
        label="Algorithm"
        density="compact"
        variant="outlined"
        class="mt-2"
        :disabled="isClusteringLoading"
      ></v-select>
      <p class="text-caption text-medium-emphasis mt-n2 mb-2">
        {{ algorithmDescription }}
      </p>
      <v-btn
        color="primary-darken-1"
        block
        class="mt-2"
        :loading="isClusteringLoading"
        :disabled="isClusteringLoading"
        @click="$emit('run-clustering'); clusteringDialogOpen = false;"
      >{{ clusteringActive ? `Re-run ${selectedAlgorithmLabel} Clustering` : `Run ${selectedAlgorithmLabel} Clustering` }}</v-btn>

      <template v-if="clusteringActive">
        <v-btn
          class="mt-2"
          variant="outlined"
          block
          @click="$emit('reset-clustering-colors'); clusteringDialogOpen = false;"
        >Reset to Node Type Colors</v-btn>

        <div class="mt-4">
          <template v-if="algorithmUsesResolution">
            <label class="text-caption">Leiden resolution: {{ leidenResolutions[resolutionIndex] }}</label>
            <v-slider
              :model-value="resolutionIndex"
              @update:model-value="$emit('update:resolutionIndex', $event)"
              :min="0"
              :max="leidenResolutions.length - 1"
              :step="1"
              show-ticks="always"
              thumb-label="always"
              density="compact"
              color="primary"
            >
              <template #thumb-label>{{ leidenResolutions[resolutionIndex] }}</template>
            </v-slider>
            <p class="text-caption text-medium-emphasis">
              {{ includedNodeTypesCount }} communities at this resolution. Higher values produce more communities.
            </p>
          </template>
          <p v-if="currentModularity != null" class="text-caption text-medium-emphasis">
            Modularity: {{ currentModularity.toFixed(3) }} · Conductance: {{ currentConductance.toFixed(3) }}
          </p>

          <!-- <v-divider class="my-4"></v-divider>
          <p class="text-caption text-medium-emphasis mb-2">
            Scores the current clustering's biological coherence via DIGEST, against
            random background partitions of the same size. Only one node type can be
            scored per run.
          </p>
          <v-select
            v-model="scoreClusteringNodeGroup"
            :items="scoreClusteringNodeGroups"
            label="Node type to score"
            density="compact"
            variant="outlined"
            :disabled="scoreClusteringStatus === 'running'"
          ></v-select>
          <v-select
            v-model="scoreClusteringType"
            :items="scoreClusteringTypeOptions"
            item-title="title"
            item-value="value"
            label="Category"
            density="compact"
            variant="outlined"
            :disabled="scoreClusteringStatus === 'running'"
          ></v-select>
          <v-select
            v-model="scoreClusteringTarId"
            :items="scoreClusteringTarIdOptions"
            item-title="title"
            item-value="value"
            label="Identifier scheme"
            density="compact"
            variant="outlined"
            :disabled="scoreClusteringStatus === 'running'"
          ></v-select>
          <v-btn
            block
            color="primary"
            variant="outlined"
            :loading="scoreClusteringStatus === 'running'"
            :disabled="scoreClusteringStatus === 'running' || !scoreClusteringNodeGroup || !scoreClusteringTarId"
            @click="runScoreClustering"
          >{{ scoreClusteringStatus === 'success' ? 'Re-score Clustering' : 'Score Clustering' }}</v-btn>

          <div v-if="scoreClusteringStatus === 'success' && scoreClusteringResult" class="mt-3">
            <v-table density="compact">
              <thead>
                <tr><th>Metric</th><th>Value</th><th>p-value</th></tr>
              </thead>
              <tbody>
                <tr v-for="metric in ['DI-based', 'SS-based', 'DBI-based']" :key="metric">
                  <td>{{ metric }}</td>
                  <td>{{ formatScoreValue(scoreClusteringResult.input_values?.values?.[metric]) }}</td>
                  <td>{{ formatScoreValue(scoreClusteringResult.p_values?.values?.[metric]) }}</td>
                </tr>
              </tbody>
            </v-table>
            <p class="text-caption text-medium-emphasis mt-2">
              DBI-based is better when lower; DI-based and SS-based are better when
              higher. Scored {{ scoreClusteringResult.coverage?.scoredNodeCount }} of
              {{ scoreClusteringResult.coverage?.inputNodeCount }} clustered nodes
              ({{ scoreClusteringResult.coverage?.nodeGroup }} via
              {{ scoreClusteringResult.coverage?.tarId }}).
            </p>
          </div>
          NOTE: this DIGEST "Score Clustering" UI was already commented out before the Analysis
          panel was restructured into buttons+popups (see AnalysisPanel.vue) -- carried over as-is,
          still unwired, in case it's finished later. The backing state/methods
          (scoreClustering*, runScoreClustering, pollScoreClusteringStatus,
          resumeScoreClusteringIfNeeded, resetScoreClustering, formatScoreValue) still live in
          data-network.vue. -->
        </div>
      </template>
    </AnalysisDialog>

    <!-- Community Annotation -->
    <AnalysisDialog v-model="communityAnnotationDialogOpen" title="Community Annotation">
      <p class="text-caption text-medium-emphasis">
        Runs g:Profiler enrichment, Reactome enrichment, and a Gemini-generated rationale for
        every community at the current resolution. Runs as a background job and can take a few
        minutes -- results appear in the "Node Ranking" tables' Community Annotation tab as they
        come in.
      </p>
      <v-btn
        color="primary-darken-1"
        block
        class="mt-2"
        :loading="communityAnnotationStatus === 'running'"
        :disabled="communityAnnotationDisabled || communityAnnotationStatus === 'running'"
        @click="$emit('run-community-annotation'); communityAnnotationDialogOpen = false;"
      >{{ communityAnnotationStatus === 'success' ? 'Re-run Community Annotation' : 'Run Community Annotation' }}</v-btn>
    </AnalysisDialog>

    <!-- g:Profiler Enrichment -->
    <AnalysisDialog v-model="gprofilerDialogOpen" title="Protein Enrichment (g:Profiler)">
      <p class="text-caption text-medium-emphasis">
        Functional enrichment of the {{ selectedProteinCount }} selected protein(s), via <a href="https://biit.cs.ut.ee/gprofiler/gost" target="_blank" rel="noopener">g:Profiler</a>.
      </p>
      <v-btn
        color="primary-darken-1"
        block
        class="mt-2"
        :loading="enrichmentLoading"
        @click="$emit('run-gprofiler-enrichment'); gprofilerDialogOpen = false;"
      >Run Enrichment</v-btn>
    </AnalysisDialog>

    <!-- Reactome Enrichment -->
    <AnalysisDialog v-model="reactomeDialogOpen" title="Reactome Enrichment">
      <p class="text-caption text-medium-emphasis">
        Joint pathway over-representation of {{ selectedProteinCount }} protein(s) and
        {{ selectedMetaboliteMappedCount }} metabolite(s), via <a href="https://reactome.org/PathwayBrowser/#/ANALYSIS" target="_blank" rel="noopener">Reactome</a>.
      </p>
      <p v-if="selectedMetabolitesWithoutChebiCount && !reactomeEnrichmentRan" class="text-caption text-medium-emphasis">
        {{ selectedMetabolitesWithoutChebiCount }} selected metabolite(s) have no stored ChEBI cross-reference yet -- they'll be
        mapped live via <a href="https://www.ebi.ac.uk/unichem/" target="_blank" rel="noopener">UniChem</a> when you run enrichment.
      </p>
      <p v-if="reactomeUnmappedMetaboliteNames.length" class="text-caption text-medium-emphasis">
        {{ reactomeUnmappedMetaboliteNames.length }} selected metabolite(s) could not be mapped to a ChEBI id and were excluded:
        {{ reactomeUnmappedMetaboliteNames.join(', ') }}
      </p>
      <v-btn
        color="primary-darken-1"
        block
        class="mt-2"
        :loading="reactomeEnrichmentLoading"
        @click="$emit('run-reactome-enrichment'); reactomeDialogOpen = false;"
      >Run Enrichment</v-btn>
    </AnalysisDialog>

    <!-- Gemini Label -->
    <AnalysisDialog v-model="geminiDialogOpen" title="Gemini Label">
      <p class="text-caption text-medium-emphasis">
        Ask Gemini to propose a label for the {{ selectedNodeCount }} selected node(s), based on their
        name, group/subgroup, and description.
      </p>
      <v-btn
        color="primary-darken-1"
        block
        class="mt-2"
        :loading="geminiLoading"
        @click="$emit('run-gemini-label'); geminiDialogOpen = false;"
      >Get Gemini Label</v-btn>
    </AnalysisDialog>
  </div>
</template>

<script>
// Button-grid front-end for the Analysis expansion panel -- every functionality (Community
// Detection/Annotation, g:Profiler/Reactome enrichment, Gemini labeling) is always shown as a
// button, greyed out with an explanatory hover tooltip when its preconditions aren't met, rather
// than whole sections appearing/disappearing as selection changes. Clicking a button opens a
// small popup (AnalysisDialog) with that functionality's actual form/description/run button --
// running it emits back up to data-network.vue (which owns all the state/run-methods, same as
// before) and closes the popup immediately, same as the old inline buttons did. Replaces the old
// inline Community Detection markup and NodeSetActionsPanel.vue.
import AnalysisDialog from '@/components/AnalysisDialog.vue';

export default {
  name: 'AnalysisPanel',
  components: { AnalysisDialog },
  props: {
    lastNetworkMode: { type: String, default: null },

    selectedAlgorithm: { type: String, default: 'leiden' },
    communityAlgorithms: { type: Array, default: () => [] },
    algorithmDescription: { type: String, default: '' },
    algorithmUsesResolution: { type: Boolean, default: false },
    isClusteringLoading: { type: Boolean, default: false },
    clusteringActive: { type: Boolean, default: false },
    leidenResolutions: { type: Array, default: () => [] },
    resolutionIndex: { type: Number, default: 0 },
    currentModularity: { type: Number, default: null },
    currentConductance: { type: Number, default: null },
    includedNodeTypesCount: { type: Number, default: 0 },
    legendGroupsCount: { type: Number, default: 0 },

    communityAnnotationStatus: { type: String, default: 'idle' },

    selectedNodeCount: { type: Number, default: 0 },
    hasSelectedProtein: { type: Boolean, default: false },
    hasSelectedMetabolite: { type: Boolean, default: false },
    selectedProteinCount: { type: Number, default: 0 },
    selectedMetaboliteMappedCount: { type: Number, default: 0 },
    selectedMetabolitesWithoutChebiCount: { type: Number, default: 0 },
    reactomeUnmappedMetaboliteNames: { type: Array, default: () => [] },
    reactomeRunDisabled: { type: Boolean, default: false },
    reactomeEnrichmentRan: { type: Boolean, default: false },

    geminiLoading: { type: Boolean, default: false },
    enrichmentLoading: { type: Boolean, default: false },
    reactomeEnrichmentLoading: { type: Boolean, default: false },
  },
  emits: [
    'update:selectedAlgorithm',
    'update:resolutionIndex',
    'run-clustering',
    'reset-clustering-colors',
    'run-community-annotation',
    'run-gprofiler-enrichment',
    'run-reactome-enrichment',
    'run-gemini-label',
  ],
  data() {
    return {
      clusteringDialogOpen: false,
      communityAnnotationDialogOpen: false,
      gprofilerDialogOpen: false,
      reactomeDialogOpen: false,
      geminiDialogOpen: false,
    };
  },
  computed: {
    selectedAlgorithmLabel() {
      return this.communityAlgorithms.find((algo) => algo.value === this.selectedAlgorithm)?.label ?? this.selectedAlgorithm;
    },
    clusteringDisabled() {
      return this.lastNetworkMode !== 'whole';
    },
    clusteringDisabledReason() {
      return "Only available once you've sent the whole network above (\"Send Whole Network\") -- it isn't supported for node-set-built subnetworks.";
    },
    communityAnnotationDisabled() {
      return this.legendGroupsCount === 0;
    },
    communityAnnotationDisabledReason() {
      return 'Run Community Detection (Clustering) first -- annotation is generated per community.';
    },
    gprofilerDisabled() {
      return !this.hasSelectedProtein;
    },
    gprofilerDisabledReason() {
      return 'Select at least one protein node on the network to run functional enrichment.';
    },
    reactomeDisabledReason() {
      return 'Select at least one protein or metabolite node on the network to run pathway enrichment.';
    },
    geminiDisabled() {
      return this.selectedNodeCount === 0;
    },
    geminiDisabledReason() {
      return 'Select a set of nodes on the network to ask Gemini for a label.';
    },
  },
};
</script>
