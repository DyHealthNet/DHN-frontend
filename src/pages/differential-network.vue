<template>
  <v-container class="modina-page page-container py-10">
    <v-row>
      <v-col cols="12">
            <div class="hero">
              <div>
                <p class="eyebrow">moDiNA</p>
                <h1 class="title">Differential Network Comparison</h1>
                <p class="subtitle">
                  Compare two contexts built on the same variable subset. moDiNA builds a
                  differential network from their already-computed association scores, ranks its
                  nodes and edges, and visualizes it below.
                </p>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12">
            <ContextComparisonPicker v-model="selectedContexts" />
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12">
            <DiffNetworkSettings
              v-model="settings"
              :node-metric="result?.nodeMetric"
              :edge-metric="result?.edgeMetric"
              :ranking-algorithm="result?.rankingAlgorithm"
            />
          </v-col>
        </v-row>

        <v-row class="mt-4" align="center">
          <v-col cols="12" md="4">
            <v-btn
              color="primary-darken-1"
              block
              elevation="1"
              :loading="isRunning"
              :disabled="!canRun"
              @click="runComparison"
            >
              <v-icon class="mr-2">mdi-play-circle-outline</v-icon>
              Run Comparison
            </v-btn>
          </v-col>
          <v-col cols="12" md="8">
            <p v-if="statusText" class="status-text mb-0">{{ statusText }}</p>
            <v-progress-linear v-if="isRunning" indeterminate color="primary" rounded class="mt-2" />
          </v-col>
        </v-row>

        <v-row v-if="errorMessage" class="mt-2">
          <v-col cols="12">
            <div class="error-note">{{ errorMessage }}</div>
          </v-col>
        </v-row>

        <v-row v-if="hasResult && hasExcludedVariables" class="mt-2">
          <v-col cols="12">
            <div class="context-log">
              <div class="context-log-title">
                <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon>
                Variable exclusion log
              </div>
              <div v-if="excludedVariables.missingFromContext1.length">
                {{ excludedVariables.missingFromContext1.length }} variable(s) had no usable signal in
                "{{ contextNames.name1 }}" (present in "{{ contextNames.name2 }}") and were excluded from this
                comparison: {{ excludedVariables.missingFromContext1.join(', ') }}
              </div>
              <div v-if="excludedVariables.missingFromContext2.length">
                {{ excludedVariables.missingFromContext2.length }} variable(s) had no usable signal in
                "{{ contextNames.name2 }}" (present in "{{ contextNames.name1 }}") and were excluded from this
                comparison: {{ excludedVariables.missingFromContext2.join(', ') }}
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row class="mt-6" align="stretch" v-if="hasResult">
          <v-col cols="12" md="7">
            <v-card class="graph-card" outlined>
              <GraphToolbar
                density="comfortable"
                :physics-on="physics_on"
                @update:physics-on="onPhysicsChange"
                :show-hide-unconnected="true"
                :hide-unconnected="hideUnconnected"
                @update:hide-unconnected="onHideUnconnectedChange"
                @save-image="saveNetworkImage"
                @fit-view="resetView"
                title-tooltip="Differential Network"
              >
                <template #title>Differential Network</template>
                <template #prepend>
                  <v-spacer />
                  <v-select
                    :model-value="nodeColorMode"
                    @update:model-value="onNodeColorModeChange"
                    :items="nodeColorModeItems"
                    label="Node color"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="toolbar-select mr-3"
                    style="max-width: 140px"
                  >
                    <template #item="{ item, props }">
                      <v-tooltip v-if="item.raw.tooltip" :text="item.raw.tooltip" location="end">
                        <template #activator="{ props: tooltipProps }">
                          <v-list-item v-bind="{ ...props, ...tooltipProps }"></v-list-item>
                        </template>
                      </v-tooltip>
                      <v-list-item v-else v-bind="props"></v-list-item>
                    </template>
                  </v-select>
                  <v-select
                    :model-value="edgeStyleMode"
                    @update:model-value="onEdgeStyleModeChange"
                    :items="edgeStyleModeItems"
                    label="Edge color"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="toolbar-select mr-3"
                    style="max-width: 140px"
                  >
                    <template #item="{ item, props }">
                      <v-tooltip v-if="item.raw.tooltip" :text="item.raw.tooltip" location="end">
                        <template #activator="{ props: tooltipProps }">
                          <v-list-item v-bind="{ ...props, ...tooltipProps }"></v-list-item>
                        </template>
                      </v-tooltip>
                      <v-list-item v-else v-bind="props"></v-list-item>
                    </template>
                  </v-select>
                  <div class="topn-control mr-4" v-if="totalNodeCount > 1">
                    <span class="topn-caption">Top Nodes</span>
                    <v-slider
                      :model-value="topN ?? totalNodeCount"
                      :min="1"
                      :max="totalNodeCount"
                      :step="1"
                      density="compact"
                      color="white"
                      hide-details
                      class="topn-slider"
                      @end="onTopNChange"
                    ></v-slider>
                    <span class="topn-caption">{{ topNLabel }}</span>
                  </div>
                </template>
              </GraphToolbar>
              <a ref="downloadLink" style="display: none" :href="imageUrl" :download="downloadFileName"></a>
              <v-card-text>
                <div class="graph-stage">
                  <div ref="containerRef" class="graph-container">
                    <CosmographGraph
                      ref="graph"
                      :nodes="graphPoints"
                      :edges="edgesForGraph"
                      :physics-on="physics_on"
                      :point-color-fn="computePointColor"
                      :point-size-fn="computePointSize"
                      :link-color-fn="computeLinkColor"
                      :link-width-fn="computeLinkWidth"
                      :background-color="labelColor('background')"
                      :hovered-point-ring-color="labelColor('primary-darken-1')"
                      :unknown-color="labelColor('text')"
                      :point-default-size="8"
                      @point-click="selectPointFromGraph"
                      @link-click="selectLinkFromGraph"
                      @background-click="clearSelection"
                      @simulation-end="onSimulationEnd"
                      @error="onGraphError"
                    />
                  </div>
                  <NetworkLegend v-if="nodeColorMode !== 'stc'" class="legend" :items="legendItems" />
                  <GradientLegend
                    v-else
                    class="legend"
                    title="Node color: STC"
                    :gradient-css="nodeStcGradientCss"
                    :labels="nodeStcLegendLabels"
                  />
                  <GradientLegend
                    v-if="edgeStyleMode === 'diffLP'"
                    class="edge-legend"
                    title="Edge color: diff-L-P"
                    :gradient-css="edgeDiffLPGradientCss"
                    :labels="edgeDiffLPLegendLabels"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <v-card class="info-card" outlined>
              <v-toolbar color="primary-darken-1" density="comfortable">
                <v-toolbar-title>Details</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <DiffNodeDetails
                  v-if="selectedPoint"
                  :node="selectedPoint"
                  :context1="selectedContexts.context1"
                  :context2="selectedContexts.context2"
                  :get-icon="getNodeIcon"
                  :get-group-color="colorForNodeGroup"
                  :node-metric="result?.nodeMetric"
                  :ranking-algorithm="result?.rankingAlgorithm"
                />
                <DiffEdgeDetails
                  v-else-if="selectedLink"
                  :edge="selectedLink"
                  :context-names="contextNames"
                  :points-by-id="pointsById"
                  :get-group-color="colorForNodeGroup"
                  :context1="selectedContexts.context1"
                  :context2="selectedContexts.context2"
                  :edge-metric="result?.edgeMetric"
                />
                <p v-else class="text-medium-emphasis text-body-2">
                  Click a node or edge in the graph (or a row in the tables below) to see its details here.
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-4" v-if="hasResult">
          <v-col cols="12" md="6">
            <NodeRankPanel
              :items="result.points || []"
              :selected-node="selectedPoint?.id"
              :node-metric="result?.nodeMetric"
              :ranking-algorithm="result?.rankingAlgorithm"
              @select-node="selectNodeById"
            />
          </v-col>
          <v-col cols="12" md="6">
            <EdgeRankPanel
              :items="result.edgeRanking || []"
              :selected-edge="selectedLink ? `${selectedLink.source}_${selectedLink.target}` : null"
              :points-by-id="pointsById"
              :context-names="contextNames"
              :edge-metric="result?.edgeMetric"
              @select-edge="selectEdgeByLabels"
            />
          </v-col>
        </v-row>
  </v-container>
