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

    <v-data-table
      :headers="headers"
      :items="tableItems"
      :search="search"
      :custom-key-filter="{ edge: edgeSearchFilter }"
      filter-mode="union"
      :loading="loading"
      density="compact"
      items-per-page="10"
      class="edge-rank-table"
      @click:row="onRowClick"
    >
      <template v-slot:item.edge="{ item }">
        <span :class="{ 'font-weight-bold': isSelected(item) }">{{ formatEdge(item) }}</span>
      </template>
      <template v-slot:header.score="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)"></v-icon>
          <v-tooltip location="top" max-width="280">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="14" class="ml-1">mdi-information-outline</v-icon>
            </template>
            <span>Edge metric: diff-L-P — absolute difference in -log10(p) between the two contexts. Higher means a bigger shift in this edge's significance.</span>
          </v-tooltip>
        </div>
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
    </v-data-table>
  </v-card>
</template>

<script>
export default {
  name: 'EdgeRankPanel',
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
  },
  emits: ['select-edge'],
  data() {
    return {
      search: '',
      headers: [
        { title: 'Rank', key: 'rank', width: 90 },
        { title: 'Edge', key: 'edge' },
        { title: 'Score', key: 'score' },
        { title: 'Signed', key: 'signed' },
      ],
    };
  },
  computed: {
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
