<template>
  <v-autocomplete
      v-model="internalValue"
      v-model:search="searchQuery"
      :items="filteredItems"
      :readonly="disableSelections"
      multiple
      density="compact"
      variant="outlined"
      :placeholder="items.length ? 'Select variables...' : 'No variables available'"
  >
    <template v-slot:selection="{ index }">
      <span v-if="index === 0" class="text-body-2">
        {{ internalValue.length }} variable{{ internalValue.length === 1 ? '' : 's' }} selected
      </span>
    </template>
    <template v-slot:item="{ item, props: itemProps }">
      <v-list-item v-bind="itemProps">
        <template v-slot:append>
          <v-chip v-if="itemChipLabel(item.raw)" size="x-small" variant="tonal" class="ml-2">
            {{ itemChipLabel(item.raw) }}
          </v-chip>
        </template>
      </v-list-item>
    </template>
    <template v-slot:prepend-item>
      <v-list-item title="Select All" :disabled="disableSelections" @click="selectAll">
        <template v-slot:prepend>
          <v-icon>mdi-checkbox-multiple-marked-outline</v-icon>
        </template>
      </v-list-item>
      <v-list-item title="Deselect All" :disabled="disableSelections" @click="deselectAll">
        <template v-slot:prepend>
          <v-icon>mdi-checkbox-multiple-blank-outline</v-icon>
        </template>
      </v-list-item>
      <v-divider class="mt-2"></v-divider>
    </template>
  </v-autocomplete>
</template>

<script>
export default {
  name: 'VariableSelector',
  emits: ['update:modelValue'],
  props: {
    // full pool of selectable variable identifiers (already filtered by layer/subgroup)
    items: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    disableSelections: {
      type: Boolean,
      default: false,
    },
    // lowercase-keyed maps: variable identifier -> layer / subgroup, used to render a
    // chip next to each row so the user has layer context while searching. Optional -
    // no chip is rendered for an identifier missing from variableLayers.
    variableLayers: {
      type: Object,
      default: () => ({}),
    },
    variableSubLayers: {
      type: Object,
      default: () => ({}),
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
      return this.items.filter(item =>
          item.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },
  methods: {
    selectAll() {
      this.$emit('update:modelValue', [...this.items]);
    },
    deselectAll() {
      this.$emit('update:modelValue', []);
    },
    itemChipLabel(identifier) {
      const layer = this.variableLayers[identifier];
      if (!layer) {
        return '';
      }
      const capitalized = layer.charAt(0).toUpperCase() + layer.slice(1);
      const subgroup = this.variableSubLayers[identifier];
      return subgroup ? `${capitalized} · ${subgroup}` : capitalized;
    },
  },
};
</script>
