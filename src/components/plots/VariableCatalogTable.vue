<template>
  <v-card outlined>
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Variable Overview
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-icon class="ml-1" v-bind="props">mdi-information</v-icon>
          </template>
          <span>
            Browse all variables by group and click one to add its plot to the Data Overview panel below.
          </span>
        </v-tooltip>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search variable"
          density="compact"
          variant="outlined"
          hide-details
          single-line
          class="mr-1"
          style="max-width: 220px"
      ></v-text-field>
    </v-toolbar>

    <v-tabs v-model="activeGroup" bg-color="primary-darken-1" show-arrows density="compact">
      <v-tab v-for="group in groups" :key="group" :text="group" :value="group"></v-tab>
    </v-tabs>

    <DownloadableDataTable
        :headers="headers"
        :items="items"
        :search="search"
        :sort-by="[{ key: 'id', order: 'asc' }]"
        multi-sort
        :loading="loading"
        items-per-page="10"
        class="variable-catalog-table"
        filename="variable-catalog.csv"
        @click:row="onRowClick"
    >
      <template v-slot:item.id="{ item }">
        <span>{{ item.id }}</span>
      </template>
      <template v-slot:item.displayName="{ item }">
        {{ item.displayName || '-' }}
      </template>
      <template v-slot:item.description="{ item }">
        {{ item.description || '-' }}
      </template>
      <template v-slot:item.subgroup="{ item }">
        {{ item.subgroup || '-' }}
      </template>
      <template v-slot:item.missingCount="{ item }">
        {{ item.missingCount }}
      </template>
      <template v-slot:no-data>
        <span class="text-medium-emphasis">No variables available for this group.</span>
      </template>
    </DownloadableDataTable>
  </v-card>
</template>

<script>
import DownloadableDataTable from "@/components/DownloadableDataTable.vue";
import {PLOT_TYPES, TYPE_LABELS, fetchVariableCatalog} from "@/components/plots/variableCatalog.js";

export default {
  name: "VariableCatalogTable",
  components: {DownloadableDataTable},
  props: {
    contextValue: {
      type: Number,
      required: false,
      default: null,
    },
    // Identifiers of variables currently shown in the plot grid, so their rows can be highlighted.
    activeIdentifiers: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['add-variable'],
  data() {
    return {
      catalog: null,
      activeGroup: null,
      search: '',
      loading: false,
      // Optional per-source columns (description/displayName/subgroup aren't configured
      // for every data source - e.g. metabolites have no display name) - each is only
      // shown while browsing a group where at least one variable actually has a value
      // for it, rather than as a column full of '-' placeholders.
      optionalColumns: [
        {title: 'Display Name', key: 'displayName'},
        {title: 'Description', key: 'description'},
        {title: 'Subgroup', key: 'subgroup', width: 160},
      ],
    };
  },
  computed: {
    headers() {
      return [
        {title: 'ID', key: 'id'},
        ...this.optionalColumns.filter((column) => this.items.some((item) => item[column.key])),
        {title: 'Type', key: 'type', width: 140},
        {title: 'Missing', key: 'missingCount', width: 110},
      ];
    },
    groups() {
      return this.catalog?.availableLayers || [];
    },
    allItems() {
      return (this.catalog?.variables || []).map((variable) => ({
        identifier: variable.identifier,
        id: variable.id,
        description: variable.description,
        displayName: variable.displayName,
        subgroup: variable.subgroup,
        missingCount: variable.missingCount,
        layer: variable.layer,
        type: TYPE_LABELS[variable.group] || variable.group,
        plotType: PLOT_TYPES[variable.group] || 'Bar',
      }));
    },
    items() {
      return this.allItems.filter((item) => item.layer === this.activeGroup);
    },
  },
  watch: {
    contextValue() {
      this.fetchVariables();
    },
  },
  created: async function () {
    await this.fetchVariables();
  },
  methods: {
    async fetchVariables() {
      this.loading = true;
      try {
        this.catalog = await fetchVariableCatalog(this.contextValue);

        if (!this.activeGroup || !this.groups.includes(this.activeGroup)) {
          this.activeGroup = this.groups[0] || null;
        }
      } catch (error) {
        console.error("Error fetching variable catalog:", error);
      } finally {
        this.loading = false;
      }
    },
    isSelected(item) {
      return this.activeIdentifiers.includes(item.identifier);
    },
    onRowClick(_, {item}) {
      this.$emit('add-variable', {identifier: item.identifier, plotType: item.plotType});
    },
  },
};
</script>

<style scoped>
.variable-catalog-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
