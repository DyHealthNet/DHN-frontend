<template>
  <v-expansion-panels :variant="expansionPanelVariant">
      <v-expansion-panel>
        <v-expansion-panel-title>
            <v-icon color="primary-darken-1" size="30" class="mr-3 my-0">mdi-cog-outline</v-icon>
            <span :class="{ 'text-h6': useAdvancedTitle }">Advanced settings</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <StatisticalTestLine :selected-tests="selectedTests"
                               :signThresh="signThresh"
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
      type: Object,
      default: () => ({
        contCont: false,
        catCat: false,
        multTest: false,
        catContB: false,
        catContM: false,
        signThresh: false,
      })
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
  methods: {
    updateData(data) {
      console.log("data ", data)
      this.$emit("data-changed", data);
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