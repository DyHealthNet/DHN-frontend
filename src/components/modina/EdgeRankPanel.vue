<template>
  <v-card :outlined="!embedded" :flat="embedded">
    <!-- embedded: the parent already supplies the header (a tab label with the row count), so the
         toolbar keeps only the search field and drops its own title/background. -->
    <v-toolbar :color="embedded ? 'surface' : 'primary-darken-1'" density="compact">
      <v-toolbar-title v-if="!embedded">
        Edge Rank
        <v-chip size="small" color="white" variant="outlined" class="ml-2">{{ items.length }}</v-chip>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search edge"
        density="compact"
        variant="outlined"
        hide-details
        single-line
        class="mr-2"
        style="max-width: 220px"
      ></v-text-field>
    </v-toolbar>

    <DownloadableDataTable
      :headers="headers"
      :items="items"
      :search="search"
      :custom-key-filter="{ source: edgeSearchFilter }"
      filter-mode="union"
      :sort-by="[{ key: 'rank', order: 'asc' }]"
      multi-sort
      :loading="loading"
      items-per-page="10"
      class="edge-rank-table"
      filename="edge-rank.csv"
      @click:row="onRowClick"
    >
      <template v-slot:item.source="{ item }">
        <span :class="{ 'font-weight-bold': isSelected(item) }">{{ formatEdge(item) }}</span>
      </template>
      <template v-slot:header.weight="{ column }">
        <v-tooltip location="top" max-width="320">
          <template v-slot:activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>Edge metric: {{ edgeMetricLabel }} — {{ edgeMetricDescription }}</span>
        </v-tooltip>
      </template>
      <template v-slot:item.weight="{ item }">
        {{ formatNumber(item.weight) }}
      </template>
      <template v-slot:item.signed="{ item }">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="16" :color="item.signed > 0 ? 'primary' : 'secondary'">
              {{ item.signed > 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold' }}
            </v-icon>
          </template>
          <span>Higher edge metric in {{ dominantContext(item) }}</span>
        </v-tooltip>
        {{ formatNumber(item.signed) }}
      </template>
      <template v-slot:no-data>
        <span class="text-medium-emphasis">No edge ranking available. Select an edge metric to enable edge ranking.</span>
      </template>
    </DownloadableDataTable>
  </v-card>
</template>

<script>
import { EDGE_METRIC_INFO, metricLabel, metricDescription } from './metricInfo.js';
import DownloadableDataTable from '@/components/DownloadableDataTable.vue';

// v-data-table's default sort coerces values to strings before comparing, which sorts negative
// numbers (e.g. 'signed') lexicographically instead of by magnitude -- force pure numeric compare.
// Same rank-vs-score null convention as NodeRankPanel (a missing rank sorts as worst/largest, a
// missing score sorts as worst/smallest), even though edge rank/score aren't currently ever null.
function rankSort(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function scoreSort(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  return a - b;
}

export default {
  name: 'EdgeRankPanel',
  components: { DownloadableDataTable },
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    // Rendered inside another card (the ranking tabs) rather than standing on its own.
    embedded: {
      type: Boolean,
      default: false,
    },
    selectedEdge: {
      type: String,
      default: null,
    },
    // id -> point lookup (from differential-network.vue's result.points), used to resolve each
    // edge's source/target (raw node ids) to display names -- links don't carry them.
    pointsById: {
      type: Object,
      default: () => ({}),
    },
    contextNames: {
      type: Object,
      default: () => ({ name1: 'Context 1', name2: 'Context 2' }),
    },
    // Reported by the backend on the actual result (network/tasks.py's MODINA_EDGE_METRIC) --
    // null until a comparison has completed.
    edgeMetric: {
      type: String,
      default: null,
    },
  },
  emits: ['select-edge'],
  data() {
    return {
      search: '',
    };
  },
  computed: {
    edgeMetricLabel() {
      return metricLabel(EDGE_METRIC_INFO, this.edgeMetric) || 'Edge metric';
    },
    edgeMetricDescription() {
      return this.edgeMetric
        ? metricDescription(EDGE_METRIC_INFO, this.edgeMetric)
        : 'Run a comparison to see which metric produced this score.';
    },
    // Display names are resolved per rendered/exported cell rather than mapped onto a copy of
    // every row: `items` is result.links itself, up to ~1.6M rows on a large comparison, and
    // spreading each one into a new object to attach two name fields duplicated the entire edge
    // set in memory. A table page only ever renders 10-100 rows, so the lookups are cheap.
    headers() {
      return [
        { title: 'Rank', key: 'rank', width: 90, sort: rankSort },
        { title: 'Edge', key: 'source', csvValue: (item) => `${this.nodeName(item.source)} <-> ${this.nodeName(item.target)}` },
        { title: 'Score', key: 'weight', sort: scoreSort },
        { title: 'Signed', key: 'signed', sort: scoreSort },
      ];
    },
  },
  methods: {
    nodeName(id) {
      return this.pointsById[id]?.display_name || id;
    },
    isSelected(item) {
      return `${item.source}_${item.target}` === this.selectedEdge;
    },
    formatEdge(item) {
      return `${this.nodeName(item.source)}  ↔  ${this.nodeName(item.target)}`;
    },
    // signed = context1's metric minus context2's (see moDiNA's diff_net_construction.py,
    // _subtract_edges) -- positive means context 1 has the higher edge metric for this edge.
    dominantContext(item) {
      const name = item.signed > 0 ? this.contextNames.name1 : this.contextNames.name2;
      return name || (item.signed > 0 ? 'Context 1' : 'Context 2');
    },
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
      this.$emit('select-edge', item);
    },
    // Same reasoning as NodeRankPanel's nodeSearchFilter: the table's own filter only reaches a
    // column's own value, so an edge typed by display name would never match a row that stores
    // raw node ids. Both endpoints' ids and names are matched here instead, against the raw row.
    edgeSearchFilter(_value, query, item) {
      const q = String(query ?? '').toLowerCase();
      if (!q) return true;
      const raw = item?.raw || {};
      const haystack = [raw.source, raw.target, this.nodeName(raw.source), this.nodeName(raw.target)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    },
  },
};
</script>

<style scoped>
.edge-rank-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