</template>

<script>
import { BASE_URL } from '@/components/constants.js';
import { getCookie } from '@/components/authentication/auth.js';
import ContextComparisonPicker from '@/components/modina/ContextComparisonPicker.vue';
import DiffNetworkSettings from '@/components/modina/DiffNetworkSettings.vue';
import NodeRankPanel from '@/components/modina/NodeRankPanel.vue';
import EdgeRankPanel from '@/components/modina/EdgeRankPanel.vue';
import DiffNodeDetails from '@/components/modina/DiffNodeDetails.vue';
import DiffEdgeDetails from '@/components/modina/DiffEdgeDetails.vue';
import GraphToolbar from '@/components/network/GraphToolbar.vue';
import NetworkLegend from '@/components/network/NetworkLegend.vue';
import GradientLegend from '@/components/network/GradientLegend.vue';
import CosmographGraph from '@/components/network/CosmographGraph.vue';
import { assignGroupColors, getNodeIcon, saveNetworkState, loadNetworkState, clearNetworkState, capitalizeFirstLetter, drawLegendPanel, interpolateHexColor, normalizeInRange } from '@/components/network/networkData.js';
import { NODE_METRIC_INFO, EDGE_METRIC_INFO, metricDescription } from '@/components/modina/metricInfo.js';

// Distinct key (not a numeric contextValue) so this doesn't collide with data-network.vue's own
// per-context / "staticNetwork" localStorage entries, which share the same helper functions.
const MODINA_STATE_KEY = 'modina-comparison';

