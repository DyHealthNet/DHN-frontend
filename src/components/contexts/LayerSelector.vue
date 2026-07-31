<template>
  <div class="layer-selector">
    <div v-for="layer in layers" :key="layer" class="layer-entry">
      <v-checkbox
          :model-value="isLayerChecked(layer)"
          :indeterminate="isLayerIndeterminate(layer)"
          :readonly="disableSelections"
          :label="layer"
          density="compact"
          hide-details
          @update:model-value="toggleLayer(layer)"
      ></v-checkbox>

      <div v-if="subLayersFor(layer).length" class="subgroup-list">
        <v-checkbox
            v-for="subgroup in subLayersFor(layer)"
            :key="subgroup"
            :model-value="isSubgroupChecked(layer, subgroup)"
            :readonly="disableSelections"
            :label="subgroup"
            density="compact"
            hide-details
            @update:model-value="toggleSubgroup(layer, subgroup)"
        ></v-checkbox>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LayerSelector',
  emits: ['update:selectedLayers', 'update:selectedSubLayers'],
  props: {
    // Capitalized display names, e.g. ["Phenotype", "Proteins"].
    layers: {
      type: Array,
      default: () => [],
    },
    // Raw lowercase-keyed map of layer -> its subgroup names, e.g. {phenotype: [...]}.
    layerSubLayers: {
      type: Object,
      default: () => ({}),
    },
    // Capitalized display names currently selected, matching entries in `layers`.
    selectedLayers: {
      type: Array,
      default: () => [],
    },
    // Raw lowercase-keyed map of layer -> its selected subgroup names. A layer absent
    // from this map is unrestricted (all its subgroups count as selected) - this is
    // what keeps a context saved before subgroups existed showing everything checked.
    selectedSubLayers: {
      type: Object,
      default: () => ({}),
    },
    disableSelections: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    rawKey(layer) {
      return layer.toLowerCase();
    },

    subLayersFor(layer) {
      return this.layerSubLayers[this.rawKey(layer)] ?? [];
    },

    isLayerChecked(layer) {
      return this.selectedLayers.includes(layer);
    },

    isLayerIndeterminate(layer) {
      return this.isLayerChecked(layer) && this.rawKey(layer) in this.selectedSubLayers;
    },

    isSubgroupChecked(layer, subgroup) {
      if (!this.isLayerChecked(layer)) {
        return false;
      }
      const raw = this.rawKey(layer);
      if (!(raw in this.selectedSubLayers)) {
        return true;
      }
      return this.selectedSubLayers[raw].includes(subgroup);
    },

    toggleLayer(layer) {
      const raw = this.rawKey(layer);
      const newSelectedSubLayers = {...this.selectedSubLayers};
      delete newSelectedSubLayers[raw];

      const newSelectedLayers = this.isLayerChecked(layer)
          ? this.selectedLayers.filter(l => l !== layer)
          : [...this.selectedLayers, layer];

      this.$emit('update:selectedLayers', newSelectedLayers);
      this.$emit('update:selectedSubLayers', newSelectedSubLayers);
    },

    toggleSubgroup(layer, subgroup) {
      const raw = this.rawKey(layer);
      const allSubgroups = this.subLayersFor(layer);
      const current = raw in this.selectedSubLayers ? this.selectedSubLayers[raw] : [...allSubgroups];

      const updated = current.includes(subgroup)
          ? current.filter(s => s !== subgroup)
          : [...current, subgroup];

      const newSelectedSubLayers = {...this.selectedSubLayers};
      const newSelectedLayers = [...this.selectedLayers];
      const layerIndex = newSelectedLayers.indexOf(layer);

      if (updated.length === 0) {
        // last subgroup unchecked - deselect the parent layer entirely
        delete newSelectedSubLayers[raw];
        if (layerIndex !== -1) {
          newSelectedLayers.splice(layerIndex, 1);
        }
      } else if (updated.length === allSubgroups.length) {
        // back to fully selected - drop the narrowing entry, not just an empty array
        delete newSelectedSubLayers[raw];
        if (layerIndex === -1) {
          newSelectedLayers.push(layer);
        }
      } else {
        newSelectedSubLayers[raw] = updated;
        if (layerIndex === -1) {
          newSelectedLayers.push(layer);
        }
      }

      this.$emit('update:selectedLayers', newSelectedLayers);
      this.$emit('update:selectedSubLayers', newSelectedSubLayers);
    },
  },
};
</script>

<style scoped>
.layer-selector {
  display: flex;
  flex-direction: column;
}

.layer-entry {
  margin-bottom: 4px;
}

.subgroup-list {
  margin-left: 28px;
}
</style>
