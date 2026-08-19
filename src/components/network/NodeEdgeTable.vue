<template>
  <v-card outlined class="mt-4">
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Edges of {{ nodeLabel }}
        <v-chip size="small" color="white" variant="outlined" class="ml-2">{{ items.length }}</v-chip>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search neighbor"
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
      :sort-by="[{ key: 'pValue', order: 'asc' }, { key: 'effectSize', order: 'asc' }]"
      multi-sort
      items-per-page="10"
      class="node-edge-table"
      filename="node-edges.csv"
      no-data-text="No edges for this node."
      @click:row="onRowClick"
    >
      <template v-slot:item.pValue="{ item }">
        {{ formatNumber(item.pValue) }}
      </template>
      <template v-slot:item.effectSize="{ item }">
        {{ formatNumber(item.effectSize) }}
      </template>
    </DownloadableDataTable>
  </v-card>
</template>

<script>
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
    nodeLabel: {
      type: String,
      default: '',
    },
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

<style scoped>
.node-edge-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
