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
      <v-tab v-if="enrichmentRan || enrichmentLoading" value="enrichment">Protein Enrichment</v-tab>
      <v-tab v-if="reactomeEnrichmentRan || reactomeEnrichmentLoading" value="reactomeEnrichment">Reactome Enrichment</v-tab>
      <v-tab v-if="geminiRan || geminiLoading" value="gemini">Gemini Label</v-tab>
    </v-tabs>
    <v-card-text>
      <!-- Each v-window-item owns its own loading state (via DownloadableDataTable's
           :loading), so a run in progress only ever shows a loading placeholder inside
           its own tab -- switching to an already-finished tab is never blocked by it. -->
      <v-window :model-value="tab">
        <v-window-item value="enrichment">
          <DownloadableDataTable
            :headers="proteinEnrichmentHeaders"
            :items="enrichmentResults"
            :loading="enrichmentLoading"
            :sort-by="[{ key: 'p_value', order: 'asc' }]"
            filename="protein-enrichment-results.csv"
            no-data-text="No significant terms found."
          >
            <template #item.name="{ item }">
              <a v-if="gProfilerTermUrl(item)" :href="gProfilerTermUrl(item)" target="_blank" rel="noopener">{{ item.name }}</a>
              <template v-else>{{ item.name }}</template>
            </template>
            <template #item.p_value="{ item }">{{ item.p_value.toExponential(2) }}</template>
            <template #item.intersection_size="{ item }">{{ item.intersection_size }}/{{ item.term_size }}</template>
          </DownloadableDataTable>
        </v-window-item>
        <v-window-item value="reactomeEnrichment">
          <DownloadableDataTable
            :headers="reactomeHeaders"
            :items="reactomeTableItems"
            :loading="reactomeEnrichmentLoading"
            :sort-by="[{ key: 'pValue', order: 'asc' }]"
            filename="reactome-enrichment-results.csv"
            no-data-text="No significant pathways found."
          >
            <template #item.name="{ item }">
              <a :href="`https://reactome.org/PathwayBrowser/#/${item.stId}`" target="_blank" rel="noopener">{{ item.name }}</a>
            </template>
            <template #item.pValue="{ item }">{{ item.pValue.toExponential(2) }}</template>
            <template #item.fdr="{ item }">{{ item.fdr.toExponential(2) }}</template>
            <template #item.found="{ item }">{{ item.found }}/{{ item.total }}</template>
          </DownloadableDataTable>
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
    </v-card-text>
  </v-card>
</template>

<script>
// Full-width results panel shown below the network view once a Protein
// Enrichment (g:Profiler), Reactome Enrichment, or Gemini Label action has
// been run from the Analysis panel -- pulled out of data-network.vue so
// that already-large file doesn't grow further with result-table markup.
// Purely presentational/controlled: data-network.vue owns all the state
// and run-methods, this only renders it and reports open/tab changes back.
import DownloadableDataTable from '@/components/DownloadableDataTable.vue';

export default {
  name: 'EnrichmentResultsPanel',
  components: { DownloadableDataTable },
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
  },
  emits: ['update:open', 'update:tab'],
  data() {
    return {
      proteinEnrichmentHeaders: [
        { title: 'Source', key: 'source', width: 110 },
        { title: 'Term', key: 'name' },
        { title: 'p-value', key: 'p_value', width: 110 },
        { title: 'Genes', key: 'intersection_size', width: 100, csvValue: (item) => `${item.intersection_size}/${item.term_size}` },
      ],
      reactomeHeaders: [
        { title: 'Pathway', key: 'name' },
        { title: 'p-value', key: 'pValue', width: 110 },
        { title: 'FDR', key: 'fdr', width: 110 },
        { title: 'Entities', key: 'found', width: 100, csvValue: (item) => `${item.found}/${item.total}` },
      ],
    };
  },
  computed: {
    // Flattened so DownloadableDataTable's headers can use plain keys instead
    // of nested paths (pathway.entities.pValue etc.).
    reactomeTableItems() {
      return this.reactomeEnrichmentResults.map((pathway) => ({
        stId: pathway.stId,
        name: pathway.name,
        pValue: pathway.entities.pValue,
        fdr: pathway.entities.fdr,
        found: pathway.entities.found,
        total: pathway.entities.total,
      }));
    },
  },
  methods: {
    // g:Profiler's API doesn't return a per-term link, so build one from the source
    // prefix baked into `native` -- only for sources with a well-established public
    // term-browser URL (GO via AmiGO, Reactome, WikiPathways, Human Phenotype Ontology).
    // Other sources (KEGG, MIRNA, CORUM, HPA, TF, ...) are left as plain text rather than
    // risk linking to a wrong/broken page.
    gProfilerTermUrl(term) {
      const native = term.native || '';
      if (native.startsWith('GO:')) return `https://amigo.geneontology.org/amigo/term/${native}`;
      if (native.startsWith('REAC:')) return `https://reactome.org/PathwayBrowser/#/${native.slice(5)}`;
      if (native.startsWith('WP:')) return `https://www.wikipathways.org/pathways/${native.slice(3)}`;
      if (native.startsWith('HP:')) return `https://hpo.jax.org/browse/term/${native}`;
      return null;
    },
  },
};
</script>
