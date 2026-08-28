<template>
  <v-card outlined class="mt-4">
    <div class="d-flex align-center px-4 py-2" style="gap: 8px;">
      <!-- <v-select
        v-model="testTypeFilter"
        :items="testTypeOptions"
        label="Filter test type"
        density="compact"
        variant="outlined"
        hide-details
        single-line
        style="max-width: 180px"
      ></v-select> -->
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search node"
        density="compact"
        variant="outlined"
        hide-details
        single-line
        style="max-width: 220px"
      ></v-text-field>
    </div>

    <DownloadableDataTable
      :headers="headers"
      :items="tableItems"
      :search="search"
      :custom-key-filter="{ node1: edgeSearchFilter }"
      filter-mode="union"
      :sort-by="[{ key: 'rank', order: 'asc' }]"
      multi-sort
      items-per-page="10"
      :class="['edge-ranking-table', { 'is-interactive': interactive }]"
      filename="edge-ranking.csv"
      no-data-text="No edges to rank."
      @click:row="onRowClick"
    >
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
      <template v-slot:item.abs_effect_size="{ item }">
        {{ formatNumber(item.abs_effect_size) }}
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
    // When false, rows are inert -- no click emit, no pointer cursor. Used
    // for the "Full Network Statistics" instance, which is a read-only
    // starting point shown before any node/edge is selected in the graph.
    interactive: {
      type: Boolean,
      default: true,
    },
    // When true, `edges` already arrive globally ranked (a `rank` field on each) from the
    // backend -- trust that instead of recomputing rankEdges() over just this slice, since
    // a preranked slice can be a truncated top-N of a much larger significant-edge set (see
    // NetworkRankingTabs.vue).
    preranked: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select-edge'],
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
        { title: 'Abs. Effect Size', key: 'abs_effect_size', sort: numericSort },
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
      return this.preranked ? this.filteredEdges : rankEdges(this.filteredEdges);
    },
    // Resolves from/to node ids to display names as real item fields (node1/
    // node2) rather than only in a render slot -- v-data-table's default sort
    // reads item[column.key] directly, so a slot-only value never sorts.
    tableItems() {
      return this.rankedEdges.map((edge) => ({
        ...edge,
        node1: this.nodeLabel(edge.from),
        node2: this.nodeLabel(edge.to),
        abs_effect_size: edge.effect_size != null ? Math.abs(edge.effect_size) : null,
      }));
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
      if (!this.interactive) return;
      this.$emit('select-edge', item.id);
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

<style>
/* Unscoped, not :deep() -- .edge-ranking-table lands on PrimeVue's own <DataTable> root,
   which DownloadableDataTable renders as ITS child, not this component's. Vue only stamps a
   scoped-CSS attribute onto a direct child component's root, not a grandchild's, so a
   `<style scoped>` `:deep()` rule here can never actually match that element (silently
   dead, not just non-specific) -- see NodeRankingTable.vue's equivalent fix and
   DownloadableDataTable.vue's own .p-select-overlay rules for the same reasoning. */
.edge-ranking-table.is-interactive tbody tr {
  cursor: pointer;
}
</style>