export default {
  name: 'DifferentialNetworkPage',
  components: {
    ContextComparisonPicker,
    DiffNetworkSettings,
    NodeRankPanel,
    EdgeRankPanel,
    DiffNodeDetails,
    DiffEdgeDetails,
    GraphToolbar,
    NetworkLegend,
    GradientLegend,
    CosmographGraph,
  },
  data() {
    return {
      selectedContexts: { context1: null, context2: null },
      // testType/correction aren't chosen here -- they're fixed per-context (baked into each
      // context's already-computed association scores) and just need to match between the two,
      // which ContextComparisonPicker already enforces at selection time.
      settings: {
        filterTarget: null,
        filterMetric: null,
        filterRule: null,
        filterParam: 1,
      },

      isRunning: false,
      statusText: '',
      errorMessage: '',
      runId: null,
      pollTimer: null,

      result: null,

      // Selection is tracked by stable id (not a Cosmograph row index) -- ids
      // survive CosmographGraph's own data refreshes (Top-N changes, etc.)
      // without needing a separate "what did we last render" mirror the way
      // Cosmograph's raw indices would.
      selectedPointId: null,
      selectedLinkId: null,
      // Graph-only cutoff (rank tables always show every node/edge) -- keeps the top N
      // best-ranked nodes and the edges between them, mirroring moDiNA_interface's Top-N slider.
      // null (or >= totalNodeCount) means "all". Set to min(100, totalNodeCount) whenever a new
      // result loads (see pollStatus/loadState), same default as moDiNA_interface.
      topN: null,
      // Graph-only: hides points with no edges within the current Top-N cutoff. Node rank (score)
      // is independent of edge membership, so the Top-N slider alone can't isolate "connected"
      // nodes -- this gives a way to declutter the view without changing the rank-based ordering.
      hideUnconnected: false,
      physics_on: true,
      imageUrl: null,
      // Node color mode: 'group' (data layer -- protein/metabolite/phenotype) or
      // 'stc' (continuous gradient by node.nodeMetricValue). See colorKeyForNode/
      // computePointColor -- mirrors data-network.vue's nodeColorMode, including
      // its live pointColorByFn (a light applyDesign() refresh on mode switch,
      // no data reupload/full rebuild needed).
      nodeColorMode: 'group',
      // Cached once per refreshNodeColorState() call (a full render, or a
      // node-color-mode switch) -- 'group' mode's key -> hex lookup, read by
      // computePointColor. 'stc' mode doesn't use this (its key from
      // colorKeyForNode is already the final hex color).
      pointColorMapCache: {},
      // Edge color mode: 'uniform' (flat, today's original look) or 'diffLP'
      // (min-max scaled grey scale by edge.weight -- see computeLinkColor).
      // Mirrors data-network.vue's edgeStyleMode.
      edgeStyleMode: 'diffLP',
    };
  },
  computed: {
    canRun() {
      return (
        this.selectedContexts.context1 &&
        this.selectedContexts.context2 &&
        !this.isRunning
      );
    },
    hasResult() {
      return !!this.result;
    },
    totalNodeCount() {
      return this.result?.points?.length || 0;
    },
    // 'points' is already rank-sorted ascending (compute_ranking sorts by score before assigning
    // rank -- see network/tasks.py's _shape_modina_result), so slicing the first N here keeps
    // exactly the N best-ranked nodes, same convention as moDiNA_interface's rankedNodesForTopN.
    // Only the graph is trimmed -- NodeRankPanel/EdgeRankPanel keep showing every row via
    // result.points/result.edgeRanking directly.
    //
    // hideUnconnected then optionally drops points that have no surviving edge within this same
    // cutoff. Node rank/score is computed independently of edge membership (nodeRank ranks every
    // variable, not just ones with a differential edge -- see network/tasks.py's
    // _shape_modina_result), so the Top-N cutoff alone routinely keeps plenty of edge-less nodes;
    // this is a separate, cheap way to declutter without changing what "Top N" means.
    graphPoints() {
      const points = this.result?.points || [];
      const sliced = this.topN == null || this.topN >= points.length ? points : points.slice(0, this.topN);
      if (!this.hideUnconnected) return sliced;
      const links = this.result?.links || [];
      const idsInCutoff = new Set(sliced.map((p) => p.id));
      const connectedIds = new Set();
      for (const l of links) {
        if (idsInCutoff.has(l.source) && idsInCutoff.has(l.target)) {
          connectedIds.add(l.source);
          connectedIds.add(l.target);
        }
      }
      return sliced.filter((p) => connectedIds.has(p.id));
    },
    graphLinks() {
      const links = this.result?.links || [];
      if (this.topN == null || this.topN >= this.totalNodeCount) return links;
      const ids = new Set(this.graphPoints.map((p) => p.id));
      return links.filter((l) => ids.has(l.source) && ids.has(l.target));
    },
    // Raw min/max of diff-L-P (edge.weight) across the currently-displayed
    // edges. Unlike the main network page's raw p_value/effect_size (read
    // straight from Postgres, where a literal p_value=0 makes -log10(p)
    // Infinity), moDiNA's log-P transform (statistics_utils.py) already floors
    // zero p-values with a data-derived epsilon before diff-L-P is ever
    // computed -- so it's already a bounded, reasonably-scaled value, and can
    // be shown as a direct min-max color scale instead of needing a percentile
    // rank to avoid outliers dominating.
    weightRange() {
      const values = this.graphLinks.map((l) => l.weight).filter((v) => v != null && !Number.isNaN(v));
      return values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 0 };
    },
    // graphLinks with a stable `id` added -- CosmographGraph needs one per
    // edge (mirrors data-network.vue's edgesForGraph), and edges have no
    // natural id of their own, only a source/target pair. computeLinkColor/
    // computeLinkWidth now read edge.weight directly (CosmographGraph hands
    // the edge object straight to them, order-safe by construction), so
    // unlike before this no longer needs a precomputed colorValue.
    edgesForGraph() {
      return this.graphLinks.map((link) => ({ ...link, id: `${link.source}_${link.target}` }));
    },
    // Same id scheme as edgesForGraph, for resolving a selected link back to
    // its full object (selectedLink) and for centering on it by endpoint id.
    linksById() {
      const map = {};
      for (const link of this.graphLinks) map[`${link.source}_${link.target}`] = link;
      return map;
    },
    topNLabel() {
      if (this.topN == null || this.topN >= this.totalNodeCount) return 'all';
      return `${this.topN}/${this.totalNodeCount}`;
    },
    // Node groups (data layers, e.g. phenotype/protein/metabolite) present in the currently
    // rendered (Top-N trimmed) graph, each paired with the same color Cosmograph is using for it
    // -- for the legend.
    legendGroups() {
      if (!this.graphPoints.length) return [];
      const present = [...new Set(this.graphPoints.map((p) => p.group || 'unknown'))].sort();
      const groupColors = assignGroupColors(present);
      return present.map((group) => ({ group, color: groupColors[group] }));
    },
    // Render-ready form of legendGroups for NetworkLegend (shared with
    // data-network.vue) and for the exported-PNG legend panel -- capitalized the
    // same way the main network page's legend labels are.
    legendItems() {
      return this.legendGroups.map(({ group, color }) => ({
        key: group,
        label: capitalizeFirstLetter(group),
        color,
      }));
    },
    nodeColorModeItems() {
      return [
        { title: 'Group', value: 'group' },
        { title: 'STC', value: 'stc', tooltip: metricDescription(NODE_METRIC_INFO, 'STC') },
      ];
    },
    edgeStyleModeItems() {
      return [
        { title: 'Uniform', value: 'uniform' },
        { title: 'diff-L-P', value: 'diffLP', tooltip: metricDescription(EDGE_METRIC_INFO, 'diff-L-P') },
      ];
    },
    // Same grey-to-blue scale colorKeyForNode() itself paints nodes with.
    nodeStcGradientCss() {
      return `linear-gradient(to right, ${this.labelColor('chart-grid')}, ${this.labelColor('primary-darken-1')})`;
    },
    // Fixed [0, 1] domain (STC = 1 - p-value) -- real numeric endpoints, unlike
    // the edge legend below, since this isn't a percentile rank of whatever's
    // currently displayed.
    nodeStcLegendLabels() {
      return ['0', '1'];
    },
    // Same colors computeLinkColor() itself paints edges with -- light grey to
    // black, same as the main network page's |Effect size| edge scale (chart
    // alone topped out at a medium grey, not dark enough to read as the "high"
    // end of the range).
    edgeDiffLPGradientCss() {
      return `linear-gradient(to right, ${this.labelColor('chart-grid')}, #000000)`;
    },
    // Real numeric endpoints (unlike the main network page's percentile-ranked
    // 'combined'/'pvalue' edge legends) -- diff-L-P's own range is meaningful
    // and reasonably bounded (see weightRange), not a rank among whatever's
    // currently displayed.
    edgeDiffLPLegendLabels() {
      const { min, max } = this.weightRange;
      return [min.toFixed(2), max.toFixed(2)];
    },
    contextNames() {
      return {
        name1: this.selectedContexts.context1?.contextName,
        name2: this.selectedContexts.context2?.contextName,
      };
    },
    // Variables moDiNA flagged as unusable (no signal, or every pairwise test came back NaN) in
    // only one of the two contexts -- present in the other, so they couldn't be reconciled into
    // an edge on both sides and were left out of the comparison. See network/tasks.py's
    // create_comparison_wrapper.
    excludedVariables() {
      return this.result?.excludedVariables || { missingFromContext1: [], missingFromContext2: [] };
    },
    hasExcludedVariables() {
      return (
        (this.excludedVariables.missingFromContext1?.length || 0) +
          (this.excludedVariables.missingFromContext2?.length || 0) >
        0
      );
    },
    // id -> point lookup, so DiffEdgeDetails can show each endpoint's description without the
    // backend needing to duplicate it onto every link.
    pointsById() {
      const map = {};
      for (const p of this.result?.points || []) map[p.id] = p;
      return map;
    },
    // Same convention as the network page's downloadFileName: name + date, no build step needed
    // to keep multiple saved images distinct.
    downloadFileName() {
      const currentDate = new Date().toLocaleDateString().replace(/\//g, '-');
      const name1 = this.selectedContexts.context1?.contextName?.replace(/\s+/g, '-') || 'context1';
      const name2 = this.selectedContexts.context2?.contextName?.replace(/\s+/g, '-') || 'context2';
      return `differential-network-${name1}-vs-${name2}-${currentDate}.png`;
    },
    selectedPoint() {
      return this.selectedPointId != null ? this.pointsById[this.selectedPointId] || null : null;
    },
    selectedLink() {
      return this.selectedLinkId != null ? this.linksById[this.selectedLinkId] || null : null;
    },
  },
  methods: {
    // Exposes the imported helper to the template (Options API templates only see instance
    // properties, not bare module imports) so it can be passed as DiffNodeDetails/
    // DiffEdgeDetails' get-icon prop, same as data-network.vue's getIcon.
    getNodeIcon,
    buildRequestBody() {
      return {
        context1: this.selectedContexts.context1.contextValue,
        context2: this.selectedContexts.context2.contextValue,
        filterTarget: this.settings.filterTarget,
        filterMetric: this.settings.filterMetric,
        filterRule: this.settings.filterRule,
        filterParam: this.settings.filterParam,
      };
    },

    async runComparison() {
      if (!this.canRun) return;
      this.isRunning = true;
      this.errorMessage = '';
      this.result = null;
      this.topN = null;
      this.clearSelection();
      this.statusText = 'Starting differential network computation...';

      try {
        const response = await fetch(`${BASE_URL}/modina/api/createComparison`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          credentials: 'include',
          body: JSON.stringify(this.buildRequestBody()),
        });
        const data = await response.json();
        if (!response.ok || data.status === 'error') {
          throw new Error(data.message || `Request failed with status ${response.status}`);
        }
        this.runId = data.runId;
        this.statusText = 'Computing differential network...';
        await this.pollStatus();
      } catch (error) {
        console.error('Failed to start differential network comparison:', error);
        this.errorMessage = `Failed to start comparison: ${error.message || error}`;
        this.isRunning = false;
        this.statusText = '';
      }
    },

    async pollStatus() {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      await sleep(3000);

      while (this.isRunning) {
        try {
          const url = new URL(`${BASE_URL}/modina/api/comparisonStatus`);
          url.search = new URLSearchParams({ runId: this.runId });
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            credentials: 'include',
          });
          const data = await response.json();

          if (data.status === 'SUCCESS') {
            this.result = data.result;
            // Default to the top 100 best-ranked nodes (same convention as moDiNA_interface's
            // Top-N slider) so a large comparison doesn't render an unreadable hairball by default.
            this.topN = this.result?.points ? Math.min(100, this.result.points.length) : null;
            this.statusText = 'Comparison finished.';
            this.isRunning = false;
            this.saveState();
            await this.$nextTick();
            await this.initializeCosmograph();
            return;
          } else if (data.status === 'FAILURE' || data.status === 'error') {
            throw new Error(data.result || data.message || 'Computation failed.');
          } else {
            this.statusText = `Computing differential network... (${data.status || 'Pending'})`;
          }
        } catch (error) {
          console.error('Failed to poll comparison status:', error);
          this.errorMessage = `Comparison failed: ${error.message || error}`;
          this.isRunning = false;
          this.statusText = '';
          return;
        }
        await sleep(5000);
      }
    },

    // The key computePointColor() resolves to a final color -- either the raw
    // group (mirroring data-network.vue's node_group coloring) or, in 'stc' mode, the
    // point's own precomputed gradient color (mirroring data-network.vue's 'rank'
    // mode, see its colorKeyFor/rankColorFor). STC (1 - p-value of a direct
    // two-context test) is naturally bounded to [0, 1], so this uses that fixed
    // domain directly rather than a per-render min/max like weighted_degree needs.
    // Missing/NaN values fall back to 0 (the chart-grid end) rather than a more
    // prominent fallback color -- same reasoning as rankColorFor's own fallback.
    colorKeyForNode(point) {
      if (this.nodeColorMode !== 'stc') return point.group || 'unknown';
      const raw = point.nodeMetricValue;
      const value = (raw != null && !Number.isNaN(raw)) ? raw : 0;
      const clamped = Math.min(Math.max(value, 0), 1);
      return interpolateHexColor(this.labelColor('chart-grid'), this.labelColor('primary-darken-1'), clamped);
    },
    // Refreshes pointColorMapCache for the current nodeColorMode -- called both
    // on a full render (initializeCosmograph) and on a bare mode switch
    // (onNodeColorModeChange), mirroring data-network.vue's own
    // refreshNodeColorState.
    refreshNodeColorState() {
      this.pointColorMapCache = this.nodeColorMode === 'stc' ? {} : this.buildPointColorMap();
    },
    // colorKey -> hex lookup computePointColor() consumes for 'group' mode, mirroring how
    // data-network.vue colors by node_group: groups are fully data-driven (whatever layers the
    // two contexts share), not a fixed set, so each color is generated from the group name
    // itself rather than kept in a hardcoded table. Only called for 'group' mode (see
    // refreshNodeColorState) -- 'stc' mode's colorKey is already the final hex color
    // (see colorKeyForNode), no lookup map needed.
    buildPointColorMap() {
      const colorMap = {};
      for (const { group, color } of this.legendGroups) {
        colorMap[group] = color;
      }
      return colorMap;
    },
    // CosmographGraph hands the point object directly (order-safe by
    // construction), so no id lookup is needed here any more. Color itself is
    // computed live (not baked into the row), so switching nodeColorMode
    // doesn't need a data reupload -- see onNodeColorModeChange.
    computePointColor(point) {
      if (!point) return this.labelColor('text');
      const key = this.colorKeyForNode(point);
      if (this.nodeColorMode === 'stc') return key;
      return this.pointColorMapCache[key] ?? this.labelColor('text');
    },
    // Group color for the Details panel's chip. Deliberately not colorForLegendKey-via-
    // legendGroups (built from graphPoints, the Top-N-trimmed subset) -- a node picked from the
    // node rank table (NodeRankPanel, which lists all of result.points) can be one Top-N trimmed
    // out of the graph, where legendGroups wouldn't have a color for it. Built the same way
    // NodeRankPanel computes its own chip colors (over the full result.points, same sort), so the
    // two always agree.
    colorForNodeGroup(node) {
      const key = node?.group;
      if (!key) return undefined;
      const keys = [...new Set((this.result?.points || []).map((p) => p.group).filter(Boolean))].sort();
      return assignGroupColors(keys)[key];
    },

    // Rebuilds node/edge color state and hands the current graphPoints/
    // edgesForGraph to CosmographGraph, which uploads them (reusing the live
    // instance via setConfig() where it can, falling back to a full rebuild
    // only if that fails -- see its own comments). Called both for a
    // genuinely new comparison result and for a Top-N/hideUnconnected change;
    // CosmographGraph's own index-safe, hand-built upload (no more
    // prepareCosmographData()/DuckDB-join reordering risk) means there's no
    // longer a reason to pick between a "full rebuild" and a "light data
    // swap" path the way renderGraph()/updateGraphDataViaConfig() used to --
    // and the same order-safety removes the need for a post-render
    // verifyGraphIntegrity() check, which existed only to catch that exact
    // reordering class of bug.
    async initializeCosmograph() {
      if (!this.result) return;
      this.refreshNodeColorState();
      await this.$refs.graph?.refreshData();
      this.reapplySelection();
    },

    // Cheap refresh of an already-built instance -- theme toggles and click/selection changes go
    // through here instead of initializeCosmograph(), so pan/zoom/physics state isn't reset every
    // time something's clicked (same split as the network page's applyDesign()).
    async applyDesign() {
      if (!this.$refs.graph) return;
      this.reapplySelection();
      await this.$refs.graph.refreshDesign();
    },

    // The selected node renders much bigger than the rest -- CosmographGraph
    // hands the point object directly, so this compares by id instead of the
    // Cosmograph row index the old pointSizeBy/index lookup used.
    computePointSize(point) {
      return point && this.selectedPointId != null && point.id === this.selectedPointId ? 24 : 8;
    },

    // 'diffLP': same light-grey-to-black scale the main network page's
    // |Effect size| edge mode uses (chart alone topped out too light), but
    // value-based (min-max over weightRange) rather than percentile-ranked --
    // diff-L-P is already a bounded, reasonably-scaled value (see weightRange's
    // own comment), unlike the main page's raw p_value/effect_size, which can't
    // safely use a plain min-max scale. 'uniform' keeps the original flat look.
    // CosmographGraph hands the edge object directly (order-safe by
    // construction), so this reads edge.weight straight off it.
    computeLinkColor(edge) {
      if (this.edgeStyleMode !== 'diffLP' || edge.weight == null) return this.labelColor('text');
      const { min, max } = this.weightRange;
      return interpolateHexColor(this.labelColor('chart-grid'), '#000000', normalizeInRange(edge.weight, min, max));
    },

    // 'uniform' also flattens width (not just color) to a fixed 2px, matching
    // the main network page's own flat/default edge width. 'diffLP' maps
    // edge.weight into a fixed [1, 8]px range via weightRange -- using the raw
    // value directly as pixels (the original behavior) let a large diff-L-P
    // render as an extremely thick line, unbounded by anything on screen.
    computeLinkWidth(edge) {
      if (this.edgeStyleMode === 'uniform' || edge.weight == null) return 2;
      const { min, max } = this.weightRange;
      return 1 + normalizeInRange(edge.weight, min, max) * 7;
    },

    // Pans (not zooms) the camera to center on a point, at whatever zoom level is already
    // active -- a single deterministic code path regardless of how far the camera currently is
    // from the target, unlike zoomToPoint()'s two different transition strategies.
    centerOnPoint(index) {
      this.$refs.graph?.panToIndices([index]);
    },

    // Fits both endpoints of the selected edge into view (a small zoom/pan, not just a pan --
    // fitToIndices() is CosmographGraph's own "frame these points" method, distinct from
    // centerOnPoint()'s pan-only move), so an edge click centers the same way a node click does.
    centerOnEdge(edge) {
      const index0 = this.$refs.graph?.getPointIndex(edge.source) ?? -1;
      const index1 = this.$refs.graph?.getPointIndex(edge.target) ?? -1;
      if (index0 === -1 || index1 === -1) return;
      this.$refs.graph.fitToIndices([index0, index1], 700);
    },

    // Re-centers and zooms to fit the whole graph -- the toolbar's manual "Reset view"
    // button, same fitView() Cosmograph already calls on its own once the simulation
    // settles with nothing selected.
    resetView() {
      this.$refs.graph?.resetView();
    },

    // Highlights the selected node plus all of its direct neighbors (or an edge's two endpoints),
    // dimming everything else via pointGreyoutOpacity/linkGreyoutOpacity -- same mechanic as the
    // network page's reapplySelection(), just without its multi-select-bucket branch (moDiNA only
    // ever has a single selected node or edge, no batch selection).
    reapplySelection() {
      if (!this.$refs.graph) return;
      let selectedIndices = [];
      if (this.selectedPointId != null) {
        const pointIndex = this.$refs.graph.getPointIndex(this.selectedPointId);
        if (pointIndex !== -1) {
          selectedIndices = [pointIndex, ...this.$refs.graph.getConnectedPointIndices(pointIndex)];
        }
      } else if (this.selectedLink) {
        selectedIndices = [
          this.$refs.graph.getPointIndex(this.selectedLink.source),
          this.$refs.graph.getPointIndex(this.selectedLink.target),
        ].filter((i) => i !== -1);
      }
      this.$refs.graph.selectIndices(selectedIndices);
    },

    // GraphToolbar's switches are v-model'd through props/events rather than a
    // direct v-model on physics_on/hideUnconnected (the toolbar no longer owns
    // that state). CosmographGraph watches its own physicsOn prop, so no
    // explicit pause()/unpause() call is needed here.
    onPhysicsChange(value) {
      this.physics_on = value;
    },
    onHideUnconnectedChange(value) {
      this.hideUnconnected = value;
      this.initializeCosmograph();
    },
    // Node color is computed live per point (pointColorByFn/computePointColor),
    // not baked into each row, so switching modes just needs fresh state
    // (refreshNodeColorState) and a light applyDesign() refresh -- same
    // reasoning as onEdgeStyleModeChange below, and mirrors data-network.vue's
    // own onNodeColorModeChange.
    onNodeColorModeChange(value) {
      this.nodeColorMode = value;
      this.refreshNodeColorState();
      this.applyDesign();
    },
    // Unlike node coloring, linkColorByFn already reads live edgeStyleMode state
    // per edge on every call, so no data rebuild is needed -- just refresh the
    // live config, mirroring data-network.vue's own onEdgeStyleModeChange.
    onEdgeStyleModeChange(value) {
      this.edgeStyleMode = value;
      this.applyDesign();
    },

    async saveNetworkImage() {
      await this.captureImage();
      if (this.imageUrl) {
        this.$refs.downloadLink.click();
      } else {
        console.error('Image URL is not available yet');
      }
    },

    // containerRef also holds Cosmograph's polygonal/rectangular area-select overlay canvases,
    async captureImage() {
      this.imageUrl = await this.$refs.graph?.captureImage((ctx, canvas) => {
        drawLegendPanel(ctx, canvas, this.legendItems, {
          textColor: this.labelColor('text'),
          panelColor: this.labelColor('surface-bright'),
          borderColor: this.labelColor('surface-variant'),
        });
      });
    },

    // Same pattern as data-network.vue's labelColor(): chartjs/Cosmograph don't understand CSS
    // theme vars, so read the resolved hex straight from Vuetify's active theme.
    labelColor(colorName) {
      const themeName = this.$vuetify.theme.global.name;
      return this.$vuetify.theme.themes[themeName]?.colors[colorName];
    },

    // Selects a node by its own object (not a Cosmograph index) -- the shared
    // entry point for both a canvas click (selectPointFromGraph, which
    // resolves the index to a point first) and a table row click
    // (selectNodeById), so centering/highlighting behave identically either way.
    selectPoint(point) {
      if (!point) return;
      this.selectedPointId = point.id;
      this.selectedLinkId = null;
      this.applyDesign();
      const index = this.$refs.graph?.getPointIndex(point.id) ?? -1;
      if (index !== -1) this.centerOnPoint(index);
    },
    selectPointFromGraph(index) {
      if (index == null) return;
      const id = this.$refs.graph?.getPointId(index);
      this.selectPoint(id != null ? this.pointsById[id] : null);
    },

    // Same shared-entry-point pattern as selectPoint() above, for edges.
    selectLink(link) {
      if (!link) return;
      this.selectedLinkId = `${link.source}_${link.target}`;
      this.selectedPointId = null;
      this.applyDesign();
      this.centerOnEdge(link);
    },
    selectLinkFromGraph(linkIndex) {
      if (linkIndex == null) return;
      const id = this.$refs.graph?.getLinkId(linkIndex);
      this.selectLink(id != null ? this.linksById[id] : null);
    },

    // Rows clicked in NodeRankPanel/EdgeRankPanel come from the full (untrimmed) result, so the
    // node/edge they refer to may currently be cut off by the Top-N graph filter -- raise it
    // first (ensureTopNIncludes) rather than silently failing to select anything.
    async selectNodeById(item) {
      if (!this.result?.points) return;
      await this.ensureTopNIncludes(item.id);
      this.selectPoint(this.pointsById[item.id]);
    },

    async selectEdgeByLabels(item) {
      if (!this.result?.links) return;
      await this.ensureTopNIncludes(item.label1);
      await this.ensureTopNIncludes(item.label2);
      const link = this.graphLinks.find(
        (l) =>
          (l.source === item.label1 && l.target === item.label2) ||
          (l.source === item.label2 && l.target === item.label1)
      );
      this.selectLink(link);
    },

    // If the given node id is currently outside the Top-N cutoff, raises Top-N just enough to
    // include it (and updates the graph) rather than leaving selectNodeById/selectEdgeByLabels
    // unable to find it.
    async ensureTopNIncludes(id) {
      if (this.topN == null || this.topN >= this.totalNodeCount) return;
      const idx = (this.result?.points || []).findIndex((p) => p.id === id);
      if (idx >= 0 && idx + 1 > this.topN) {
        this.topN = idx + 1;
        await this.initializeCosmograph();
      }
    },

    async onTopNChange(value) {
      const next = Number(value);
      if (!Number.isFinite(next) || next === this.topN) return;
      this.topN = next;
      await this.initializeCosmograph();
    },

    clearSelection() {
      this.selectedPointId = null;
      this.selectedLinkId = null;
      this.applyDesign();
    },

    // CosmographGraph's simulation-end emit -- skip the auto re-fit while a
    // node/edge is selected, so this doesn't undo the centering a click just
    // asked for (same guard the network page uses).
    onSimulationEnd() {
      if (this.selectedPointId == null && this.selectedLinkId == null) {
        this.$refs.graph?.resetView();
      }
    },
    onGraphError(message) {
      this.errorMessage = message;
    },

    // Persists the last finished comparison (contexts, settings, result) so it's still there if
    // the user navigates away and back -- same localStorage mechanism as the network page, just
    // keyed by a fixed string instead of a contextValue (see MODINA_STATE_KEY).
    saveState() {
      // localStorage.setItem can throw (e.g. quota exceeded on a large differential network) --
      // this must not blow up the SUCCESS branch of pollStatus() it's called from, which would
      // otherwise stop the just-computed graph from ever rendering.
      try {
        console.log('[modina] saveState: saving, result present =', !!this.result);
        saveNetworkState(MODINA_STATE_KEY, {
          selectedContexts: this.selectedContexts,
          settings: this.settings,
          result: this.result,
        });
      } catch (error) {
        console.error('Failed to save differential network state:', error);
      }
    },

    async loadState() {
      const savedState = loadNetworkState(MODINA_STATE_KEY);
      console.log('[modina] loadState: savedState =', savedState);
      if (!savedState?.result) {
        console.log('[modina] loadState: no saved result found, nothing to restore.');
        return;
      }
      try {
        this.selectedContexts = savedState.selectedContexts || this.selectedContexts;
        this.settings = savedState.settings || this.settings;
        this.result = savedState.result;
        this.topN = this.result?.points ? Math.min(100, this.result.points.length) : null;
        await this.$nextTick();
        await this.initializeCosmograph();
      } catch (error) {
        // A saved result from an older, incompatible response shape (this endpoint's contract
        // changed repeatedly during development) can crash the Cosmograph rebuild -- same failure
        // class data-network.vue's loadState() guards against for stale edge/node references.
        // Drop the stale entry rather than leaving the page permanently stuck failing to restore.
        console.error('Failed to restore saved differential network state, clearing it:', error);
        clearNetworkState(MODINA_STATE_KEY);
        this.result = null;
      }
    },
  },
  watch: {
    '$vuetify.theme.global.name'() {
      this.applyDesign();
    },
  },
  mounted() {
    this.loadState();
  },
  beforeUnmount() {
    // CosmographGraph tears down its own Cosmograph instance in its own
    // beforeUnmount hook -- no explicit destroy() call needed here.
    if (this.pollTimer) clearTimeout(this.pollTimer);
  },
};
</script>

