<template>
  <div ref="rootEl">
  <div v-if="node">
    <v-icon
      v-if="getIcon"
      class="me-6"
      size="50"
      color="transparent"
      style="position: absolute; right: 0;"
    >
      <v-img
        :src="getIcon(node.group)"
        alt="icon"
        max-width="40"
        max-height="40"
        class="me-0 rounded-circle"
      ></v-img>
    </v-icon>
    <p><span class="label-title">Node</span></p>
    <p><span class="label">Name:</span><br>
      <span class="display-name">{{ node.display_name || node.id }}</span></p>
    <p v-if="node.type"><span class="label">Type:</span><br>
      <span class="value">{{ node.type }}</span></p>
    <p v-if="node.group"><span class="label">Group:</span><br>
      <v-chip size="small" :style="groupChipStyle">{{ capitalizeFirstLetter(node.group) }}</v-chip></p>
    <p v-if="node.description"><span class="label">Description:</span><br>
      <span class="value">{{ node.description }}</span></p>
    <p><span class="label">ID:</span><br>
      <span class="value">{{ node.id }}</span></p>

    <p class="label-subtitle mt-4">Ranking</p>
    <v-table density="compact">
      <tbody>
        <tr v-if="node.rank != null" class="font-weight-bold">
          <td class="label font-weight-bold">Rank{{ rankingAlgorithmLabel ? ` (${rankingAlgorithmLabel})` : '' }}</td>
          <td class="value font-weight-bold">{{ node.rank }}</td>
        </tr>
        <tr v-if="node.score != null" class="font-weight-bold">
          <td class="label font-weight-bold">Ranking score</td>
          <td class="value font-weight-bold">{{ formatNumber(node.score) }}</td>
        </tr>
        <tr v-if="node.nodeMetricRank != null">
          <td class="label">{{ nodeMetricLabel }} Rank</td>
          <td class="value">{{ node.nodeMetricRank }}</td>
        </tr>
        <tr v-if="node.nodeMetricValue != null">
          <td class="label">{{ nodeMetricLabel }} value</td>
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
    <p v-else class="text-medium-emphasis text-body-2">No edge available.</p>

    <template v-if="context1 && context2">
      <p class="label-subtitle mt-4">Distribution per context</p>
      <!-- Both variable types render the two contexts as one grouped plot: continuous
           variables as a density plot (see GetDataDensityPlotView's contextValue1/contextValue2
           mode), categorical variables as a bar chart grouped by context (GetDataBarCountView's
           contextValue1/contextValue2 mode). -->
      <OverviewDensity
        v-if="node.type === 'continuous'"
        :xVar="node.id"
        :context1="context1"
        :context2="context2"
        palette="muted"
        :textSize="13"
        :width="plotWidth"
        :height="260"
      />
      <OverviewBar
        v-else
        :xVar="node.id"
        :context1="context1"
        :context2="context2"
        barType="Grouped"
        barOrientation="Vertical"
        palette="muted"
        :textSize="13"
        :width="plotWidth"
        :height="260"
      />
    </template>
  </div>
  <p v-else class="text-medium-emphasis text-body-2">Select a node in the graph or the node rank table to see its details.</p>
  </div>
</template>

<script>
import OverviewBar from '@/components/plots/OverviewBar.vue';
import OverviewDensity from '@/components/plots/OverviewDensity.vue';
import { NODE_METRIC_INFO, RANKING_ALGORITHM_INFO, metricLabel } from './metricInfo.js';
import { capitalizeFirstLetter, getReadableTextColor } from '@/components/network/networkData.js';

export default {
  name: 'DiffNodeDetails',
  components: { OverviewBar, OverviewDensity },
  props: {
    node: {
      type: Object,
      default: null,
    },
    // Reported by the backend on the actual result -- null until a comparison has completed.
    nodeMetric: {
      type: String,
      default: null,
    },
    rankingAlgorithm: {
      type: String,
      default: null,
    },
    // The two compared contexts ({ contextValue, contextName }), so the distribution plots can
    // be scoped to each one -- reuses the same plotting components/API as the overview page
    // (src/components/plots/), just rendered once per context instead of once with a picker.
    context1: {
      type: Object,
      default: null,
    },
    context2: {
      type: Object,
      default: null,
    },
    // Same group -> icon lookup the main network page's NodeDetails/EdgeDetails use
    // (data-network.vue's getIcon, now shared via networkData.js's getNodeIcon).
    getIcon: {
      type: Function,
      default: null,
    },
    // (node) => hex color | undefined -- same group color NodeRankPanel's Group
    // column chips use (differential-network.vue's colorForNodeGroup), passed in
    // rather than recomputed here since a single node can't derive the full
    // group set needed for assignGroupColors' index-based palette on its own.
    getGroupColor: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      // Fallback until the ResizeObserver reports the panel's actual width on mount.
      plotWidth: 440,
    };
  },
  mounted() {
    if (typeof ResizeObserver === 'undefined' || !this.$refs.rootEl) return;
    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) this.plotWidth = Math.floor(width);
    });
    this.resizeObserver.observe(this.$refs.rootEl);
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  computed: {
    groupChipStyle() {
      const color = this.getGroupColor ? this.getGroupColor(this.node) : null;
      return color ? { backgroundColor: color, color: getReadableTextColor(color) } : {};
    },
    hasEdgeStats() {
      if (!this.node) return false;
      return ['edgeMin', 'edgeMax', 'edgeMedian', 'edgeMean', 'edgeSd', 'edgePercentileMean'].some(
        (key) => this.node[key] != null
      );
    },
    nodeMetricLabel() {
      return metricLabel(NODE_METRIC_INFO, this.nodeMetric) || 'Node metric';
    },
    rankingAlgorithmLabel() {
      return metricLabel(RANKING_ALGORITHM_INFO, this.rankingAlgorithm);
    },
  },
  methods: {
    capitalizeFirstLetter,
    // toPrecision(6) alone would round a value like 0.9999997 to a flat "1.00000", hiding just
    // how extreme it is -- pad significant digits instead once the value is close to 0 or 1.
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      const distanceFromBound = Math.min(Math.abs(value), Math.abs(1 - value));
      const precision = distanceFromBound > 0 && distanceFromBound < 1e-4
        ? Math.min(20, 6 - Math.floor(Math.log10(distanceFromBound)))
        : 6;
      return value.toPrecision(precision);
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
