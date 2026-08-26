<template>
  <DownloadableDataTable
    :headers="headers"
    :items="items"
    :loading="loading"
    :sort-by="[{ key: 'p_value', order: 'asc' }]"
    multi-sort
    :filename="filename"
    no-data-text="No significant terms found."
  >
    <template #item.name="{ item }">
      <a v-if="gProfilerTermUrl(item)" :href="gProfilerTermUrl(item)" target="_blank" rel="noopener">{{ item.name }}</a>
      <template v-else>{{ item.name }}</template>
    </template>
    <template #item.p_value="{ item }">{{ item.p_value.toExponential(2) }}</template>
    <template #item.intersection_size="{ item }">{{ item.intersection_size }}/{{ item.term_size }}</template>
  </DownloadableDataTable>
</template>

<script>
// The g:Profiler results table (headers + link/formatting slots), pulled out of
// EnrichmentResultsPanel.vue so it can be reused both for a single node-set's Protein
// Enrichment tab and for each community's table in the Community Annotation tab.
import DownloadableDataTable from '@/components/DownloadableDataTable.vue';

export default {
  name: 'GProfilerResultsTable',
  components: { DownloadableDataTable },
  props: {
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    filename: { type: String, default: 'protein-enrichment-results.csv' },
  },
  data() {
    return {
      headers: [
        { title: 'Source', key: 'source', width: 110 },
        { title: 'Term', key: 'name' },
        { title: 'p-value', key: 'p_value', width: 110 },
        { title: 'Genes', key: 'intersection_size', width: 100, csvValue: (item) => `${item.intersection_size}/${item.term_size}` },
      ],
    };
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
