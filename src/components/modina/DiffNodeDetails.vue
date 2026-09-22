<template>
  <div ref="rootEl">
  <div v-if="node">
    <!-- Same header-above-tabs shape as DiffEdgeDetails: what is selected stays visible on
         every tab, the rest of its fields live in General. The tab itself is not reset when the
         selection changes. -->
    <p><span class="label-title">Node</span></p>
    <p class="display-name text-center">{{ node.display_name || node.id }}</p>

    <v-tabs v-model="tab" density="compact" color="primary-darken-1" class="mt-2">
      <v-tab value="general">General</v-tab>
      <v-tab value="plot">Plot</v-tab>
    </v-tabs>
    <v-window v-model="tab" class="mt-2">
      <v-window-item value="general" :transition="false" :reverse-transition="false">
        <NodeIdentityCard
          hide-header
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

        <!-- Where this node's PageRank+ mass comes from, as aggregates: the walker restarts in
             proportion to the node metric (STC), so low-STC neighbours seed little of it, and a
             neighbour splits whatever mass it holds across all its own edges by the edge metric,
             so a high-degree neighbour passes only a small cut to any one of them. "Summed
             share" is those cuts added up over this node's edges.
             Computed by the backend (_neighbour_summary in network/tasks.py) and carried on the
             point. It used to be derived in the browser from the full edge set, which meant
             rescanning up to ~1.6M links on every node click and froze the page. -->
        <p class="label-subtitle mt-4">Neighbourhood</p>
        <v-table density="compact" v-if="hasNeighbourSummary">
          <tbody>
            <tr v-if="node.neighbourCount != null">
              <td class="label">Neighbours</td>
              <td class="value">{{ node.neighbourCount }}</td>
            </tr>
            <tr v-if="node.neighbourMeanNodeMetric != null">
              <td class="label">Mean {{ nodeMetricLabel }} of neighbours</td>
              <td class="value">{{ formatNumber(node.neighbourMeanNodeMetric) }}</td>
            </tr>
            <tr v-if="node.neighbourMeanDegree != null">
              <td class="label">Mean degree of neighbours</td>
              <td class="value">{{ formatNumber(node.neighbourMeanDegree) }}</td>
            </tr>
            <tr v-if="node.neighbourSumShare != null">
              <td class="label">Summed share to this node</td>
              <td class="value">{{ formatNumber(node.neighbourSumShare) }}</td>
            </tr>
          </tbody>
        </v-table>
        <p v-else class="text-medium-emphasis text-body-2">No neighbour available.</p>
      </v-window-item>

      <!-- Lazy (no `eager`): both plots fetch their own data from the API, so leaving this tab
           closed means a node selected only to read its ranking never issues that request. -->
      <v-window-item value="plot" :transition="false" :reverse-transition="false">
        <template v-if="context1 && context2">
          <p class="label-subtitle">Distribution per context</p>
          <!-- Both variable types render the two contexts as one grouped plot: continuous
               variables as a density plot (see GetDataDensityPlotView's contextValue1/
               contextValue2 mode), categorical variables as a bar chart grouped by context
               (GetDataBarCountView's contextValue1/contextValue2 mode). -->
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
        <p v-else class="text-medium-emphasis text-body-2">
          Select two contexts to see this variable's distribution in each of them.
        </p>
      </v-window-item>
    </v-window>
  </div>
  <p v-else class="text-medium-emphasis text-body-2">Select a node in the graph or the node rank table to see its details.</p>
  </div>
</template>

<script>
import OverviewBar from '@/components/plots/OverviewBar.vue';
import OverviewDensity from '@/components/plots/OverviewDensity.vue';
import NodeIdentityCard from '@/components/network/NodeIdentityCard.vue';
import { NODE_METRIC_INFO, RANKING_ALGORITHM_INFO, metricLabel } from './metricInfo.js';
import { capitalizeFirstLetter, resolveXrefs } from '@/components/network/networkData.js';


export default {
  name: 'DiffNodeDetails',
  components: { OverviewBar, OverviewDensity, NodeIdentityCard },
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
      // Which section of the panel is open ('general' | 'neighbours' | 'plot'). Kept
      // across selection changes on purpose -- see the template.
      tab: 'general',
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
    // Mirrors hasEdgeStats: the aggregates are computed backend-side over the full edge set, so
    // a node with no surviving edges simply arrives without them.
    hasNeighbourSummary() {
      if (!this.node) return false;
      return ['neighbourCount', 'neighbourMeanDegree', 'neighbourSumShare', 'neighbourMeanNodeMetric'].some(
        (key) => this.node[key] != null
      );
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
/* Same header pair DiffEdgeDetails puts above its own tabs. */
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
/* Same truncate-with-tooltip treatment NodeRankPanel gives its own Description column, just
   narrower -- this table lives in the side panel rather than a full-width card. */
.description-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 220px;
}
</style>
