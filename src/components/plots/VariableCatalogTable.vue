<template>
  <v-card outlined>
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Variable Overview
        <v-tooltip class="ml-1" bottom>
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
          class="mr-2"
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
        :custom-key-filter="{ identifier: variableSearchFilter }"
        filter-mode="union"
        :sort-by="[{ key: 'identifier', order: 'asc' }]"
        multi-sort
        :loading="loading"
        items-per-page="10"
        class="variable-catalog-table"
        filename="variable-catalog.csv"
        @click:row="onRowClick"
    >
      <template v-slot:item.identifier="{ item }">
        <span>{{ item.identifier }}</span>
      </template>
      <template v-slot:item.subgroup="{ item }">
        {{ item.subgroup || '-' }}
      </template>
      <template v-slot:no-data>
        <span class="text-medium-emphasis">No variables available for this group.</span>
      </template>
    </DownloadableDataTable>
  </v-card>
</template>

<script>
import {getCookie} from "@/components/authentication/auth.js";
import {BASE_URL} from "@/components/constants.js";
import DownloadableDataTable from "@/components/DownloadableDataTable.vue";

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
      allVariables: null,
      activeGroup: null,
      search: '',
      loading: false,
    };
  },
  computed: {
    headers() {
      return [
        {title: 'Variable', key: 'identifier'},
        {title: 'Subgroup', key: 'subgroup', width: 160},
        {title: 'Type', key: 'type', width: 140},
      ];
    },
    groups() {
      return this.allVariables?.availableLayers || [];
    },
    allItems() {
      if (!this.allVariables) {
        return [];
      }
      const {continuous = [], binaryCategorical = [], nonbinaryCategorical = [],
             variableLayers = {}, variableSubLayers = {}} = this.allVariables;

      const buildItems = (identifiers, type, plotType) => identifiers.map((identifier) => ({
        identifier,
        group: variableLayers[identifier],
        subgroup: variableSubLayers[identifier],
        type,
        plotType,
      }));

      return [
        ...buildItems(continuous, 'Continuous', 'Density'),
        ...buildItems(binaryCategorical, 'Binary', 'Bar'),
        ...buildItems(nonbinaryCategorical, 'Categorical', 'Bar'),
      ];
    },
    items() {
      return this.allItems.filter((item) => item.group === this.activeGroup);
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
        const csrfToken = getCookie('csrftoken');
        let url = `${BASE_URL}/general/api/variables/`;

        if (this.contextValue) {
          url += `?contextValue=${encodeURIComponent(this.contextValue)}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        this.allVariables = await response.json();

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
    // Mirrors NodeRankPanel's nodeSearchFilter: v-data-table's built-in filter-keys only
    // reaches header columns, so this reads the raw row directly instead.
    variableSearchFilter(_value, query, item) {
      const q = String(query ?? '').toLowerCase();
      if (!q) return true;
      const raw = item?.raw || {};
      const haystack = `${raw.identifier ?? ''} ${raw.subgroup ?? ''}`.toLowerCase();
      return haystack.includes(q);
    },
  },
};
</script>

<style scoped>
.variable-catalog-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
