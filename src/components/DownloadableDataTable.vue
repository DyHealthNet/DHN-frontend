<template>
  <div class="downloadable-data-table">
    <div class="d-flex justify-end mb-1">
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-download"
        :disabled="!items.length"
        @click="downloadCsv"
      >Download CSV</v-btn>
    </div>
    <v-data-table
      v-bind="$attrs"
      :headers="headers"
      :items="items"
      :loading="loading"
      :sort-by="sortBy"
      :items-per-page="itemsPerPage"
      :items-per-page-options="itemsPerPageOptions"
      density="compact"
    >
      <template v-if="!$slots.loading" #loading>
        <v-skeleton-loader type="table-row@3"></v-skeleton-loader>
      </template>
      <template v-if="!$slots['no-data']" #no-data>
        <span class="text-medium-emphasis">{{ noDataText }}</span>
      </template>
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps" :key="slotName">
        <slot :name="slotName" v-bind="slotProps"></slot>
      </template>
    </v-data-table>
  </div>
</template>

<script>
// Generic sortable + CSV-downloadable table, wrapping Vuetify's v-data-table
// (same component NodeRankPanel.vue/EdgeRankPanel.vue already use for
// sorting) so column sorting comes for free. Purely presentational: callers
// own the data and pass it in via headers/items, and can still customize
// cell rendering by forwarding any v-data-table slot (e.g. #item.name)
// straight through -- see the dynamic $slots loop below.
export default {
  name: 'DownloadableDataTable',
  // Extra attrs (search, custom-key-filter, filter-mode, @click:row, class, ...) are meant
  // for the inner v-data-table, not this component's own root div -- forwarded explicitly
  // via v-bind="$attrs" above instead of Vue's default fallthrough-to-root-element.
  inheritAttrs: false,
  props: {
    // Vuetify v-data-table headers ({ title, key, width, ... }), plus an
    // optional per-header `csvValue(item)` used only for the CSV export --
    // lets a column's CSV cell differ from its rendered cell (e.g. a "12/340"
    // ratio column can still export both numbers) without adding an extra
    // visible column.
    headers: { type: Array, required: true },
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    filename: { type: String, default: 'results.csv' },
    noDataText: { type: String, default: 'No data available.' },
    itemsPerPage: { type: [Number, String], default: 10 },
    sortBy: { type: Array, default: () => [] },
  },
  computed: {
    // Vuetify's own default items-per-page options, minus "All" once there's
    // enough rows that selecting it would actually dump more than 100 rows
    // into the table at once (the same page-breaker concern that shaped the
    // network ranking tables' own row caps).
    itemsPerPageOptions() {
      const options = [
        { value: 10, title: '10' },
        { value: 25, title: '25' },
        { value: 50, title: '50' },
        { value: 100, title: '100' },
        { value: -1, title: 'All' },
      ];
      if (this.items.length > 100) {
        return options.filter((option) => option.value !== -1);
      }
      return options;
    },
  },
  methods: {
    getPath(obj, path) {
      return path.split('.').reduce((value, key) => (value == null ? value : value[key]), obj);
    },
    csvEscape(value) {
      const str = value == null ? '' : String(value);
      return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    },
    downloadCsv() {
      const headerRow = this.headers.map((h) => this.csvEscape(h.title));
      const rows = this.items.map((item) => this.headers.map((h) => {
        const value = typeof h.csvValue === 'function' ? h.csvValue(item) : this.getPath(item, h.key);
        return this.csvEscape(value);
      }));
      const csv = [headerRow, ...rows].map((row) => row.join(',')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.filename;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
};
</script>
