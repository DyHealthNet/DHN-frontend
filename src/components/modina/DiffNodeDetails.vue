<template>
  <div ref="rootEl">
  <div v-if="node">
    <NodeIdentityCard
      :display-name="node.display_name || node.id"
      :node-id="node.id"
      :description="node.description"
      :group-label="node.group ? capitalizeFirstLetter(node.group) : ''"
      :group-color="groupColor"
      :data-type="node.type"
      :xrefs="validXrefs"
      :icon-url="getIcon ? getIcon(node.group) : ''"
    />

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

    <!-- Where this node's PageRank+ mass comes from. The walker restarts in proportion to the
         node metric (STC), so low-STC neighbours seed little of it; a neighbour then splits
         whatever mass it holds across all its own edges by diff-L-P, so a high-degree neighbour
         passes only a small cut to any one of them. `Share` is exactly that cut for this edge,
         which is why it combines the other two columns. -->
    <p class="label-subtitle mt-4">Neighbours{{ neighbors.length ? ` (${neighbors.length})` : '' }}</p>
    <template v-if="neighbors.length">
      <v-table density="compact">
        <tbody>
          <tr>
            <td class="label">Mean {{ nodeMetricLabel }} of neighbours</td>
            <td class="value">{{ formatNumber(neighborSummary.meanNodeMetric) }}</td>
          </tr>
          <tr>
            <td class="label">Mean degree of neighbours</td>
            <td class="value">{{ formatNumber(neighborSummary.meanDegree) }}</td>
          </tr>
          <tr>
            <td class="label">Summed share to this node</td>
            <td class="value">{{ formatNumber(neighborSummary.sumShare) }}</td>
          </tr>
        </tbody>
      </v-table>

      <DownloadableDataTable
        :headers="neighborHeaders"
        :items="neighbors"
        :sort-by="[{ key: 'share', order: 'desc' }]"
        items-per-page="10"
        class="neighbor-table mt-2"
        filename="neighbours.csv"
        @click:row="onNeighborClick"
      >
        <template v-slot:item.display_name="{ item }">
          <span class="neighbor-name" :title="item.display_name">{{ item.display_name }}</span>
        </template>
        <template v-slot:header.nodeMetricValue="{ column }">
          <v-tooltip location="top" max-width="320">
            <template v-slot:activator="{ props }">
              <span v-bind="props">{{ column.title }}</span>
            </template>
            <span>{{ neighborMetricTooltip }}</span>
          </v-tooltip>
        </template>
        <template v-slot:item.nodeMetricValue="{ item }">
          {{ formatNumber(item.nodeMetricValue) }}
        </template>
        <template v-slot:header.degree="{ column }">
          <v-tooltip location="top" max-width="320">
            <template v-slot:activator="{ props }">
              <span v-bind="props">{{ column.title }}</span>
            </template>
            <span>How many edges this neighbour has in the differential network. A neighbour with
              many edges passes only a small share of its mass to any one of them.</span>
          </v-tooltip>
        </template>
        <template v-slot:header.share="{ column }">
          <v-tooltip location="top" max-width="320">
            <template v-slot:activator="{ props }">
              <span v-bind="props">{{ column.title }}</span>
            </template>
            <span>This edge's {{ edgeMetricLabel }} divided by the neighbour's total
              {{ edgeMetricLabel }} across all its edges -- roughly the probability that a walker
              sitting on that neighbour steps to this node.</span>
          </v-tooltip>
        </template>
        <template v-slot:item.share="{ item }">
          {{ formatNumber(item.share) }}
        </template>
        <template v-slot:item.weight="{ item }">
          {{ formatNumber(item.weight) }}
        </template>
      </DownloadableDataTable>
    </template>
    <p v-else class="text-medium-emphasis text-body-2">No neighbour available.</p>

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
import NodeIdentityCard from '@/components/network/NodeIdentityCard.vue';
import DownloadableDataTable from '@/components/DownloadableDataTable.vue';
import { NODE_METRIC_INFO, EDGE_METRIC_INFO, RANKING_ALGORITHM_INFO, metricLabel, metricDescription } from './metricInfo.js';
import { capitalizeFirstLetter, resolveXrefs } from '@/components/network/networkData.js';

