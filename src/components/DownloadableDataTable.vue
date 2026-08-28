<template>
  <div class="downloadable-data-table">
    <div class="d-flex align-center justify-end mb-1" style="gap: 8px;">
      <span v-if="multiSort" class="text-caption text-medium-emphasis">Ctrl/Cmd+click a column to multi-sort by more than one column</span>
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            size="small"
            variant="text"
            prepend-icon="mdi-download"
            :disabled="!items.length"
          >Download</v-btn>
        </template>
        <v-list density="compact">
          <v-list-item title="Download CSV" @click="download('csv')"></v-list-item>
          <v-list-item title="Download JSON" @click="download('json')"></v-list-item>
          <v-list-item title="Download TXT" @click="download('txt')"></v-list-item>
        </v-list>
      </v-menu>
    </div>
    <DataTable
      ref="tableRef"
      :value="sortedItems"
      :class="$attrs.class"
      custom-sort
      :sort-mode="multiSort ? 'multiple' : 'single'"
      :sort-field="!multiSort ? internalSortBy[0]?.key : undefined"
      :sort-order="!multiSort ? (internalSortBy[0]?.order === 'desc' ? -1 : 1) : undefined"
      :multi-sort-meta="multiSort ? internalSortBy.map((s) => ({ field: s.key, order: s.order === 'desc' ? -1 : 1 })) : undefined"
      @sort="onSort"
      @row-click="handleRowClick"
      :row-class="rowClass"
      :loading="loading"
      paginator
      v-model:first="first"
      :rows="rows"
      :rows-per-page-options="rowsPerPageOptions"
      density="compact"
      scrollable
      :scroll-height="lockedScrollHeight"
    >
      <Column
        v-for="header in headers"
        :key="header.key"
        :field="header.key"
        :sortable="header.sortable !== false"
        :style="header.width ? { width: header.width + 'px' } : undefined"
      >
        <template #header>
          <slot
            v-if="$slots['header.' + header.key]"
            :name="'header.' + header.key"
            :column="{ title: header.title, key: header.key, sortable: header.sortable !== false }"
            :get-sort-icon="getSortIcon"
          />
          <div v-else class="v-data-table-header__content">
            <span>{{ header.title }}</span>
            <v-icon
              v-if="header.sortable !== false"
              class="v-data-table-header__sort-icon"
              :icon="getSortIcon({ key: header.key })"
            ></v-icon>
          </div>
        </template>
        <template #body="{ data }">
          <slot v-if="$slots['item.' + header.key]" :name="'item.' + header.key" :item="data" />
          <template v-else>{{ getPath(data, header.key) }}</template>
        </template>
      </Column>

      <template #empty>
        <slot v-if="$slots['no-data']" name="no-data" />
        <span v-else class="text-medium-emphasis">{{ noDataText }}</span>
      </template>
    </DataTable>
  </div>
</template>

<script>
// Generic sortable + filterable + CSV/JSON/TXT-downloadable table, built on PrimeVue's
// DataTable/Column. Purely presentational: callers own the data and pass it in via
// headers/items, and can still customize cell/header rendering by forwarding the same
// #item.<key> / #header.<key> / #no-data slots the previous Vuetify-backed version used --
// this component reproduces that external prop/slot/event API exactly so call sites didn't
// need to change when the underlying table engine was swapped. Search/filter/sort are
// implemented here rather than delegated to PrimeVue, since callers rely on Vuetify-style
// custom-key-filter/filter-mode search semantics and per-header numeric sort comparators.
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

