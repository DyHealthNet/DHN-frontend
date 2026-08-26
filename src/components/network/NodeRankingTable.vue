<template>
  <div>
    <div class="d-flex align-center px-4 py-2" style="gap: 8px;">
      <v-spacer></v-spacer>
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
      :custom-key-filter="{ label: nodeSearchFilter }"
      filter-mode="union"
      :sort-by="[{ key: 'rank', order: 'asc' }]"
      multi-sort
      items-per-page="10"
      :class="['node-ranking-table', { 'is-interactive': interactive }]"
      filename="node-ranking.csv"
      no-data-text="No nodes to rank."
      @click:row="onRowClick"
    >
      <template v-if="interactive" v-slot:item.selected="{ item }">
        <v-checkbox-btn
          :model-value="selectedNodeIds.includes(item.id)"
          @click.stop="$emit('toggle-select-node', item.id)"
        ></v-checkbox-btn>
      </template>
      <template v-slot:header.weightedDegree="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)"></v-icon>
          <v-tooltip location="top" max-width="320">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="14" class="ml-1">mdi-information-outline</v-icon>
            </template>
            <span>Sum over incident edges of -log10(p-value) * |effect size| -- the same edge weighting used for community detection.</span>
          </v-tooltip>
        </div>
      </template>
      <template v-slot:item.weightedDegree="{ item }">
        {{ formatNumber(item.weightedDegree) }}
      </template>
      <template v-slot:item.description="{ item }">
        <span class="description-cell" :title="item.description">{{ item.description || '-' }}</span>
      </template>
    </DownloadableDataTable>
  </div>
</template>

<script>
import DownloadableDataTable from '@/components/DownloadableDataTable.vue';
import { computeWeightedDegree } from './networkRanking.js';

// v-data-table's default sort coerces values to strings before comparing,
// which breaks numeric ordering -- force pure numeric compare.
function numericSort(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

export default {
  name: 'NodeRankingTable',
  components: { DownloadableDataTable },
  props: {
    nodes: {
      type: Array,
      default: () => [],
    },
    edges: {
      type: Array,
      default: () => [],
    },
    // When false, rows are inert -- no click emit, no pointer cursor. Used
    // for the "Full Network Statistics" instance, which is a read-only
    // starting point shown before any node/edge is selected in the graph.
    interactive: {
      type: Boolean,
      default: true,
    },
    // Ids of nodes currently in the multi-node Selection list -- drives the checkbox column's
    // checked state. Membership only, no need for full node objects here.
    selectedNodeIds: {
      type: Array,
      default: () => [],
    },
    clusteringActive: {
      type: Boolean,
      default: false,
    },
    // (node) => label, e.g. "Community 3" -- only called while clusteringActive. Passed in
    // rather than duplicated here so the label always matches the legend/coloring logic.
    communityLabelFor: {
      type: Function,
      default: null,
    },
  },
  emits: ['select-node', 'toggle-select-node'],
  data() {
    return {
      search: '',
    };
  },
  computed: {
    headers() {
      const headers = [
        { title: '', key: 'selected', width: 48, sortable: false },
        { title: 'Rank', key: 'rank', width: 90, sort: numericSort },
        { title: 'Node', key: 'label' },
        { title: 'Group', key: 'group', width: 130 },
        { title: 'Degree', key: 'degree', width: 100, sort: numericSort },
        { title: 'Weighted Degree', key: 'weightedDegree', sort: numericSort },
        { title: 'Description', key: 'description' },
      ];
      if (this.clusteringActive) {
        headers.splice(4, 0, { title: 'Community', key: 'community', width: 130 });
      }
      if (!this.interactive) {
        return headers.filter((header) => header.key !== 'selected');
      }
      return headers;
    },
    rankedNodes() {
      return computeWeightedDegree(this.nodes, this.edges);
    },
    // Resolves display label and group as real item fields rather than only
    // in a render slot -- v-data-table's default sort reads item[column.key]
    // directly, so a slot-only value never sorts.
    tableItems() {
      return this.rankedNodes.map((node) => ({
        ...node,
        label: node.display_name || node.id,
        group: node.source_table || node.subtype || '-',
        community: this.clusteringActive && this.communityLabelFor ? this.communityLabelFor(node) : null,
      }));
    },
  },
  methods: {
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
      if (!this.interactive) return;
      this.$emit('select-node', item.id);
    },
    // Same reasoning as NodeRankPanel's nodeSearchFilter: display_name isn't
    // a header column (the 'id' column renders it via a slot), so match it
    // here against the raw row instead.
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
.node-ranking-table.is-interactive :deep(tbody tr) {
  cursor: pointer;
}

/* Descriptions can run long -- truncate to one line with the full text
   available via the native title tooltip on hover, rather than blowing out
   row height or column width. */
.description-cell {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 320px;
}
</style>
