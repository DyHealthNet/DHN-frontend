<template>
  <div class="analysis-panel">
    <v-btn
      block
      class="mb-2"
      color="primary-darken-1"
      @click="communityDialogOpen = true"
    >Community Detection</v-btn>

    <v-btn
      block
      class="mb-2"
      color="primary-darken-1"
      @click="enrichmentsDialogOpen = true"
    >Enrichment</v-btn>

    <v-btn
      block
      color="primary-darken-1"
      @click="nodeSetAnnotationDialogOpen = true"
    >Node Set Annotation</v-btn>

    <!-- Community Detection (Clustering), with Community Annotation below it -->
    <AnalysisDialog v-model="communityDialogOpen" title="Community Detection">
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
        <p class="text-caption text-medium-emphasis mb-2">
          Higher values produce more, smaller communities.
          <template v-if="clusteringActive"> {{ includedNodeTypesCount }} communities at this resolution.</template>
        </p>
      </template>

      <p v-if="clusteringDisabled" class="text-caption text-medium-emphasis">
        {{ clusteringDisabledReason }}
      </p>

      <v-btn
        color="primary-darken-1"
        block
        class="mt-2"
        :loading="isClusteringLoading"
        :disabled="clusteringDisabled || isClusteringLoading"
        @click="$emit('run-clustering'); communityDialogOpen = false;"
      >Run Clustering</v-btn>

      <template v-if="clusteringActive">
        <v-btn
          class="mt-2"
          variant="outlined"
          block
          @click="$emit('reset-clustering-colors'); communityDialogOpen = false;"
        >Reset to Node Type Colors</v-btn>

        <p v-if="currentModularity != null" class="text-caption text-medium-emphasis mt-2">
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
      </template>

      <v-divider class="my-4"></v-divider>

      <p class="text-subtitle-2 mb-2">Community Annotation</p>
      <p class="text-caption text-medium-emphasis mb-2">
        Runs g:Profiler enrichment, Reactome enrichment, and a Gemini-generated rationale for
        every community at the active resolution. Runs as a background job and can take a few
        minutes.
      </p>
      <v-tooltip :disabled="!communityAnnotationDisabled" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps" class="d-block">
            <v-btn
              block
              :color="communityAnnotationStatus === 'success' ? 'primary' : 'primary-darken-1'"
              :class="{'grey lighten-2': communityAnnotationDisabled}"
              :loading="communityAnnotationStatus === 'running'"
              :disabled="communityAnnotationDisabled || communityAnnotationStatus === 'running'"
              @click="$emit('run-community-annotation'); communityDialogOpen = false;"
            >{{ communityAnnotationStatus === 'success' ? 'Re-run Community Annotation' : 'Run Community Annotation' }}</v-btn>
          </span>
        </template>
        {{ communityAnnotationDisabledReason }}
      </v-tooltip>
    </AnalysisDialog>

    <!-- Enrichment: g:Profiler / Reactome -->
    <AnalysisDialog v-model="enrichmentsDialogOpen" title="Enrichment">
      <v-select
        v-model="enrichmentMethod"
        :items="enrichmentMethodOptions"
        item-title="title"
        item-value="value"
        label="Enrichment"
        density="compact"
        variant="outlined"
      ></v-select>
      <p class="text-caption text-medium-emphasis mt-n2 mb-2">{{ enrichmentMethodDescription }}</p>

      <template v-if="enrichmentMethod === 'reactome'">
        <p v-if="selectedMetabolitesWithoutChebiCount && !reactomeEnrichmentRan" class="text-caption text-medium-emphasis">
          {{ selectedMetabolitesWithoutChebiCount }} selected metabolite(s) have no stored ChEBI cross-reference yet -- they'll be
          mapped live via <a href="https://www.ebi.ac.uk/unichem/" target="_blank" rel="noopener">UniChem</a> when you run enrichment.
        </p>
        <p v-if="reactomeUnmappedMetaboliteNames.length" class="text-caption text-medium-emphasis">
          {{ reactomeUnmappedMetaboliteNames.length }} selected metabolite(s) could not be mapped to a ChEBI id and were excluded:
          {{ reactomeUnmappedMetaboliteNames.join(', ') }}
        </p>
      </template>

      <v-tooltip :disabled="!enrichmentRunDisabled" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps" class="d-block">
            <v-btn
              color="primary-darken-1"
              block
              class="mt-2"
              :loading="enrichmentRunLoading"
              :disabled="enrichmentRunDisabled"
              @click="runEnrichment"
            >Run Enrichment</v-btn>
          </span>
        </template>
        {{ enrichmentRunDisabledReason }}
      </v-tooltip>
    </AnalysisDialog>

    <!-- Node Set Annotation: Gemini (only option today) -->
    <AnalysisDialog v-model="nodeSetAnnotationDialogOpen" title="Node Set Annotation">
      <v-select
        v-model="nodeSetAnnotationMethod"
        :items="nodeSetAnnotationMethodOptions"
        item-title="title"
        item-value="value"
        label="Method"
        density="compact"
        variant="outlined"
      ></v-select>
      <p class="text-caption text-medium-emphasis mt-n2 mb-2">{{ nodeSetAnnotationMethodDescription }}</p>

      <v-tooltip :disabled="!geminiDisabled" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps" class="d-block">
            <v-btn
              color="primary-darken-1"
              block
              class="mt-2"
              :loading="geminiLoading"
              :disabled="geminiDisabled"
              @click="$emit('run-gemini-label'); nodeSetAnnotationDialogOpen = false;"
            >Get Label</v-btn>
          </span>
        </template>
        {{ geminiDisabledReason }}
      </v-tooltip>
    </AnalysisDialog>
  </div>
