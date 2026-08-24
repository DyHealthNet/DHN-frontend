<template>
  <v-text-field
      v-model="search"
      density="compact"
      variant="outlined"
      prepend-inner-icon="mdi-magnify"
      placeholder="Search variables..."
      clearable
      hide-details
      class="mb-2"
  ></v-text-field>

  <div class="d-flex mb-1">
    <v-btn size="small" variant="text" :disabled="disableSelections" @click="selectAll">Select All</v-btn>
    <v-btn size="small" variant="text" :disabled="disableSelections" @click="deselectAll">Deselect All</v-btn>
  </div>

  <v-treeview
      v-model:selected="internalValue"
      :items="treeItems"
      :search="debouncedSearch"
      selectable
      select-strategy="classic"
      density="compact"
      item-value="value"
      item-title="title"
      :disabled="disableSelections"
      class="variable-tree"
  >
    <template v-slot:no-data>
      <p class="text-medium-emphasis pl-2">No variables available.</p>
    </template>
  </v-treeview>

  <p class="text-caption mt-1">
    {{ modelValue.length }} variable{{ modelValue.length === 1 ? '' : 's' }} selected
  </p>
</template>

<script>
export default {
  name: 'VariableTreeSelector',
  emits: ['update:modelValue'],
  props: {
    // full pool of selectable variable identifiers to build the tree from
    items: {
      type: Array,
      default: () => [],
    },
    // lowercase-keyed maps: variable identifier -> layer / subgroup, used to group the
    // tree into Layer -> Subgroup (if any) -> Variable.
    variableLayers: {
      type: Object,
      default: () => ({}),
    },
    variableSubLayers: {
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
      search: '',
      // debounced copy of `search` fed to v-treeview's :search - re-filtering the whole
      // tree on every single keystroke is what made typing feel laggy on a large catalog.
      debouncedSearch: '',
      searchDebounceTimer: null,
    };
  },
  watch: {
    search(value) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.debouncedSearch = value;
      }, 250);
    },
  },
  beforeUnmount() {
    clearTimeout(this.searchDebounceTimer);
  },
  computed: {
    internalValue: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    // Layer -> Subgroup (where one exists) -> Variable. Pseudo ids for the layer/
    // subgroup branch nodes are never real variable identifiers - with select-strategy
    // "classic", clicking one of them cascades selection to every descendant leaf (and
    // updates ancestor indeterminate/checked state), but its own id never leaks into
    // modelValue: VTreeview's "classic" out() transform already excludes any id that has
    // children, so only real variable identifiers ever come back through update:selected.
    treeItems() {
      const layerEntries = new Map();
      for (const identifier of this.items) {
        const layerKey = this.variableLayers[identifier];
        if (!layerKey) {
          continue;
        }
        if (!layerEntries.has(layerKey)) {
          layerEntries.set(layerKey, {subgroups: new Map(), ungrouped: []});
        }
        const entry = layerEntries.get(layerKey);
        const subgroup = this.variableSubLayers[identifier];
        if (subgroup) {
          if (!entry.subgroups.has(subgroup)) {
            entry.subgroups.set(subgroup, []);
          }
          entry.subgroups.get(subgroup).push(identifier);
        } else {
          entry.ungrouped.push(identifier);
        }
      }

      const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
      const layers = [];
      for (const [layerKey, entry] of layerEntries) {
        const children = [];
        for (const [subgroup, identifiers] of entry.subgroups) {
          children.push({
            title: subgroup,
            value: `__subgroup__:${layerKey}:${subgroup}`,
            children: identifiers.map(identifier => ({title: identifier, value: identifier})),
          });
        }
        for (const identifier of entry.ungrouped) {
          children.push({title: identifier, value: identifier});
        }
        children.sort((a, b) => a.title.localeCompare(b.title));
        layers.push({title: capitalize(layerKey), value: `__layer__:${layerKey}`, children});
      }
      layers.sort((a, b) => a.title.localeCompare(b.title));
      return layers;
    },
  },
  methods: {
    selectAll() {
      this.$emit('update:modelValue', [...this.items]);
    },
    deselectAll() {
      this.$emit('update:modelValue', []);
    },
  },
};
</script>

<style scoped>
.variable-tree {
  max-height: 320px;
  overflow-y: auto;
}
</style>
