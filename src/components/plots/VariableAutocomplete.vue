<template>
  <v-autocomplete
      :model-value="modelValue"
      :items="items"
      :label="label"
      :custom-filter="matchesVariable"
      item-title="title"
      item-value="value"
      clearable
      variant="outlined"
      density="compact"
      no-data-text="No matching variable"
      :menu-props="{maxWidth: 480, minWidth: 340}"
      @update:model-value="$emit('update:modelValue', $event)"
  >
    <template v-slot:item="{ props: itemProps, item }">
      <v-list-item
          v-bind="itemProps"
          :title="item.raw.title"
          :subtitle="item.raw.description || undefined"
      >
        <template v-slot:prepend>
          <v-img
              :src="getIcon(item.raw.layer)"
              :alt="item.raw.layer"
              width="28"
              height="28"
              max-width="28"
              max-height="28"
              class="me-3 rounded-circle flex-grow-0"
          ></v-img>
        </template>
        <template v-slot:append>
          <span class="text-caption text-medium-emphasis ms-4">{{ item.raw.type }}</span>
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script>
import {getNodeIcon} from "@/components/network/networkData.js";

export default {
  name: "VariableAutocomplete",
  props: {
    modelValue: {
      type: String,
      default: null,
    },
    // Items from buildSelectorItems() (see variableCatalog.js).
    items: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: "Variable",
    },
  },
  emits: ['update:modelValue'],
  methods: {
    getIcon(layer) {
      return getNodeIcon(layer);
    },

    // Match the same three fields the network page's node typeahead searches server-side
    // (id, display name, description) instead of Vuetify's default title-only match. The
    // title only contains the display name and id, so without this a search for wording
    // that appears solely in the description silently finds nothing.
    matchesVariable(value, query, item) {
      if (!query) {
        return true;
      }

      const variable = item?.raw;
      if (!variable) {
        return false;
      }

      const needle = String(query).toLowerCase();
      return [variable.id, variable.displayName, variable.description].some(
        (field) => field && String(field).toLowerCase().includes(needle)
      );
    },
  },
};
</script>
