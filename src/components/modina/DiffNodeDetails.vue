<template>
  <div v-if="node">
    <p><span class="label-title">Node</span></p>
    <p><span class="label">Name:</span><br>
      <span class="display-name">{{ node.id }}</span></p>
    <p v-if="node.type"><span class="label">Type:</span><br>
      <span class="value">{{ node.type }}</span></p>

    <v-table density="compact" class="mt-4">
      <tbody>
        <tr v-if="node.rank != null">
          <td class="label">Rank</td>
          <td class="value">{{ node.rank }}</td>
        </tr>
        <tr v-if="node.score != null">
          <td class="label">Ranking score</td>
          <td class="value">{{ formatNumber(node.score) }}</td>
        </tr>
        <tr v-if="node.nodeMetricValue != null">
          <td class="label">Node metric value</td>
          <td class="value">{{ formatNumber(node.nodeMetricValue) }}</td>
        </tr>
      </tbody>
    </v-table>

    <p class="label-subtitle mt-4">Incident edge statistics</p>
    <v-table density="compact" v-if="hasEdgeStats">
      <tbody>
        <tr v-if="node.edgeMin != null"><td class="label">Min</td><td class="value">{{ formatNumber(node.edgeMin) }}</td></tr>
        <tr v-if="node.edgeMax != null"><td class="label">Max</td><td class="value">{{ formatNumber(node.edgeMax) }}</td></tr>
        <tr v-if="node.edgeMedian != null"><td class="label">Median</td><td class="value">{{ formatNumber(node.edgeMedian) }}</td></tr>
        <tr v-if="node.edgeMean != null"><td class="label">Mean</td><td class="value">{{ formatNumber(node.edgeMean) }}</td></tr>
        <tr v-if="node.edgeSd != null"><td class="label">Std. dev.</td><td class="value">{{ formatNumber(node.edgeSd) }}</td></tr>
        <tr v-if="node.edgePercentileMean != null"><td class="label">Mean percentile rank</td><td class="value">{{ formatNumber(node.edgePercentileMean) }}</td></tr>
      </tbody>
    </v-table>
    <p v-else class="text-medium-emphasis text-body-2">No edge metric was selected, so no incident-edge statistics are available.</p>
  </div>
  <p v-else class="text-medium-emphasis text-body-2">Select a node in the graph or the node rank table to see its details.</p>
</template>

<script>
export default {
  name: 'DiffNodeDetails',
  props: {
    node: {
      type: Object,
      default: null,
    },
  },
  computed: {
    hasEdgeStats() {
      if (!this.node) return false;
      return ['edgeMin', 'edgeMax', 'edgeMedian', 'edgeMean', 'edgeSd', 'edgePercentileMean'].some(
        (key) => this.node[key] != null
      );
    },
  },
  methods: {
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(6);
    },
  },
};
</script>

<style scoped>
.label {
  font-size: 12px;
  color: rgb(var(--v-theme-primary-darken-1));
}
.label-subtitle {
  font-size: 16px;
  color: rgb(var(--v-theme-primary-darken-1));
}
.label-title {
  font-size: 24px;
  color: rgb(var(--v-theme-primary-darken-1));
  display: flex;
  justify-content: center;
  align-items: center;
}
.display-name {
  font-size: 18px;
  color: rgb(var(--v-theme-darken-1));
}
.value {
  padding-left: 0px;
}
</style>
