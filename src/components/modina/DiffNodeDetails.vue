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
      <span class="value">{{ node.group }}</span></p>
    <p v-if="node.description"><span class="label">Description:</span><br>
      <span class="value">{{ node.description }}</span></p>
    <p><span class="label">ID:</span><br>
      <span class="value">{{ node.id }}</span></p>

    <p class="label-subtitle mt-4">Ranking</p>
    <v-table density="compact">
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
    <p v-else class="text-medium-emphasis text-body-2">No edge available.</p>

    <template v-if="context1 && context2">
      <p class="label-subtitle mt-4">Distribution per context</p>
      <div class="distribution-row">
        <div class="distribution-col">
          <p class="context-label">{{ context1.contextName || 'Context 1' }}</p>
          <component
            :is="plotComponent"
            :xVar="node.id"
            :contextValue="context1.contextValue"
            barType="Grouped"
            barOrientation="Vertical"
            palette="muted"
            :textSize="13"
            :width="plotWidth"
            :height="260"
          />
        </div>
        <div class="distribution-col">
          <p class="context-label">{{ context2.contextName || 'Context 2' }}</p>
          <component
            :is="plotComponent"
            :xVar="node.id"
            :contextValue="context2.contextValue"
            barType="Grouped"
            barOrientation="Vertical"
            palette="muted"
            :textSize="13"
            :width="plotWidth"
            :height="260"
          />
        </div>
      </div>
    </template>
  </div>
  <p v-else class="text-medium-emphasis text-body-2">Select a node in the graph or the node rank table to see its details.</p>
  </div>
</template>

<script>
import OverviewBar from '@/components/plots/OverviewBar.vue';
import OverviewDensity from '@/components/plots/OverviewDensity.vue';

export default {
  name: 'DiffNodeDetails',
  components: { OverviewBar, OverviewDensity },
  props: {
    node: {
      type: Object,
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
    hasEdgeStats() {
      if (!this.node) return false;
      return ['edgeMin', 'edgeMax', 'edgeMedian', 'edgeMean', 'edgeSd', 'edgePercentileMean'].some(
        (key) => this.node[key] != null
      );
    },
    // Continuous variables get a density curve; the categorical types (binary/ordinal/nominal)
    // get a value-count bar chart -- same split data-overview.vue's plot components are built for.
    plotComponent() {
      return this.node?.type === 'continuous' ? 'OverviewDensity' : 'OverviewBar';
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
.distribution-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.distribution-col {
  min-width: 0;
  overflow-x: auto;
}
.context-label {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary-darken-1));
  margin-bottom: 2px;
}
</style>