// Same null-aware numeric comparator the rank panels use: a missing value is worse than every
// real one (a neighbour with no STC sorts below the lowest real STC), and values are compared
// numerically rather than via the default string coercion.
function numericSort(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  return a - b;
}

export default {
  name: 'DiffNodeDetails',
  components: { OverviewBar, OverviewDensity, NodeIdentityCard, DownloadableDataTable },
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
    edgeMetric: {
      type: String,
      default: null,
    },
    rankingAlgorithm: {
      type: String,
      default: null,
    },
    // One row per neighbour of this node, built by differential-network.vue over the full
    // (untrimmed) edge set -- { id, display_name, nodeMetricValue, degree, weight, share }.
    neighbors: {
      type: Array,
      default: () => [],
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
  emits: ['select-node'],
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
    groupColor() {
      return this.getGroupColor ? this.getGroupColor(this.node) : null;
    },
    // node.type here is data_type (continuous/categorical), not group -- unlike
    // the main network page, resolveXrefs needs the actual group (node.group).
    validXrefs() {
      return resolveXrefs(this.node?.xrefs, this.node?.group);
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
    edgeMetricLabel() {
      return metricLabel(EDGE_METRIC_INFO, this.edgeMetric) || 'edge metric';
    },
    neighborHeaders() {
      return [
        { title: 'Neighbour', key: 'display_name' },
        { title: this.nodeMetricLabel, key: 'nodeMetricValue', sort: numericSort },
        { title: 'Degree', key: 'degree', sort: numericSort },
        { title: 'Share', key: 'share', sort: numericSort },
        // The raw edge weight behind Share's numerator -- off by default so the four columns
        // above still fit the Details panel's width, available from the columns selector.
        { title: this.edgeMetricLabel, key: 'weight', sort: numericSort, hidden: true },
      ];
    },
    // Summary over all neighbours. STC and degree are averaged -- they describe what a typical
    // neighbour looks like. Share is summed instead: each neighbour's share is the chance a
    // walker standing there steps here, so the total is this node's whole inflow per step, which
    // an average would divide back out. Missing values are skipped rather than counted as zero,
    // so a neighbour without a node metric doesn't drag the mean down on its own.
    neighborSummary() {
      const values = (key) => this.neighbors
        .map((n) => n[key])
        .filter((v) => typeof v === 'number' && !Number.isNaN(v));
      const sum = (key) => values(key).reduce((total, v) => total + v, 0);
      const mean = (key) => (values(key).length ? sum(key) / values(key).length : null);
      return {
        meanNodeMetric: mean('nodeMetricValue'),
        meanDegree: mean('degree'),
        sumShare: sum('share'),
      };
    },
    // The node metric's own description explains what the value means; here it's read one hop
    // out, so say whose value it is before repeating that explanation.
    neighborMetricTooltip() {
      const description = metricDescription(NODE_METRIC_INFO, this.nodeMetric);
      const lead = `The neighbour's own ${this.nodeMetricLabel} value. PageRank+ restarts in proportion to it, so neighbours with a low value seed little mass near this node.`;
      return description ? `${lead} ${description}` : lead;
    },
  },
  methods: {
    capitalizeFirstLetter,
    onNeighborClick(_, { item }) {
      this.$emit('select-node', item);
    },
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
.value {
  padding-left: 0px;
}
/* Clicking a row selects that neighbour, same as a node rank row. */
.neighbor-table :deep(tbody tr) {
  cursor: pointer;
}
/* The Details panel is narrow, so a long variable name would push the three numeric columns
   off the edge -- truncate it and keep the full name in the title tooltip. */
.neighbor-name {
  display: block;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
