<template>
  <v-expansion-panels :variant="expansionPanelVariant">
      <v-expansion-panel>
        <v-expansion-panel-title>
            <v-icon color="primary-darken-1" size="30" class="mr-3 my-0">mdi-cog-outline</v-icon>
            <span>Whole Network Settings</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <StatisticalTestLine :selected-tests="selectedTests"
                               :density="density"
                               :read-only-correction="true"
                               :show-mult-test="false"
                               :show-density="true"
                               header-text="Whole Network Configuration"
                               @data-changed="updateData" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
</template>

<script>
import StatisticalTestLine from "@/components/StatisticalTestLine.vue";

export default {
  name: "WholeNetworkSettings",
  components: { StatisticalTestLine },
  props: {
    selectedTests: {
      type: Object,
      required: false,
    },
    density: {
      type: Number,
      default: 0.01,
    },
    expansionPanelVariant: {
      type: String,
      default: "default",
    },
  },
  emits: ['dataChanged'],
  methods: {
    // StatisticalTestLine emits its test-type/correction pair under the key
    // "selectedTests" -- the page already owns a top-level `selectedTests` used
    // by the node-search flow, so relabel it to `wholeNetworkTests` here before
    // it reaches the page's generic key -> this[key] assignment in
    // updateWholeNetworkSettings(), or it would silently clobber the node-search
    // state instead of this panel's own.
    updateData(data) {
      const remapped = { ...data };
      if ('selectedTests' in remapped) {
        remapped.wholeNetworkTests = remapped.selectedTests;
        delete remapped.selectedTests;
      }
      this.$emit("dataChanged", remapped);
    },
  },
};
</script>

<style scoped>
</style>
