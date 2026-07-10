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
      :loading="loading"
      density="compact"
      items-per-page="10"
      class="node-rank-table"
      @click:row="onRowClick"
    >
      <template v-slot:item.node="{ item }">
        <span :class="{ 'font-weight-bold': isSelected(item) }">{{ item.node }}</span>
      </template>
      <template v-slot:item.score="{ item }">
        {{ formatNumber(item.score) }}
      </template>
      <template v-slot:item.nodeMetricValue="{ item }">
        {{ formatNumber(item.nodeMetricValue) }}
      </template>
      <template v-slot:no-data>
        <span class="text-medium-emphasis">No node ranking available. Select a node metric to enable node ranking.</span>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
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
  },
  emits: ['select-node'],
  data() {
    return {
      search: '',
      headers: [
        { title: 'Rank', key: 'rank', width: 90 },
        { title: 'Node', key: 'node' },
        { title: 'Type', key: 'type', width: 130 },
        { title: 'Score', key: 'score' },
        { title: 'Node metric', key: 'nodeMetricValue' },
      ],
    };
  },
  methods: {
    isSelected(item) {
      return item.node === this.selectedNode;
    },
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
      this.$emit('select-node', item);
    },
  },
};
</script>

<style scoped>
.node-rank-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
