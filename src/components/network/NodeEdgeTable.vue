<template>
  <div>
    <DownloadableDataTable
      :headers="headers"
      :items="items"
      :search="search"
      :sort-by="[{ key: 'pValue', order: 'asc' }, { key: 'absEffectSize', order: 'desc' }]"
      multi-sort
      items-per-page="10"
      class="node-edge-table"
      filename="node-edges.csv"
      no-data-text="No edges for this node."
      @click:row="onRowClick"
    >
      <template v-slot:toolbar-start>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search neighbor"
          density="compact"
          variant="outlined"
          hide-details
          single-line
          style="max-width: 220px"
        ></v-text-field>
      </template>
      <template v-slot:item.pValue="{ item }">
        {{ formatNumber(item.pValue) }}
      </template>
      <template v-slot:item.effectSize="{ item }">
        {{ formatNumber(item.effectSize) }}
      </template>
      <template v-slot:item.absEffectSize="{ item }">
        {{ formatNumber(item.absEffectSize) }}
      </template>
    </DownloadableDataTable>
  </div>
</template>

<script>
// No node title/count header here -- the enclosing NodeNeighborsPanel already shows both in the
// tab label ("P12345 (12)") for whichever node this table belongs to, and wraps everything in
// its own v-card/padding, so this only needs the search field and the table itself.
import DownloadableDataTable from '@/components/DownloadableDataTable.vue';

// v-data-table's default sort coerces values to strings before comparing, which sorts floats
// lexicographically instead of by magnitude -- force pure numeric compare. Missing values sort last.
function numericSort(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

export default {
  name: 'NodeEdgeTable',
  components: { DownloadableDataTable },
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['select-neighbor'],
  data() {
    return {
      search: '',
      headers: [
        { title: 'Neighbor', key: 'neighborLabel' },
        { title: 'Test', key: 'testType' },
        { title: 'P-Value', key: 'pValue', sort: numericSort },
        { title: 'Effect Size', key: 'effectSize', sort: numericSort },
        { title: 'Abs. Effect Size', key: 'absEffectSize', sort: numericSort },
      ],
    };
  },
  methods: {
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
      this.$emit('select-neighbor', item.neighborId);
    },
  },
};
</script>

<style>
/* Unscoped, not :deep() -- .node-edge-table lands on PrimeVue's own <DataTable> root, which
   DownloadableDataTable renders as ITS child, not this component's. Vue only stamps a
   scoped-CSS attribute onto a direct child component's root, not a grandchild's, so a
   `<style scoped>` `:deep()` rule here can never actually match that element (silently
   dead, not just non-specific) -- see NodeRankingTable.vue's equivalent fix. */
.node-edge-table tbody tr {
  cursor: pointer;
}
</style>
