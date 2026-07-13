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
      :items="items"
      :search="search"
      :loading="loading"
      density="compact"
      items-per-page="10"
      class="edge-rank-table"
      @click:row="onRowClick"
    >
      <template v-slot:item.edge="{ item }">
        <span :class="{ 'font-weight-bold': isSelected(item) }">{{ formatEdge(item) }}</span>
      </template>
      <template v-slot:item.score="{ item }">
        {{ formatNumber(item.score) }}
      </template>
      <template v-slot:item.signed="{ item }">
        <v-icon size="16" :color="item.signed > 0 ? 'primary' : 'secondary'">
          {{ item.signed > 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold' }}
        </v-icon>
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
  methods: {
    isSelected(item) {
      return item.edge === this.selectedEdge;
    },
    formatEdge(item) {
      if (item.label1 && item.label2) return `${item.label1}  ↔  ${item.label2}`;
      return item.edge;
    },
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
      this.$emit('select-edge', item);
    },
  },
};
</script>

<style scoped>
.edge-rank-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
