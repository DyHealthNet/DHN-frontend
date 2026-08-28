<template>
  <v-card outlined>
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
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
      :items="tableItems"
      :search="search"
      :custom-key-filter="{ edge: edgeSearchFilter }"
      filter-mode="union"
      :sort-by="[{ key: 'rank', order: 'asc' }]"
      multi-sort
      :loading="loading"
      items-per-page="10"
      class="edge-rank-table"
      filename="edge-rank.csv"
      @click:row="onRowClick"
    >
      <template v-slot:item.edge="{ item }">
        <span :class="{ 'font-weight-bold': isSelected(item) }">{{ formatEdge(item) }}</span>
      </template>
      <template v-slot:header.score="{ column }">
        <v-tooltip location="top" max-width="320">
          <template v-slot:activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>Edge metric: {{ edgeMetricLabel }} — {{ edgeMetricDescription }}</span>
        </v-tooltip>
      </template>
      <template v-slot:item.score="{ item }">
        {{ formatNumber(item.score) }}
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
    selectedEdge: {
      type: String,
      default: null,
    },
    // id -> point lookup (from differential-network.vue's result.points), used to resolve
    // label1/label2 (raw node ids) to display names -- edgeRanking rows don't carry them.
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
      headers: [
        { title: 'Rank', key: 'rank', width: 90, sort: rankSort },
        { title: 'Edge', key: 'edge', csvValue: (item) => (item.label1Name && item.label2Name ? `${item.label1Name} <-> ${item.label2Name}` : item.edge) },
        { title: 'Score', key: 'score', sort: scoreSort },
        { title: 'Signed', key: 'signed', sort: scoreSort },
      ],
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
    // Adds resolved display names onto each row for rendering (formatEdge) and searching
    // (edgeSearchFilter) -- edgeRanking rows only carry raw label1/label2 node ids.
    tableItems() {
      return this.items.map((item) => ({
        ...item,
        label1Name: this.pointsById[item.label1]?.display_name || item.label1,
        label2Name: this.pointsById[item.label2]?.display_name || item.label2,
      }));
    },
  },
  methods: {
    isSelected(item) {
      return item.edge === this.selectedEdge;
    },
    formatEdge(item) {
      if (item.label1Name && item.label2Name) return `${item.label1Name}  ↔  ${item.label2Name}`;
      return item.edge;
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
    // Same reasoning as NodeRankPanel's nodeSearchFilter: v-data-table's filter-keys can't see
    // label1Name/label2Name since they aren't header columns, so match them here instead,
    // against the raw row (item.raw), alongside the raw label1/label2 ids.
    edgeSearchFilter(_value, query, item) {
      const q = String(query ?? '').toLowerCase();
      if (!q) return true;
      const raw = item?.raw || {};
      const haystack = [raw.label1, raw.label2, raw.label1Name, raw.label2Name]
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