export default {
  name: 'DownloadableDataTable',
  components: { DataTable, Column },
  // Extra attrs (only `class` is used) are forwarded explicitly to <DataTable> above rather
  // than via Vue's default fallthrough-to-root-element, since the root here is a wrapper div.
  inheritAttrs: false,
  props: {
    // Column descriptors: { title, key, width?, sortable?(default true), sort?(a,b), csvValue?(item) }.
    // `sort` is an optional custom comparator (e.g. numeric, null-aware) used instead of the
    // default string compare. `csvValue` lets a column's exported cell differ from its
    // rendered cell without adding an extra visible column.
    headers: { type: Array, required: true },
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    filename: { type: String, default: 'results.csv' },
    noDataText: { type: String, default: 'No data available.' },
    itemsPerPage: { type: [Number, String], default: 10 },
    sortBy: { type: Array, default: () => [] },
    multiSort: { type: Boolean, default: false },
    // Search string, typically bound to a v-text-field the caller renders above this table.
    search: { type: String, default: '' },
    // Per-header-key override matcher `(value, query, item) => boolean`, where `item.raw` is
    // the original row -- lets a key that isn't a rendered header column still be searched
    // (e.g. matching a raw id/display-name pair that's only shown via a slot). Only ever
    // evaluated for keys that are also declared headers, matching Vuetify's original behavior.
    customKeyFilter: { type: Object, default: () => ({}) },
    // 'intersection' (default): every custom filter must match, AND the default substring
    // match (over non-custom header keys) must also match, if there are any. 'union': a row
    // passes if either the default match or any custom filter matches.
    filterMode: { type: String, default: 'intersection' },
    // (item) => class name(s) -- forwarded straight to PrimeVue's DataTable row-class, e.g. to
    // highlight whichever row matches the node currently shown in the Details panel.
    rowClass: { type: Function, default: null },
  },
  emits: ['click:row'],
  data() {
    return {
      internalSortBy: this.sortBy.length ? [...this.sortBy] : [],
      // PrimeVue's paginator keeps its own page position regardless of what data is passed
      // in -- without resetting it here, swapping in a new/smaller `items` array (e.g. after
      // switching context) or narrowing via search leaves the table stuck on whatever page it
      // was last on, so the visible "Rank" column can start well past 1 even though rankEdges/
      // computeWeightedDegree always number the underlying data starting at 1.
      first: 0,
      // Height (in px, as a CSS string) the table's body locks to the first time it renders
      // with actual rows -- at that point it's showing the caller's default itemsPerPage, so
      // that natural height becomes the cap. Bumping "rows per page" up after that scrolls
      // the extra rows inside this same height instead of growing the table (and the page
      // around it) taller. null until measured, which lets the table size itself naturally
      // for that first real render.
      lockedScrollHeight: null,
      heightLocked: false,
    };
  },
  watch: {
    items() {
      this.first = 0;
    },
    search() {
      this.first = 0;
    },
    // Fires on every render where rows are actually on screen; only the first one (per
    // heightLocked) does anything -- see lockedScrollHeight above.
    sortedItems: {
      immediate: true,
      handler(rows) {
        if (this.heightLocked || !rows.length) return;
        this.$nextTick(() => {
          if (this.heightLocked) return;
          const container = this.$refs.tableRef?.$el?.querySelector('.p-datatable-table-container');
          const height = container?.getBoundingClientRect().height;
          if (!height) return;
          this.lockedScrollHeight = `${Math.ceil(height)}px`;
          this.heightLocked = true;
        });
      },
    },
  },
  computed: {
    // itemsPerPage arrives as a string when callers pass it as a bare HTML attribute
    // (items-per-page="10" rather than :items-per-page="10") -- coerce once here rather than
    // passing that string straight into PrimeVue's :rows, whose internal pagination math (e.g.
    // first + rows) does numeric addition and silently string-concatenates instead on page 2+.
    rows() {
      return Number(this.itemsPerPage) || 10;
    },
    rowsPerPageOptions() {
      const options = [10, 25, 50, 100];
      if (!options.includes(this.rows)) {
        return [...options, this.rows].sort((a, b) => a - b);
      }
      return options;
    },
    filteredItems() {
      const query = (this.search ?? '').toString().trim().toLowerCase();
      if (!query) return this.items;
      const filterKeys = this.headers.map((h) => h.key);
      return this.items.filter((item) => {
        let defaultMatched = false;
        let customMatchedCount = 0;
        let customTotal = 0;
        for (const key of filterKeys) {
          const keyFilter = this.customKeyFilter[key];
          if (keyFilter) {
            customTotal += 1;
            if (keyFilter(this.getPath(item, key), query, { raw: item })) customMatchedCount += 1;
          } else if (this.defaultSubstringMatch(this.getPath(item, key), query)) {
            defaultMatched = true;
          }
        }
        if (this.filterMode === 'union') {
          return defaultMatched || customMatchedCount > 0;
        }
        // intersection (default): every custom filter that exists must match, AND (default
        // match OR there were no non-custom keys to match against).
        if (customTotal > 0 && customMatchedCount !== customTotal) return false;
        return defaultMatched || filterKeys.length === customTotal;
      });
    },
    sortedItems() {
      if (!this.internalSortBy.length) return this.filteredItems;
      const comparators = this.internalSortBy.map(({ key, order }) => {
        const header = this.headers.find((h) => h.key === key);
        const cmp = header?.sort ?? this.defaultCompare;
        const sign = order === 'desc' ? -1 : 1;
        return (a, b) => sign * cmp(this.getPath(a, key), this.getPath(b, key));
      });
      return [...this.filteredItems].sort((a, b) => {
        for (const cmp of comparators) {
          const result = cmp(a, b);
          if (result !== 0) return result;
        }
        return 0;
      });
    },
  },
  methods: {
    getPath(obj, path) {
      return path.split('.').reduce((value, key) => (value == null ? value : value[key]), obj);
    },
    defaultSubstringMatch(value, query) {
      if (value == null) return false;
      return String(value).toLowerCase().includes(query);
    },
    defaultCompare(a, b) {
      return String(a ?? '').localeCompare(String(b ?? ''));
    },
    getSortIcon(column) {
      const active = this.internalSortBy.find((s) => s.key === column.key);
      if (!active) return '';
      return active.order === 'desc' ? 'mdi-arrow-down' : 'mdi-arrow-up';
    },
    onSort(event) {
      if (this.multiSort) {
        this.internalSortBy = (event.multiSortMeta ?? []).map((m) => ({
          key: m.field,
          order: m.order === 1 ? 'asc' : 'desc',
        }));
      } else {
        this.internalSortBy = event.sortField
          ? [{ key: event.sortField, order: event.sortOrder === 1 ? 'asc' : 'desc' }]
          : [];
      }
    },
    handleRowClick(event) {
      this.$emit('click:row', event.originalEvent, { item: event.data });
    },
    csvEscape(value) {
      const str = value == null ? '' : String(value);
      return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    },
    resolveValue(header, item) {
      return typeof header.csvValue === 'function' ? header.csvValue(item) : this.getPath(item, header.key);
    },
    download(format) {
      if (!this.items.length) return;
      let content;
      let mimeType;
      let filename = this.filename;

      if (format === 'json') {
        const rows = this.items.map((item) => Object.fromEntries(
          this.headers.map((h) => [h.key, this.resolveValue(h, item)]),
        ));
        content = JSON.stringify(rows, null, 2);
        mimeType = 'application/json';
        filename = filename.replace(/\.csv$/, '.json');
      } else if (format === 'txt') {
        const headerLine = this.headers.map((h) => h.title).join('\t');
        const lines = this.items.map((item) => this.headers.map((h) => this.resolveValue(h, item) ?? '').join('\t'));
        content = [headerLine, ...lines].join('\n');
        mimeType = 'text/plain';
        filename = filename.replace(/\.csv$/, '.txt');
      } else {
        const headerRow = this.headers.map((h) => this.csvEscape(h.title));
        const rows = this.items.map((item) => this.headers.map((h) => this.csvEscape(this.resolveValue(h, item))));
        content = [headerRow, ...rows].map((row) => row.join(',')).join('\r\n');
        mimeType = 'text/csv;charset=utf-8;';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
};
</script>

<style scoped>
/* PrimeVue's Aura preset defaults to its own (light) surface colors, which otherwise stay
   fixed regardless of the app's Vuetify theme -- darkModeSelector is disabled in main.js
   specifically so this component drives all of PrimeVue's colors from Vuetify's own
   reactive --v-theme-* vars instead. */
.downloadable-data-table :deep(.p-datatable-table),
.downloadable-data-table :deep(.p-datatable-header-cell),
.downloadable-data-table :deep(.p-datatable-tbody > tr),
.downloadable-data-table :deep(.p-paginator) {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}
.downloadable-data-table :deep(.p-datatable-header-cell) {
  border-color: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-on-surface-variant));
}
.downloadable-data-table :deep(.p-datatable-tbody > tr > td) {
  border-color: rgb(var(--v-theme-surface-variant)) !important;
}
.downloadable-data-table :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}
.downloadable-data-table :deep(.p-paginator .p-paginator-page.p-highlight) {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.downloadable-data-table :deep(.p-paginator .p-paginator-page),
.downloadable-data-table :deep(.p-paginator .p-paginator-prev),
.downloadable-data-table :deep(.p-paginator .p-paginator-next),
.downloadable-data-table :deep(.p-paginator .p-paginator-first),
.downloadable-data-table :deep(.p-paginator .p-paginator-last) {
  color: rgb(var(--v-theme-on-surface));
}
/* Header content/sort icon are rendered by this component's own #header template (see
   getSortIcon), not PrimeVue's -- hide PrimeVue's own auto-appended sort icon so there's
   only one indicator per column. */
.downloadable-data-table :deep(.p-datatable-sort-icon) {
  display: none;
}
</style>

<style>
/* Unscoped: the rows-per-page dropdown's option list is a PrimeVue overlay panel teleported
   to <body>, so it's no longer a DOM descendant of .downloadable-data-table by the time it
   renders -- scoped :deep() selectors above can't reach it. Global colors instead. */
.p-select-overlay {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border-color: rgb(var(--v-theme-surface-variant)) !important;
}
.p-select-overlay .p-select-option {
  color: rgb(var(--v-theme-on-surface)) !important;
}
.p-select-overlay .p-select-option.p-select-option-selected {
  background: rgba(var(--v-theme-primary), 0.16) !important;
}
.p-select-overlay .p-select-option:not(.p-select-option-selected):hover {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}
</style>
