<template>
  <DownloadableDataTable
    :headers="headers"
    :items="tableItems"
    :loading="loading"
    :sort-by="[{ key: 'pValue', order: 'asc' }]"
    multi-sort
    :filename="filename"
    no-data-text="No significant pathways found."
  >
    <template #item.name="{ item }">
      <a :href="`https://reactome.org/PathwayBrowser/#/${item.stId}`" target="_blank" rel="noopener">{{ item.name }}</a>
    </template>
    <template #item.pValue="{ item }">{{ item.pValue.toExponential(2) }}</template>
    <template #item.fdr="{ item }">{{ item.fdr.toExponential(2) }}</template>
    <template #item.found="{ item }">{{ item.found }}/{{ item.total }}</template>
    <template #item.significant="{ item }">
      <v-chip v-if="item.significant" size="x-small" color="success" variant="flat">Significant</v-chip>
    </template>
  </DownloadableDataTable>
</template>

<script>
// The Reactome results table (headers + link/formatting slots), pulled out of
// EnrichmentResultsPanel.vue so it can be reused both for a single node-set's Reactome
// Enrichment tab and for each community's table in the Community Annotation tab.
import DownloadableDataTable from '@/components/DownloadableDataTable.vue';

// Fixed rather than user-configurable, matching the p<=0.05 convention used elsewhere in the
// app (e.g. GProfilerResultsTable's own significance badge, the network's edge-significance
// threshold). Reactome's Analysis Service never filters by significance itself -- it always
// returns the top pathways regardless -- so this is evaluated against `fdr` (its
// multiple-testing-corrected value), not the raw `pValue`.
const SIGNIFICANCE_FDR_THRESHOLD = 0.05;

export default {
  name: 'ReactomeResultsTable',
  components: { DownloadableDataTable },
  props: {
    // Raw Reactome Analysis Service pathway objects (results.pathways), each with a nested
    // entities.{pValue,fdr,found,total} -- not yet flattened.
    results: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    filename: { type: String, default: 'reactome-enrichment-results.csv' },
  },
  data() {
    return {
      headers: [
        { title: 'Pathway', key: 'name' },
        { title: 'p-value', key: 'pValue', width: 110 },
        { title: 'FDR', key: 'fdr', width: 110 },
        { title: 'Entities', key: 'found', width: 100, csvValue: (item) => `${item.found}/${item.total}` },
        {
          title: 'Significant',
          key: 'significant',
          width: 130,
          sort: (a, b) => (a === b ? 0 : a ? -1 : 1),
          csvValue: (item) => (item.significant ? 'Yes' : 'No'),
        },
      ],
    };
  },
  computed: {
    // Flattened so DownloadableDataTable's headers can use plain keys instead of nested
    // paths (pathway.entities.pValue etc.).
    tableItems() {
      return this.results.map((pathway) => ({
        stId: pathway.stId,
        name: pathway.name,
        pValue: pathway.entities.pValue,
        fdr: pathway.entities.fdr,
        found: pathway.entities.found,
        total: pathway.entities.total,
        significant: pathway.entities.fdr <= SIGNIFICANCE_FDR_THRESHOLD,
      }));
    },
  },
};
</script>
