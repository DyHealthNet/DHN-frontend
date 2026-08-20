<template>
  <v-card outlined class="mt-4">
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Edge Ranking
        <v-chip size="small" color="white" variant="outlined" class="ml-2">{{ scopeLabel }}</v-chip>
        <v-chip size="small" color="white" variant="outlined" class="ml-2">{{ rankedEdges.length }}</v-chip>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-select
        v-model="testTypeFilter"
        :items="testTypeOptions"
        label="Test type"
        density="compact"
        variant="outlined"
        hide-details
        single-line
        class="mr-2"
        style="max-width: 180px"
      ></v-select>
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

    <DownloadableDataTable
      :headers="headers"
      :items="rankedEdges"
      :search="search"
      :custom-key-filter="{ node1: edgeSearchFilter }"
      filter-mode="union"
      :sort-by="[{ key: 'rank', order: 'asc' }]"
      items-per-page="10"
      class="edge-ranking-table"
      filename="edge-ranking.csv"
      no-data-text="No edges to rank."
      @click:row="onRowClick"
    >
      <template v-slot:item.node1="{ item }">
        {{ nodeLabel(item.from) }}
      </template>
      <template v-slot:item.node2="{ item }">
        {{ nodeLabel(item.to) }}
      </template>
      <template v-slot:header.p_value="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)"></v-icon>
          <v-tooltip location="top" max-width="320">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="14" class="ml-1">mdi-information-outline</v-icon>
            </template>
            <span>Ranked by p-value ascending; when p-values tie (e.g. all 0 after multiple-testing correction), broken by |effect size| descending.</span>
          </v-tooltip>
        </div>
      </template>
      <template v-slot:item.p_value="{ item }">
        {{ formatNumber(item.p_value) }}
      </template>
      <template v-slot:item.effect_size="{ item }">
        {{ formatNumber(item.effect_size) }}
      </template>
    </DownloadableDataTable>
  </v-card>
</template>

<script>
import DownloadableDataTable from '@/components/DownloadableDataTable.vue';
import { rankEdges, distinctTestTypes } from './networkRanking.js';

// v-data-table's default sort coerces values to strings before comparing,
// which breaks numeric ordering (e.g. lexicographic instead of magnitude) --
// force pure numeric compare, missing values sort last.
function numericSort(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

export default {
  name: 'EdgeRankingTable',
  components: { DownloadableDataTable },
  props: {
    edges: {
      type: Array,
      default: () => [],
    },
    // id -> node lookup (from data-network.vue's networkNodes), used to
    // resolve from/to node ids to display names.
    nodesById: {
      type: [Map, Object],
      default: () => new Map(),
    },
    scopeLabel: {
      type: String,
      default: '',
    },
  },
  emits: ['select-node'],
  data() {
    return {
      search: '',
      testTypeFilter: 'All',
      headers: [
        { title: 'Rank', key: 'rank', width: 90, sort: numericSort },
        { title: 'Node 1', key: 'node1' },
        { title: 'Node 2', key: 'node2' },
        { title: 'Test', key: 'test_type', width: 110 },
        { title: 'P-Value', key: 'p_value', sort: numericSort },
        { title: 'Effect Size', key: 'effect_size', sort: numericSort },
      ],
    };
  },
  computed: {
    testTypeOptions() {
      return ['All', ...distinctTestTypes(this.edges)];
    },
    filteredEdges() {
      if (this.testTypeFilter === 'All') return this.edges;
      return this.edges.filter((edge) => edge.test_type === this.testTypeFilter);
    },
    rankedEdges() {
      return rankEdges(this.filteredEdges);
    },
  },
  methods: {
    nodeLookup(nodeId) {
      if (this.nodesById instanceof Map) return this.nodesById.get(nodeId);
      return this.nodesById[nodeId];
    },
    nodeLabel(nodeId) {
      return this.nodeLookup(nodeId)?.display_name || nodeId;
    },
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
      this.$emit('select-node', item.from);
    },
    // v-data-table's built-in filter-keys only reaches values declared as
    // header columns, which node1/node2 already are -- but they're rendered
    // via a slot from raw ids, not the resolved names, so search on the
    // resolved labels here instead (mirrors NodeRankPanel's nodeSearchFilter).
    edgeSearchFilter(_value, query, item) {
      const q = String(query ?? '').toLowerCase();
      if (!q) return true;
      const raw = item?.raw || {};
      const haystack = `${this.nodeLabel(raw.from)} ${this.nodeLabel(raw.to)}`.toLowerCase();
      return haystack.includes(q);
    },
  },
};
</script>

<style scoped>
.edge-ranking-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
