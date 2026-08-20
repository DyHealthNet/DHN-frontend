<template>
  <v-card outlined class="mt-4">
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Node Ranking
        <v-chip size="small" color="white" variant="outlined" class="ml-2">{{ scopeLabel }}</v-chip>
        <v-chip size="small" color="white" variant="outlined" class="ml-2">{{ rankedNodes.length }}</v-chip>
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

    <DownloadableDataTable
      :headers="headers"
      :items="rankedNodes"
      :search="search"
      :custom-key-filter="{ id: nodeSearchFilter }"
      filter-mode="union"
      :sort-by="[{ key: 'rank', order: 'asc' }]"
      items-per-page="10"
      class="node-ranking-table"
      filename="node-ranking.csv"
      no-data-text="No nodes to rank."
      @click:row="onRowClick"
    >
      <template v-slot:item.id="{ item }">
        {{ item.display_name || item.id }}
      </template>
      <template v-slot:item.group="{ item }">
        {{ item.source_table || item.subtype || '-' }}
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
    </DownloadableDataTable>
  </v-card>
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
    scopeLabel: {
      type: String,
      default: '',
    },
  },
  emits: ['select-node'],
  data() {
    return {
      search: '',
      headers: [
        { title: 'Rank', key: 'rank', width: 90, sort: numericSort },
        { title: 'Node', key: 'id', csvValue: (item) => item.display_name || item.id },
        { title: 'Group', key: 'group', width: 130 },
        { title: 'Degree', key: 'degree', width: 100, sort: numericSort },
        { title: 'Weighted Degree', key: 'weightedDegree', sort: numericSort },
      ],
    };
  },
  computed: {
    rankedNodes() {
      return computeWeightedDegree(this.nodes, this.edges);
    },
  },
  methods: {
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
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
.node-ranking-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
