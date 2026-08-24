<template>
  <div class="layer-variable-selector">
    <div v-for="layer in layerGroups" :key="layer.key" class="layer-entry">
      <div class="d-flex align-center">
        <v-checkbox
            :model-value="layer.checked"
            :indeterminate="layer.indeterminate"
            :readonly="disableSelections"
            density="compact"
            hide-details
            @update:model-value="toggleLayer(layer)"
        ></v-checkbox>
        <span
            class="layer-label clickable"
            @click="openModal(layer.key, null, layer.title)"
        >{{ layer.title }} ({{ layer.selectedCount }}/{{ layer.totalCount }})</span>
      </div>

      <div v-if="layer.subgroups.length" class="subgroup-list">
        <div v-for="subgroup in layer.subgroups" :key="subgroup.key" class="d-flex align-center">
          <v-checkbox
              :model-value="subgroup.checked"
              :indeterminate="subgroup.indeterminate"
              :readonly="disableSelections"
              density="compact"
              hide-details
              @update:model-value="toggleSubgroup(layer, subgroup)"
          ></v-checkbox>
          <span
              class="layer-label clickable"
              @click="openModal(layer.key, subgroup.name, `${layer.title} / ${subgroup.name}`)"
          >{{ subgroup.name }} ({{ subgroup.selectedCount }}/{{ subgroup.totalCount }})</span>
        </div>
      </div>
    </div>

    <v-dialog v-model="modalOpen" max-width="520">
      <v-card v-if="modalOpen">
        <v-card-title>{{ modalTitle }}</v-card-title>
        <v-card-text>
          <VariableSelector
              :items="modalPool"
              :model-value="modalWorking"
              @update:model-value="modalWorking = $event"
          ></VariableSelector>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="cancelModal">Cancel</v-btn>
          <v-btn color="primary" @click="confirmModal">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import VariableSelector from "@/components/contexts/VariableSelector.vue";

export default {
  name: 'LayerVariableSelector',
  components: {VariableSelector},
  emits: ['update:modelValue'],
  props: {
    // full pool of selectable variable identifiers to group into Layer -> Sublayer
    items: {
      type: Array,
      default: () => [],
    },
    // lowercase-keyed maps: variable identifier -> layer / subgroup
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
      modalOpen: false,
      modalPool: [],
      modalWorking: [],
      modalTitle: '',
    };
  },
  computed: {
    selectedSet() {
      return new Set(this.modelValue);
    },
    // layerKey -> {all: [identifiers], subgroups: Map(subgroupName -> [identifiers])} -
    // one O(N) pass over `items`, never repeated per layer/subgroup lookup.
    variablesByLayer() {
      const result = new Map();
      for (const identifier of this.items) {
        const layerKey = this.variableLayers[identifier];
        if (!layerKey) {
          continue;
        }
        if (!result.has(layerKey)) {
          result.set(layerKey, {all: [], subgroups: new Map()});
        }
        const entry = result.get(layerKey);
        entry.all.push(identifier);
        const subgroup = this.variableSubLayers[identifier];
        if (subgroup) {
          if (!entry.subgroups.has(subgroup)) {
            entry.subgroups.set(subgroup, []);
          }
          entry.subgroups.get(subgroup).push(identifier);
        }
      }
      return result;
    },
    // Display/checkbox state for every layer (and its subgroups), derived straight from
    // modelValue - counts only, O(pool size) total across all layers combined, never a
    // per-item DOM node, so this stays cheap regardless of catalog size.
    layerGroups() {
      const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
      const selected = this.selectedSet;
      const groups = [];
      for (const [layerKey, entry] of this.variablesByLayer) {
        const selectedCount = entry.all.filter(v => selected.has(v)).length;
        const subgroups = [...entry.subgroups.entries()].map(([name, vars]) => {
          const subSelectedCount = vars.filter(v => selected.has(v)).length;
          return {
            key: `${layerKey}:${name}`,
            name,
            vars,
            totalCount: vars.length,
            selectedCount: subSelectedCount,
            checked: vars.length > 0 && subSelectedCount === vars.length,
            indeterminate: subSelectedCount > 0 && subSelectedCount < vars.length,
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
        groups.push({
          key: layerKey,
          title: capitalize(layerKey),
          vars: entry.all,
          totalCount: entry.all.length,
          selectedCount,
          checked: entry.all.length > 0 && selectedCount === entry.all.length,
          indeterminate: selectedCount > 0 && selectedCount < entry.all.length,
          subgroups,
        });
      }
      groups.sort((a, b) => a.title.localeCompare(b.title));
      return groups;
    },
  },
  methods: {
    toggleLayer(layer) {
      const selected = new Set(this.modelValue);
      const shouldSelect = !layer.checked;
      layer.vars.forEach(v => shouldSelect ? selected.add(v) : selected.delete(v));
      this.$emit('update:modelValue', [...selected]);
    },
    toggleSubgroup(layer, subgroup) {
      const selected = new Set(this.modelValue);
      const shouldSelect = !subgroup.checked;
      subgroup.vars.forEach(v => shouldSelect ? selected.add(v) : selected.delete(v));
      this.$emit('update:modelValue', [...selected]);
    },
    openModal(layerKey, subgroupName, title) {
      if (this.disableSelections) {
        return;
      }
      const layer = this.variablesByLayer.get(layerKey);
      if (!layer) {
        return;
      }
      const pool = subgroupName ? (layer.subgroups.get(subgroupName) ?? []) : layer.all;
      this.modalPool = pool;
      this.modalTitle = title;
      const selected = this.selectedSet;
      this.modalWorking = pool.filter(v => selected.has(v));
      this.modalOpen = true;
    },
    confirmModal() {
      const selected = new Set(this.modelValue);
      const poolSet = new Set(this.modalPool);
      const workingSet = new Set(this.modalWorking);
      // replace just this scope's slice: drop everything in the modal's pool, then
      // re-add whatever the modal ended up with - leaves every other layer/sublayer's
      // selection untouched.
      poolSet.forEach(v => selected.delete(v));
      workingSet.forEach(v => selected.add(v));
      this.$emit('update:modelValue', [...selected]);
      this.modalOpen = false;
    },
    cancelModal() {
      this.modalOpen = false;
    },
  },
};
</script>

<style scoped>
.layer-variable-selector {
  display: flex;
  flex-direction: column;
}

.layer-entry {
  margin-bottom: 4px;
}

.subgroup-list {
  margin-left: 28px;
}

.layer-label {
  user-select: none;
}

.layer-label.clickable {
  cursor: pointer;
}

.layer-label.clickable:hover {
  text-decoration: underline;
}
</style>
