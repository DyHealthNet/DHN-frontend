<template>
  <v-card outlined>
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Node Rank
        <v-chip size="small" color="white" variant="outlined" class="ml-2">{{ items.length }}</v-chip>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search node"
        density="compact"
        variant="outlined"
        hide-details
        single-line
        class="mr-2"
        style="max-width: 220px"
      ></v-text-field>
    </v-toolbar>

    <v-data-table
      :headers="headers"
      :items="items"
      :search="search"
      :custom-key-filter="{ id: nodeSearchFilter }"
      filter-mode="union"
      :sort-by="[{ key: 'rank', order: 'asc' }]"
      :loading="loading"
      density="compact"
      items-per-page="10"
      class="node-rank-table"
      @click:row="onRowClick"
    >
      <template v-slot:item.id="{ item }">
        <span :class="{ 'font-weight-bold': isSelected(item) }">{{ item.display_name || item.id }}</span>
      </template>
      <template v-slot:item.group="{ item }">
        {{ item.group || '-' }}
      </template>
      <template v-slot:header.rank="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)"></v-icon>
          <v-tooltip location="top" max-width="320">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="14" class="ml-1">mdi-information-outline</v-icon>
            </template>
            <span>{{ rankTooltip }}</span>
          </v-tooltip>
        </div>
      </template>
      <template v-slot:header.score="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)"></v-icon>
          <v-tooltip location="top" max-width="320">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="14" class="ml-1">mdi-information-outline</v-icon>
            </template>
            <span>{{ scoreTooltip }}</span>
          </v-tooltip>
        </div>
      </template>
      <template v-slot:item.score="{ item }">
        {{ formatNumber(item.score) }}
      </template>
      <template v-slot:header.nodeMetricRank="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)"></v-icon>
          <v-tooltip location="top" max-width="320">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="14" class="ml-1">mdi-information-outline</v-icon>
            </template>
            <span>{{ nodeMetricRankTooltip }}</span>
          </v-tooltip>
        </div>
      </template>
      <template v-slot:item.nodeMetricRank="{ item }">
        {{ item.nodeMetricRank ?? '-' }}
      </template>
      <template v-slot:no-data>
        <span class="text-medium-emphasis">No node ranking available. Select a node metric to enable node ranking.</span>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import { NODE_METRIC_INFO, RANKING_ALGORITHM_INFO, metricLabel, metricDescription } from './metricInfo.js';

// Rank columns: lower number = better, so a missing rank (no surviving edges for PageRank+) is
// worse than every real rank -- sorts as if it were the largest number, regardless of which
// direction the column is currently sorted in.
function rankSort(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

// Score columns: higher number = better, so a missing score is worse than every real score --
// sorts as if it were the smallest number. Otherwise compares purely numerically -- v-data-table's
// default sort coerces values to strings before comparing, which breaks once a column mixes real
// numbers with null.
function scoreSort(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  return a - b;
}

export default {
  name: 'NodeRankPanel',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    selectedNode: {
      type: String,
      default: null,
    },
    // Reported by the backend on the actual result (network/tasks.py's MODINA_NODE_METRIC/
    // MODINA_RANKING_ALGORITHM) -- null until a comparison has completed.
    nodeMetric: {
      type: String,
      default: null,
    },
    rankingAlgorithm: {
      type: String,
      default: null,
    },
  },
  emits: ['select-node'],
  data() {
    return {
      search: '',
    };
  },
  computed: {
    headers() {
      // Explicit numeric `sort` on every numeric column: v-data-table's default comparator
      // coerces values to strings before comparing, which breaks once a column mixes real
      // numbers with `null` (PageRank+ rank/score is null for nodes with no surviving edges) --
      // without this, clicking a numeric header sorts lexicographically instead of by magnitude.
      return [
        { title: 'Rank', key: 'rank', width: 90, sort: rankSort },
        { title: 'Node', key: 'id' },
        { title: 'Group', key: 'group', width: 130 },
        { title: 'Type', key: 'type', width: 130 },
        { title: 'Score', key: 'score', sort: scoreSort },
        { title: `${this.nodeMetricLabel} Rank`, key: 'nodeMetricRank', width: 130, sort: rankSort },
      ];
    },
    nodeMetricLabel() {
      return metricLabel(NODE_METRIC_INFO, this.nodeMetric) || 'Node metric';
    },
    nodeMetricDescription() {
      return metricDescription(NODE_METRIC_INFO, this.nodeMetric);
    },
    // The node-metric description explains the VALUE's direction (e.g. "higher STC means a
    // bigger shift"). This column shows its RANK, which is inverted from that: rank 1 is the
    // node with the highest value, so a lower rank number is what means "bigger shift" here --
    // reusing the value description as-is would read backwards.
    nodeMetricRankTooltip() {
      if (!this.nodeMetric) {
        return 'Node metric rank. Run a comparison to see which metric produced it.';
      }
      return `Rank 1 has the highest ${this.nodeMetricLabel} value. ${this.nodeMetricDescription}`;
    },
    rankingAlgorithmLabel() {
      return metricLabel(RANKING_ALGORITHM_INFO, this.rankingAlgorithm) || 'the ranking algorithm';
    },
    rankTooltip() {
      if (!this.rankingAlgorithm) {
        return 'Node rank. Run a comparison to see which algorithm produced it.';
      }
      return `Nodes are ranked by ${this.rankingAlgorithmLabel} (see Score column).`;
    },
    scoreTooltip() {
      if (!this.rankingAlgorithm) {
        return 'Ranking score. Run a comparison to see which algorithm and metrics produced it.';
      }
      return `${this.rankingAlgorithmLabel} score: ${metricDescription(RANKING_ALGORITHM_INFO, this.rankingAlgorithm)}`;
    },
  },
  methods: {
    isSelected(item) {
      return item.id === this.selectedNode;
    },
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
      this.$emit('select-node', item);
    },
    // v-data-table's built-in filter-keys only reaches values that are declared as header
    // columns (see items.js's transformItem), so 'display_name' -- not a header -- is
    // invisible to it. custom-key-filter instead gets the raw row (item.raw) directly, so it
    // can match the id (already the 'id' column's value) or the display name.
    nodeSearchFilter(_value, query, item) {
      const q = String(query ?? '').toLowerCase();
      if (!q) return true;
      const raw = item?.raw || {};
      const haystack = `${raw.id ?? ''} ${raw.display_name ?? ''}`.toLowerCase();
      return haystack.includes(q);
    },
  },
};
</script>

<style scoped>
.node-rank-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
