<template>
  <v-expansion-panels :variant="expansionPanelVariant" :key="panelKey">
      <v-expansion-panel>
        <v-expansion-panel-title>
            <v-icon color="primary-darken-1" size="30" class="mr-3 my-0">mdi-cog-outline</v-icon>
            <span :class="{ 'text-h6': useAdvancedTitle }">Advanced settings</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <StatisticalTestLine :selected-tests="selectedTests"
                               :sign-thresh="signThresh"
                               :disable-selections="disableSelections"
                               :show-mult-test="showMultTest"
                               :showHeader="showHeader"
                               :headerText="headerText"
                               @data-changed="updateData" />
          <template v-if="topNodesNumber != null && topPerNodeCount != null">
            <v-divider class="my-4"></v-divider>
            <NetworkEdgeLine :topNodesNumber="topNodesNumber"
                             :topPerNodeCount="topPerNodeCount"
                               @data-changed="updateData" />
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
</template>

<script>
import StatisticalTestLine from "@/components/StatisticalTestLine.vue";
import NetworkEdgeLine from "@/components/network/NetworkEdgeLine.vue";

export default {
  name: "AdvancedSettings",
  components: { StatisticalTestLine, NetworkEdgeLine },
  props: {
    selectedTests: {
      type: Object,
      required: false,
    },
    signThresh: {
      type: Number,
      required: false,
    },
    disableSelections: {
      type: Boolean,
      default: false,
    },
    expansionPanelVariant: {
      type: String,
      default: "popout",
    },
    useAdvancedTitle: {
      type: Boolean,
      default: false,
    },
    showMultTest: {
      type: Boolean,
      default: false,
    },
    showHeader: {
      type: Boolean,
      default: false,
    },
    headerText: {
      type: String,
      default: "Network Statistics Configuration",
    },
    topNodesNumber: {
      type: Number,
      required: false,
    },
    topPerNodeCount: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {
      panelKey: 0,  // Initial key to trigger re-render
      expandedPanels: [0], // Track the panel's open/closed state
    };
  },
  emits: ['dataChanged'], // Declare the event
  methods: {
    updateData(data) {
      //this.panelKey++;
      this.$emit("dataChanged", data);
      console.log("data ", data)
    },
  },
};
</script>

<style scoped>
.advanced-title {
  font-size: 2rem !important; /* Add !important to force the style */
  font-weight: 800;
}
</style>