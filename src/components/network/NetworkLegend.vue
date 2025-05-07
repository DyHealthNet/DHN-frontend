<template>
  <div class="legend">
    <v-row v-for="(group, groupKey) in groups" :key="groupKey" align="center" class="mb-2" no-gutters>
      <v-col v-if="includedNodeTypes.has(groupKey)" cols="auto" class="legend-dot">
        <div class="legend-color" :style="getShapeStyle(group.color, groupKey)"></div>
      </v-col>
      <v-col v-if="includedNodeTypes.has(groupKey)" cols="auto" class="legend-text">
        <span>{{ capitalizeFirstLetter(groupKey) }}</span>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import {groups} from "@/components/network/networkData.js";
import {capitalizeFirstLetter} from "@/components/generalFunctions.js";

export default {
  name: "NetworkLegend",
  props: {
    includedNodeTypes: {
      type: Object,
      required: true,
    },
  },
  computed: {
    groups() {
      return groups
    },
  },
  methods: {
    capitalizeFirstLetter,
    getShapeStyle(color, key) {
      // not applicable right now or only for externals
      if (key === "gene" || key === "disorder") {
        return {
          borderRadius: "50%",
          backgroundColor: color,
          width: "20px",
          height: "20px",
          border: "3px solid black",
        };
      }
      return {borderRadius: "50%", backgroundColor: color, width: "20px", height: "20px"};
    },
  }
};
</script>

<style scoped>
.legend-color {
  margin-right: 10px; /* Space between the color and the text */
}
/* Style for the legend container */
.legend {
  position: absolute;  /* Position relative to the nearest positioned ancestor (network container) */
  bottom: 25px;  /* Adjust the bottom margin */
  left: 10px;    /* Adjust the left margin */
  background: transparent;  /* Transparent background */
  z-index: 10;  /* Ensure it appears above other elements */
}
</style>