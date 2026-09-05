<template>
  <div class="downloadable-data-table">
    <div v-if="multiSort || $slots['toolbar-start']" class="d-flex align-center mb-1" style="gap: 8px; justify-content: space-between;">
      <div><slot name="toolbar-start" /></div>
      <span v-if="multiSort" class="text-caption text-medium-emphasis">Ctrl/Cmd+click a column to multi-sort by more than one column</span>
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
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink PaginatorEnd"
      currentPageReportTemplate="{first} to {last} of {totalRecords}"
      density="compact"
      scrollable
      :scroll-height="lockedScrollHeight"
    >
      <template #paginatorend>
        <div class="downloadable-data-table__download">
          <Button
            type="button"
            icon="pi pi-download"
            class="p-button-text p-button-secondary"
            :disabled="!items.length"
            @click="onMenuClick"
            aria-haspopup="true"
            aria-controls="download_menu"
          />
          <Menu id="download_menu" ref="menuRef" :model="downloadItems" :popup="true" />
        </div>
      </template>

      <Column
        v-for="header in headers"
        :key="header.key"
        :field="header.key"
        :header="$slots['header.' + header.key] ? undefined : header.title"
        :sortable="header.sortable !== false"
        :style="header.width ? { width: header.width + 'px' } : undefined"
      >
        <template v-if="$slots['header.' + header.key]" #header>
          <slot
            :name="'header.' + header.key"
            :column="{ title: header.title, key: header.key, sortable: header.sortable !== false }"
          />
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
import Menu from 'primevue/menu';
import Button from 'primevue/button';

export default {
  name: 'DownloadableDataTable',
  components: { DataTable, Column, Menu, Button },
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
      // in -- without correcting it here, swapping in a smaller `items` array (e.g. after
      // switching context) or narrowing via search can leave the table stuck on a page past
      // the end of the new data, so the visible "Rank" column starts well past 1 even though
      // rankEdges/computeWeightedDegree always number the underlying data starting at 1.
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
    // `items` is a new array reference on every render of callers whose rows are built by
    // mapping/spreading (e.g. NodeRankingTable/EdgeRankingTable's ranking computeds) -- that
    // includes renders where the actual rows/order/count are unchanged, such as a Details-panel
    // selection mutating a field on the underlying node/edge object elsewhere on the page. Only
    // correct `first` when the current page has actually fallen out of range for the new data,
    // rather than unconditionally jumping back to page 1 on every incidental reference change.
    items() {
      if (this.first >= this.sortedItems.length) {
        this.first = 0;
      }
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
    // Items for the paginator's download Menu -- reuses the same download() method/formats
    // the previous Vuetify v-menu/v-list offered, just presented as a PrimeVue Menu popup.
    downloadItems() {
      return [
        { label: 'Download CSV', icon: 'pi pi-file', command: () => this.download('csv') },
        { label: 'Download JSON', icon: 'pi pi-file', command: () => this.download('json') },
        { label: 'Download TXT', icon: 'pi pi-file', command: () => this.download('txt') },
      ];
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
    onMenuClick(event) {
      this.$refs.menuRef.toggle(event);
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
.downloadable-data-table__download {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* PrimeVue's Aura preset (see main.js's MyPreset) already makes the table/paginator
   backgrounds transparent so they inherit whatever Vuetify surface they're rendered
   inside (the v-card each table sits in). darkModeSelector is still disabled there
   though, so Aura's own text/foreground tokens stay fixed to its light scheme -- force
   those (and the border color) from Vuetify's reactive --v-theme-* vars here instead. */
.downloadable-data-table :deep(.p-datatable-table),
.downloadable-data-table :deep(.p-datatable-tbody > tr),
.downloadable-data-table :deep(.p-paginator) {
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
}
/* The header row is `position: sticky` (PrimeVue inline style), so unlike the rest of the
   table it needs an opaque background -- otherwise scrolled-past rows show through it as they
   pass underneath. rgb(var(--v-theme-surface)) is Vuetify's own reactive theme variable, so
   this already resolves to the right color in both light and dark theme, same as everywhere
   else in this file. */
.downloadable-data-table :deep(.p-datatable-thead),
.downloadable-data-table :deep(.p-datatable-header-cell) {
  background: rgb(var(--v-theme-surface));
  border-color: rgb(var(--v-theme-data-table-line)) !important;
  color: rgb(var(--v-theme-on-surface-variant));
}
.downloadable-data-table :deep(.p-datatable-tbody > tr > td) {
  border-color: rgb(var(--v-theme-data-table-line)) !important;
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
