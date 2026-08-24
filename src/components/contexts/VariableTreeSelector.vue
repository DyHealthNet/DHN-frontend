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
      :selected="treeSelected"
      @update:selected="onTreeSelectedUpdate"
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
      // debounced copy of the `items` pool this tree is built from. When this component
      // is bound to another selection (e.g. the missingness tree's pool = the main
      // tree's selectedVariables), `items` gets a brand-new array on literally every
      // click over there, forcing a full tree-structure rebuild + VTreeview
      // re-registration each time even though nothing about THIS tree's own interaction
      // changed. Debouncing lets rapid clicking settle before paying that cost once.
      debouncedItems: this.items,
      itemsDebounceTimer: null,
      // VTreeview's OWN copy of the selection, seeded from modelValue but deliberately
      // NOT kept in lockstep with it on every click - see onTreeSelectedUpdate() for why.
      treeSelected: [...this.modelValue],
      // what we last told the parent, so the modelValue watcher below can tell "the
      // parent echoed our own emit back down" apart from "something external changed
      // the selection" (a saved context finishing its load, a sibling selector's
      // change, etc.) without needing to re-seed the tree on every single click.
      lastEmitted: [...this.modelValue],
    };
  },
  watch: {
    search(value) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.debouncedSearch = value;
      }, 250);
    },
    items(newVal) {
      // skip the debounce entirely when the pool only changed by REFERENCE, not
      // content (e.g. an upstream .filter() that happened to remove nothing) - no
      // rebuild needed either way in that case.
      if (newVal.length === this.debouncedItems.length) {
        const currentSet = new Set(this.debouncedItems);
        if (newVal.every(v => currentSet.has(v))) {
          return;
        }
      }
      clearTimeout(this.itemsDebounceTimer);
      this.itemsDebounceTimer = setTimeout(() => {
        this.debouncedItems = newVal;
      }, 250);
    },
    // VTreeview's select-strategy="classic" recomputes checked/indeterminate state for
    // an entire pre-selected set by walking every item's ancestors and rescanning ALL
    // of their siblings - correct, but expensive for a large selection. It only NEEDS
    // to run once, whenever the selection is seeded from outside (mount, a saved
    // context arriving, an external reset). Reassigning `:selected` in lockstep with
    // every single click - e.g. via v-model:selected bound straight to modelValue -
    // forces that full expensive recompute on every click too, which is what made this
    // feel laggy. So: only re-seed treeSelected when modelValue changed for a reason
    // OTHER than us just having emitted it a moment ago.
    modelValue(newVal) {
      const isOwnEcho = newVal.length === this.lastEmitted.length
        && newVal.every(v => this.lastEmittedSet.has(v));
      if (!isOwnEcho) {
        this.treeSelected = [...newVal];
        this.lastEmitted = newVal;
      }
    },
  },
  beforeUnmount() {
    clearTimeout(this.searchDebounceTimer);
    clearTimeout(this.itemsDebounceTimer);
  },
  computed: {
    lastEmittedSet() {
      return new Set(this.lastEmitted);
    },
    // Layer -> Subgroup (where one exists) -> Variable. Pseudo ids for the layer/
    // subgroup branch nodes are never real variable identifiers - with select-strategy
    // "classic", clicking one of them cascades selection to every descendant leaf (and
    // updates ancestor indeterminate/checked state), but its own id never leaks into
    // modelValue: VTreeview's "classic" out() transform already excludes any id that has
    // children, so only real variable identifiers ever come back through update:selected.
    treeItems() {
      const layerEntries = new Map();
      for (const identifier of this.debouncedItems) {
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
    // Fired on every click - just relay it up. Deliberately does NOT touch
    // treeSelected: VTreeview already applied the click to its own internal state
    // directly (the cheap path), so reassigning treeSelected here would only force the
    // expensive re-seed for no reason - see the modelValue watcher above.
    onTreeSelectedUpdate(value) {
      this.lastEmitted = value;
      this.$emit('update:modelValue', value);
    },
    // Bulk actions originate OUTSIDE the tree's own click handling, so they do need to
    // explicitly reseed treeSelected (one deliberate full recompute, same as loading a
    // saved selection).
    selectAll() {
      const value = [...this.items];
      this.treeSelected = value;
      this.lastEmitted = value;
      this.$emit('update:modelValue', value);
    },
    deselectAll() {
      this.treeSelected = [];
      this.lastEmitted = [];
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