<style scoped>
.modina-page {
  min-height: calc(100vh - 220px);
}

.hero {
  padding: 2rem;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(17, 24, 39, 0.04));
  border: 1px solid rgba(25, 118, 210, 0.16);
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary-darken-1));
}

.title {
  margin: 0;
  font-size: 2.5rem;
  line-height: 1.05;
}

.subtitle {
  margin-top: 0.9rem;
  max-width: 720px;
  font-size: 1.02rem;
  opacity: 0.82;
}

.status-text {
  font-weight: 600;
  color: rgb(var(--v-theme-primary-darken-1));
}

.error-note {
  font-size: 0.92rem;
  color: rgba(166, 36, 36, 1);
}

.context-log {
  padding: 10px 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  border-left: 3px solid rgb(var(--v-theme-primary-darken-1));
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 0.875rem;
}

.context-log-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  margin-bottom: 4px;
}

.graph-card,
.info-card {
  height: 100%;
}

.graph-stage {
  min-height: 640px;
  display: grid;
  place-items: center;
  position: relative;
}

.graph-container {
  width: 100%;
  height: 640px;
}

/* Legend item/color/text styling now lives in the shared NetworkLegend.vue
   component; only this page's own positioning stays here. */
.legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: transparent;
  z-index: 10;
}
.edge-legend {
  position: absolute;  /* Same convention as .legend, opposite corner so the two
                           don't overlap when both a node and edge gradient show at once. */
  bottom: 20px;
  right: 20px;
  z-index: 10;
}

/* Same reasoning as data-network.vue's own .toolbar-select: GraphToolbar's
   content box is a fixed height with overflow:hidden, and the default compact
   outlined field is just tall enough to poke into the graph view sitting
   directly above with no gap. */
.toolbar-select :deep(.v-field) {
  --v-input-control-height: 26px;
  --v-field-padding-bottom: 2px;
  font-size: 0.72rem;
}
.toolbar-select :deep(.v-field__input) {
  min-height: 26px;
  padding-top: 0;
}
.toolbar-select :deep(.v-label) {
  font-size: 0.72rem;
}
.toolbar-select :deep(.v-select__selection-text) {
  font-size: 0.72rem;
}

.topn-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topn-slider {
  width: 120px;
}

.topn-caption {
  color: white;
  font-size: 12px;
  white-space: nowrap;
}
</style>