</template>

<script>
// Button-grid front-end for the Analysis expansion panel -- one button per section (Community,
// Enrichment, Node Set Annotation) opens a single popup (AnalysisDialog) for that whole section.
// Inside, a select field picks which specific method to run (mirroring the Community Detection
// algorithm select: an option list with a short description of what's selected), and one Run
// button at the bottom triggers whichever method is currently selected. This replaces the earlier
// one-button-per-method grid -- g:Profiler/Reactome/Gemini/Annotation no longer get their own
// dedicated buttons or dialogs, they're just choices within their section's single dialog.
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
      communityDialogOpen: false,
      enrichmentsDialogOpen: false,
      nodeSetAnnotationDialogOpen: false,

      enrichmentMethod: 'gprofiler', // 'gprofiler' | 'reactome'
      nodeSetAnnotationMethod: 'gemini',
    };
  },
  computed: {
    clusteringDisabled() {
      return this.lastNetworkMode !== 'whole';
    },
    clusteringDisabledReason() {
      return "Only available once you've sent the whole network above (\"Send Whole Network\") -- it isn't supported for node-set-built subnetworks.";
    },
    communityAnnotationDisabled() {
      return !this.clusteringActive;
    },
    communityAnnotationDisabledReason() {
      return 'Run Clustering first -- annotation is generated per community.';
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
    enrichmentMethodOptions() {
      return [
        {
          title: 'g:Profiler',
          value: 'gprofiler',
          description: `Functional enrichment (GO, KEGG, Reactome, WikiPathways) of the ${this.selectedProteinCount} selected protein(s), via g:Profiler.`,
        },
        {
          title: 'Reactome',
          value: 'reactome',
          description: `Joint pathway over-representation of ${this.selectedProteinCount} protein(s) and ${this.selectedMetaboliteMappedCount} metabolite(s), via Reactome's Analysis Service.`,
        },
      ];
    },
    enrichmentMethodDescription() {
      return this.enrichmentMethodOptions.find((option) => option.value === this.enrichmentMethod)?.description ?? '';
    },
    enrichmentRunLoading() {
      return this.enrichmentMethod === 'gprofiler' ? this.enrichmentLoading : this.reactomeEnrichmentLoading;
    },
    enrichmentRunDisabled() {
      return this.enrichmentMethod === 'gprofiler' ? this.gprofilerDisabled : this.reactomeRunDisabled;
    },
    enrichmentRunDisabledReason() {
      return this.enrichmentMethod === 'gprofiler'
        ? (this.gprofilerDisabled ? this.gprofilerDisabledReason : '')
        : (this.reactomeRunDisabled ? this.reactomeDisabledReason : '');
    },

    geminiDisabled() {
      return this.selectedNodeCount === 0;
    },
    geminiDisabledReason() {
      return 'Select a set of nodes on the network to ask Gemini for a label.';
    },
    nodeSetAnnotationMethodOptions() {
      return [
        {
          title: 'Gemini Label',
          value: 'gemini',
          description: `Ask Gemini to propose a label for the ${this.selectedNodeCount} selected node(s), based on their name, group/subgroup, and description.`,
        },
      ];
    },
    nodeSetAnnotationMethodDescription() {
      return this.nodeSetAnnotationMethodOptions.find((option) => option.value === this.nodeSetAnnotationMethod)?.description ?? '';
    },
  },
  methods: {
    runEnrichment() {
      if (this.enrichmentMethod === 'gprofiler') this.$emit('run-gprofiler-enrichment');
      else this.$emit('run-reactome-enrichment');
      this.enrichmentsDialogOpen = false;
    },
  },
};
</script>
