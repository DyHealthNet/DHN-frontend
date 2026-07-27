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
      :custom-key-filter="{ id: nodeSearchFilter }"
      filter-mode="union"
      :loading="loading"
      density="compact"
      items-per-page="10"
      class="node-rank-table"
      @click:row="onRowClick"
    >
      <template v-slot:item.id="{ item }">
        <span :class="{ 'font-weight-bold': isSelected(item) }">{{ item.display_name || item.id }}</span>
      </template>
      <template v-slot:item.group="{ item }">
        {{ item.group || '-' }}
      </template>
      <template v-slot:header.score="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)"></v-icon>
          <v-tooltip location="top" max-width="280">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="14" class="ml-1">mdi-information-outline</v-icon>
            </template>
            <span>Node metric: STC (statistical test centrality) — 1 minus the p-value of a direct two-context test on this node's raw values. Higher means a bigger shift between contexts.</span>
          </v-tooltip>
        </div>
      </template>
      <template v-slot:item.score="{ item }">
        {{ formatNumber(item.score) }}
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
        { title: 'Node', key: 'id' },
        { title: 'Group', key: 'group', width: 130 },
        { title: 'Type', key: 'type', width: 130 },
        { title: 'Score', key: 'score' },
      ],
    };
  },
  methods: {
    isSelected(item) {
      return item.id === this.selectedNode;
    },
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(4);
    },
    onRowClick(_, { item }) {
      this.$emit('select-node', item);
    },
    // v-data-table's built-in filter-keys only reaches values that are declared as header
    // columns (see items.js's transformItem), so 'display_name' -- not a header -- is
    // invisible to it. custom-key-filter instead gets the raw row (item.raw) directly, so it
    // can match the id (already the 'id' column's value) or the display name.
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
.node-rank-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
