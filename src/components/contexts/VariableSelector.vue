<template>
  <div>
    <v-autocomplete
        v-model="internalValue"
        v-model:search="searchQuery"
        :items="filteredItems"
        :readonly="disableSelections"
        multiple
        density="compact"
        variant="outlined"
        :placeholder="items.length ? 'Select variables...' : 'No variables available'"
        :menu-props="{maxWidth: 520, minWidth: 340}"
    >
      <template v-slot:selection="{ index }">
        <span v-if="index === 0" class="text-body-2">
          {{ internalValue.length }} variable{{ internalValue.length === 1 ? '' : 's' }} selected
        </span>
      </template>

      <!-- Same row layout as the network page's node dropdown and the Data Overview
           plot selectors: type icon, "display name (id)", description underneath. Falls
           back to the bare identifier for anything without catalog metadata. -->
      <template v-slot:item="{ props: itemProps, item }">
        <v-list-item
            v-bind="itemProps"
            :title="meta(item.value).title"
            :subtitle="meta(item.value).description || undefined"
        >
          <template v-slot:prepend>
            <v-checkbox-btn
                :model-value="internalValue.includes(item.value)"
                density="compact"
                class="me-1"
                tabindex="-1"
            ></v-checkbox-btn>
            <v-img
                v-if="meta(item.value).layer"
                :src="getIcon(meta(item.value).layer)"
                :alt="meta(item.value).layer"
                width="28"
                height="28"
                max-width="28"
                max-height="28"
                class="me-3 rounded-circle flex-grow-0"
            ></v-img>
          </template>
          <template v-slot:append>
            <span class="text-caption text-medium-emphasis ms-4">{{ meta(item.value).type }}</span>
          </template>
        </v-list-item>
      </template>
    </v-autocomplete>
    <div class="d-flex justify-end">
      <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-checkbox-multiple-marked-outline"
          :disabled="disableSelections"
          @click="selectAll"
      >Select All</v-btn>
      <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-checkbox-multiple-blank-outline"
          :disabled="disableSelections"
          @click="deselectAll"
      >Deselect All</v-btn>
    </div>
  </div>
</template>

<script>
import {getNodeIcon} from "@/components/network/networkData.js";

export default {
  name: 'VariableSelector',
  emits: ['update:modelValue'],
  props: {
    // full pool of selectable variable identifiers (already scoped by the caller - e.g.
    // to a single layer/sublayer)
    items: {
      type: Array,
      default: () => [],
    },
    // identifier -> selector item, for display only. Items stay plain identifier strings
    // so the emitted selection (and therefore the saved context payload) is unchanged.
    variableMeta: {
      type: Object,
      default: () => ({}),
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    disableSelections: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      searchQuery: '',
    };
  },
  computed: {
    internalValue: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
        // clear the typed search text after a pick, so the user isn't stuck manually
        // clearing it before searching for the next variable
        this.searchQuery = '';
      },
    },
    filteredItems() {
      if (!this.searchQuery) {
        return this.items.slice(0, 100);
      }
      const needle = this.searchQuery.toLowerCase();
      // Matches the same three fields the network page's node typeahead searches
      // server-side (id, display name, description), plus the raw identifier so a
      // variable without catalog metadata is still findable.
      return this.items.filter(identifier => {
        const variable = this.variableMeta[identifier];
        return [identifier, variable?.id, variable?.displayName, variable?.description].some(
            field => field && String(field).toLowerCase().includes(needle)
        );
      });
    },
  },
  methods: {
    // Display fields for one identifier; anything missing from the catalog still renders
    // as its bare identifier rather than an empty row.
    meta(identifier) {
      return this.variableMeta[identifier] ?? {title: identifier};
    },

    getIcon(layer) {
      return getNodeIcon(layer);
    },

    selectAll() {
      this.$emit('update:modelValue', [...this.items]);
    },
    deselectAll() {
      this.$emit('update:modelValue', []);
    },
  },
};
</script>
