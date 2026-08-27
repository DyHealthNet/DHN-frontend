<template>
  <v-card outlined class="mt-4">
    <div class="d-flex align-center pa-4 pb-2">
      <span class="text-subtitle-1 font-weight-medium">{{ nodeLabel }}</span>
      <v-chip size="small" variant="outlined" color="primary-darken-1" class="ml-2">{{ items.length }}</v-chip>
      <v-spacer></v-spacer>
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
    </div>

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

<style scoped>
.node-edge-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
