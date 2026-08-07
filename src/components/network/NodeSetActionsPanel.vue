<template>
  <div>
    <v-divider class="my-4"></v-divider>
    <p>Gemini Label</p>
    <p class="text-caption text-medium-emphasis mt-2">
      Ask Gemini to propose a label for the {{ selectedNodeCount }} selected node(s), based on their
      name, group/subgroup, and description.
    </p>
    <v-btn
      class="mt-2"
      color="primary"
      variant="outlined"
      :loading="geminiLoading"
      :disabled="selectedNodeCount === 0"
      @click="$emit('run-gemini-label')"
    >Get Gemini Label</v-btn>

    <template v-if="selectedNodeCount === 0 || hasSelectedProtein">
      <v-divider class="my-4"></v-divider>
      <p>Protein Enrichment (g:Profiler)</p>
      <p v-if="hasSelectedProtein" class="text-caption text-medium-emphasis mt-2">
        Functional enrichment of the {{ selectedProteinCount }} selected protein(s), via <a href="https://biit.cs.ut.ee/gprofiler/gost" target="_blank" rel="noopener">g:Profiler</a>.
      </p>
      <p v-else class="text-caption text-medium-emphasis mt-2">
        Select protein node(s) to run functional enrichment via <a href="https://biit.cs.ut.ee/gprofiler/gost" target="_blank" rel="noopener">g:Profiler</a>.
      </p>
      <v-btn
        class="mt-2"
        color="primary"
        variant="outlined"
        :loading="enrichmentLoading"
        :disabled="!hasSelectedProtein"
        @click="$emit('run-protein-enrichment')"
      >Run Enrichment</v-btn>
    </template>

    <template v-if="selectedNodeCount === 0 || hasSelectedProtein || hasSelectedMetabolite">
      <v-divider class="my-4"></v-divider>
      <p>Reactome Enrichment</p>
      <p v-if="hasSelectedProtein || hasSelectedMetabolite" class="text-caption text-medium-emphasis mt-2">
        Joint pathway over-representation of {{ selectedProteinCount }} protein(s) and
        {{ selectedMetaboliteMappedCount }} metabolite(s), via <a href="https://reactome.org/PathwayBrowser/#/ANALYSIS" target="_blank" rel="noopener">Reactome</a>.
      </p>
      <p v-else class="text-caption text-medium-emphasis mt-2">
        Select protein and/or metabolite node(s) to run joint pathway over-representation via <a href="https://reactome.org/PathwayBrowser/#/ANALYSIS" target="_blank" rel="noopener">Reactome</a>.
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
        class="mt-2"
        color="primary"
        variant="outlined"
        :loading="reactomeEnrichmentLoading"
        :disabled="reactomeRunDisabled"
        @click="$emit('run-reactome-enrichment')"
      >Run Enrichment</v-btn>
    </template>
  </div>
</template>

<script>
// Analysis-panel trigger blocks (Gemini Label, Protein Enrichment, Reactome
// Enrichment) -- pulled out of data-network.vue so that already-large file
// doesn't grow further with this markup. Purely presentational/controlled:
// data-network.vue owns all the selection state and run-methods; this only
// renders the captions/buttons for it and reports clicks back via emits.
export default {
  name: 'NodeSetActionsPanel',
  props: {
    selectedNodeCount: { type: Number, default: 0 },
    hasSelectedProtein: { type: Boolean, default: false },
    hasSelectedMetabolite: { type: Boolean, default: false },
    selectedProteinCount: { type: Number, default: 0 },
    // selectedMetaboliteCount minus any that turned out unmappable to ChEBI on the last Reactome run
    selectedMetaboliteMappedCount: { type: Number, default: 0 },
    selectedMetabolitesWithoutChebiCount: { type: Number, default: 0 },
    reactomeUnmappedMetaboliteNames: { type: Array, default: () => [] },
    reactomeRunDisabled: { type: Boolean, default: false },
    reactomeEnrichmentRan: { type: Boolean, default: false },

    geminiLoading: { type: Boolean, default: false },
    enrichmentLoading: { type: Boolean, default: false },
    reactomeEnrichmentLoading: { type: Boolean, default: false },
  },
  emits: ['run-gemini-label', 'run-protein-enrichment', 'run-reactome-enrichment'],
};
</script>
