<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <p><b>Network Build Configurations</b></p>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <p>Node Count Configuration (Connect Nodes)</p>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-text-field
          v-model="internalTopNodesNumber"
          :label="internalTopPerNodeCount ? 'Top significant Nodes per Type' : 'Top significant Nodes'"
          type="number"
          :rules="[value => (value >= 1 && value <= 50) || 'Must be between 1 and 50']"
          density="compact"
          variant="outlined"
          @update:model-value="updateTopNodesNumber"
          @blur="validateNodesNumberInput"
        />
      </v-col>
      <v-col cols="4" class="d-flex pa-0 justify-center">
        <v-switch
          v-model="internalTopPerNodeCount"
          @update:model-value="updateTopPerNodeCount"
          color="primary"
        >
          <template #prepend>
            <span class="text-muted">Overall</span>
          </template>
          <template #append>
            <span class="text-muted">Per Node Type</span>
          </template>
        </v-switch>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  emits: ["dataChanged"],
  name: "NetworkEdgeLine",
  props: {
    topNodesNumber: { type: Number, required: true },
    topPerNodeCount: { type: Boolean, required: true },
  },
  data() {
    return {
      internalTopNodesNumber: parseInt(this.topNodesNumber),
      internalTopPerNodeCount: this.topPerNodeCount,
    };
  },
  methods: {
    validateNodesNumberInput() {
      const parsedValue = parseInt(this.internalTopNodesNumber);
      if (isNaN(parsedValue) || parsedValue < 1 ) {
        // Reset to default if the input is invalid
        this.internalTopNodesNumber = 1;
      } else if (isNaN(parsedValue) || parsedValue > 50){
        // Optionally: Clamp the value to the allowed range
        this.internalTopNodesNumber = 50;
      }
    },
    // Watch for changes in local data and emit event
    updateTopNodesNumber(newValue) {
      this.internalTopNodesNumber = newValue;
      this.$emit("dataChanged", { topNodesNumber: this.internalTopNodesNumber });
    },
    updateTopPerNodeCount(newValue) {
      this.internalTopPerNodeCount = newValue;
      this.$emit("dataChanged", { topPerNodeCount: this.internalTopPerNodeCount });
    },
  },
  // So that changes in the parent are shown in the child component (e.g. if context changes correct
  // values are immediately re-rendered)
  watch: {
    topNodesNumber(newValue) {
      this.internalTopNodesNumber = newValue;
    },
    topPerNodeCount(newValue) {
      this.internalTopPerNodeCount = newValue;
    },
  },
};
</script>

<style scoped>
.switch-text {
  color: rgb(var(--v-theme-primary-darken-1));
}
</style>