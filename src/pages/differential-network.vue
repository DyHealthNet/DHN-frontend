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
              >
                <template #title>Differential Network</template>
                <template #prepend>
                  <v-spacer />
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
                  <div ref="containerRef" class="graph-container"></div>
                  <div class="legend">
                    <v-row
                      v-for="g in legendGroups"
                      :key="g.group"
                      align="center"
                      class="mb-2 legend-item"
                      no-gutters
                    >
                      <v-tooltip bottom>
                        <template v-slot:activator="{ props }">
                          <v-col cols="auto" class="legend-dot" v-bind="props">
                            <div class="legend-color" :style="getShapeStyle(g.color)"></div>
                          </v-col>
                          <v-col cols="auto" class="legend-text" v-bind="props">
                            <span>{{ g.group }}</span>
                          </v-col>
                        </template>
                        <span>{{ g.group }}</span>
                      </v-tooltip>
                    </v-row>
                  </div>
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
                  :node-metric="result?.nodeMetric"
                  :ranking-algorithm="result?.rankingAlgorithm"
                />
                <DiffEdgeDetails
                  v-else-if="selectedLink"
                  :edge="selectedLink"
                  :context-names="contextNames"
                  :points-by-id="pointsById"
                  :get-icon="getNodeIcon"
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
import { Cosmograph, prepareCosmographData } from '@cosmograph/cosmograph';
import { BASE_URL } from '@/components/constants.js';
import { getCookie } from '@/components/authentication/auth.js';
import ContextComparisonPicker from '@/components/modina/ContextComparisonPicker.vue';
import DiffNetworkSettings from '@/components/modina/DiffNetworkSettings.vue';
import NodeRankPanel from '@/components/modina/NodeRankPanel.vue';
import EdgeRankPanel from '@/components/modina/EdgeRankPanel.vue';
import DiffNodeDetails from '@/components/modina/DiffNodeDetails.vue';
import DiffEdgeDetails from '@/components/modina/DiffEdgeDetails.vue';
import GraphToolbar from '@/components/network/GraphToolbar.vue';
import { assignGroupColors, getNodeIcon, saveNetworkState, loadNetworkState, clearNetworkState } from '@/components/network/networkData.js';

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

      cosmographInstance: null,
      selectedPointIndex: null,
      selectedLinkIndex: null,
      // Graph-only cutoff (rank tables always show every node/edge) -- keeps the top N
      // best-ranked nodes and the edges between them, mirroring moDiNA_interface's Top-N slider.
      // null (or >= totalNodeCount) means "all". Set to min(100, totalNodeCount) whenever a new
      // result loads (see pollStatus/loadState), same default as moDiNA_interface.
      topN: null,
      // Graph-only: hides points with no edges within the current Top-N cutoff. Node rank (score)
      // is independent of edge membership, so the Top-N slider alone can't isolate "connected"
      // nodes -- this gives a way to declutter the view without changing the rank-based ordering.
      // Toggling it goes through renderGraph() (full rebuild), not updateGraphData()'s incremental
      // patch -- unlike a Top-N drag, which only ever adds/removes a contiguous tail of the
      // rank-sorted list, this can remove an arbitrary scattered subset of points, and patching
      // that incrementally was observed to occasionally drop or fail to drop the wrong points.
      hideUnconnected: false,
      // Mirrors exactly what's currently fed into cosmographInstance (as of the last renderGraph()/
      // updateGraphData() call), in Cosmograph's own row order -- NOT necessarily the same order as
      // graphPoints/graphLinks (see updateGraphData()'s comment on why links can drift). Cosmograph's
      // click callbacks hand back indices into this order, so this -- not graphPoints/graphLinks --
      // is what index-based resolution (selectedPoint/selectedLink, reapplySelection, centering) must
      // read from.
      _renderedPoints: [],
      _renderedLinks: [],
      physics_on: true,
      imageUrl: null,
      // Static (data-shape) half of the Cosmograph config, passed to prepareCosmographData().
      // The other half -- theming, sizing, click handlers -- is built fresh in renderGraph()/
      // applyDesign() (see there for why), mirroring data-network.vue's split.
      dataConfig: {
        points: {
          pointIdBy: 'id',
          // pointColorByMap is filled in per-run in renderGraph() -- groups aren't known until
          // the result comes back (see buildPointColorMap).
          pointColorBy: 'group',
          pointColorStrategy: 'map',
          // Declared here (not just in the constructor config below) so prepareCosmographData
          // keeps 'id' available for pointSizeByFn to key off of -- see computePointSize, which
          // ignores the column's actual value and only uses the point's index.
          pointSizeBy: 'id',
          pointDefaultSize: 8,
          // display_name is the human-readable variable name (e.g. "Body Mass Index"),
          // sourced from Postgres on the backend (see network/tasks.py's
          // _shape_modina_result) -- falls back to the raw id if a point is missing one.
          pointLabelBy: 'display_name',
          pointLabelFn: (value, index) => value ?? this._renderedPoints?.[index]?.id,
          showLabels: true,
          showHoveredPointLabel: true,
        },
        links: {
          linkSourceBy: 'source',
          linkTargetsBy: ['target'],
          linkWidthBy: 'weight',
          // linkColorByFn only fires when linkColorBy names an actual column (per Cosmograph's
          // own docs) -- without it, edges silently fell back to Cosmograph's default (dim grey)
          // color regardless of linkColorByFn being set. Reuses 'weight' (already needed for
          // linkWidthBy); the column's value itself is ignored, same trick as pointSizeBy/'id'.
          linkColorBy: 'weight',
        },
      },
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
    contextNames() {
      return {
        name1: this.selectedContexts.context1?.contextName,
        name2: this.selectedContexts.context2?.contextName,
      };
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
    // Indices here (selectedPointIndex/selectedLinkIndex) come from Cosmograph click callbacks,
    // which index into whatever was actually rendered -- _renderedPoints/_renderedLinks (see
    // their declaration for why that's not always the same order as graphPoints/graphLinks).
    selectedPoint() {
      if (this.selectedPointIndex == null) return null;
      return this._renderedPoints[this.selectedPointIndex] || null;
    },
    selectedLink() {
      if (this.selectedLinkIndex == null) return null;
      return this._renderedLinks[this.selectedLinkIndex] || null;
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
      this._renderedPoints = [];
      this._renderedLinks = [];
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
            await this.renderGraph();
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

    // group -> hex lookup for Cosmograph's 'map' point-color strategy, mirroring how
    // data-network.vue colors by node_group: groups are fully data-driven (whatever layers the
    // two contexts share), not a fixed set, so each color is generated from the group name
    // itself rather than kept in a hardcoded table.
    buildPointColorMap() {
      const colorMap = {};
      for (const { group, color } of this.legendGroups) {
        colorMap[group] = color;
      }
      return colorMap;
    },

    // Full rebuild -- only called when a genuinely new comparison result comes in. Click/
    // selection/theme changes go through applyDesign() instead (see there), which reuses this
    // same instance via setConfig() rather than tearing it down, exactly like data-network.vue's
    // initializeCosmograph()/applyDesign() split.
    async renderGraph() {
      if (!this.$refs.containerRef || !this.result) {
        console.warn('[modina] renderGraph: aborting, containerRef =', !!this.$refs.containerRef, 'result =', !!this.result);
        return;
      }

      this.dataConfig.points.pointColorByMap = this.buildPointColorMap();

      const prepared = await prepareCosmographData(
        this.dataConfig,
        this.graphPoints,
        this.graphLinks
      );
      if (!prepared) {
        this.errorMessage = 'Failed to prepare graph data for Cosmograph.';
        return;
      }
      const { points, links, cosmographConfig } = prepared;

      await this.safeDestroy(this.cosmographInstance);
      this.cosmographInstance = null;

      // Cosmograph's setConfig() (used by applyDesign()) merges onto this object, not onto
      // whatever's currently active -- so it's kept on the instance and always passed in full,
      // same constraint as data-network.vue's _cosmoConfig (see its comment for why).
      this._cosmoConfig = {
        ...cosmographConfig,
        points,
        links,
        enableSimulation: this.physics_on,
        // Non-selected elements stay clearly present but visually deprioritized once something's
        // selected, rather than Cosmograph's own near-invisible defaults -- same values as the
        // network page.
        pointGreyoutOpacity: 0.55,
        linkGreyoutOpacity: 0.35,
        // The clicked/displayed node renders much bigger than the rest -- see computePointSize().
        pointSizeByFn: (value, index) => this.computePointSize(index),
        selectPointOnClick: false,
        resetSelectionOnEmptyCanvasClick: false,
        renderHoveredPointRing: true,
        backgroundColor: this.labelColor('background'),
        hoveredPointRingColor: this.labelColor('primary-darken-1'),
        unknownColor: this.labelColor('text'),
        linkColorByFn: () => this.labelColor('text'),
        onPointClick: (index) => this.selectPointFromGraph(index),
        onLinkClick: (linkIndex) => this.selectLinkFromGraph(linkIndex),
        onBackgroundClick: () => this.clearSelection(),
        // Physics keeps spreading points; re-fit once it settles so nothing drifts out of view --
        // but skip it while a node/edge is selected, so this doesn't undo the centering a click
        // just asked for (same guard as the network page).
        onSimulationEnd: () => {
          if (this.selectedPointIndex == null && this.selectedLinkIndex == null) {
            this.cosmographInstance?.fitView();
          }
        },
      };

      this.cosmographInstance = new Cosmograph(this.$refs.containerRef, this._cosmoConfig);
      await this.cosmographInstance.dataUploaded?.();
      // Built directly from graphPoints/graphLinks, in that exact order -- the mirror starts out
      // exactly in sync with what Cosmograph now holds.
      this._renderedPoints = this.graphPoints;
      this._renderedLinks = this.graphLinks;
      this.cosmographInstance?.fitView(0);
      this.reapplySelection();
    },

    // Cheap refresh of an already-built instance via setConfig() -- theme toggles and click/
    // selection changes go through here instead of renderGraph(), so pan/zoom/physics state isn't
    // reset every time something's clicked (same split as the network page's applyDesign()).
    async applyDesign() {
      if (!this.cosmographInstance) return;
      this.reapplySelection();
      this._cosmoConfig = {
        ...this._cosmoConfig,
        backgroundColor: this.labelColor('background'),
        hoveredPointRingColor: this.labelColor('primary-darken-1'),
        unknownColor: this.labelColor('text'),
        linkColorByFn: () => this.labelColor('text'),
        // New function reference each call: Cosmograph's config-change detection uses reference
        // equality, and selectedPointIndex can change without points/links changing, so a stable
        // reference here would never actually get re-invoked.
        pointSizeByFn: (value, index) => this.computePointSize(index),
      };
      await this.cosmographInstance.setConfig(this._cosmoConfig);
    },

    // The selected node renders much bigger than the rest -- the value column named by
    // pointSizeBy is ignored; the point is looked up by index instead.
    computePointSize(index) {
      return index === this.selectedPointIndex ? 24 : 8;
    },

    // Pans (not zooms) the camera to center on a point, at whatever zoom level is already
    // active -- a single deterministic code path regardless of how far the camera currently is
    // from the target, unlike zoomToPoint()'s two different transition strategies.
    centerOnPoint(index) {
      const position = this.cosmographInstance?.getPointPositionByIndex(index);
      if (!position) return;
      const currentZoom = this.cosmographInstance.getZoomLevel();
      this.cosmographInstance.setZoomTransformByPointPositions(new Float32Array(position), 700, currentZoom);
    },

    // Fits both endpoints of the selected edge into view (a small zoom/pan, not just a pan --
    // fitViewByIndices() is Cosmograph's own "frame these points" method), so an edge click
    // centers the same way a node click does.
    centerOnEdge(sourceIndex, targetIndex) {
      this.cosmographInstance?.fitViewByIndices([sourceIndex, targetIndex], 700);
    },

    // Highlights the selected node plus all of its direct neighbors (or an edge's two endpoints),
    // dimming everything else via pointGreyoutOpacity/linkGreyoutOpacity -- same mechanic as the
    // network page's reapplySelection(), just without its multi-select-bucket branch (moDiNA only
    // ever has a single selected node or edge, no batch selection).
    reapplySelection() {
      if (!this.cosmographInstance) return;
      let selectedIndices = [];
      if (this.selectedPointIndex != null) {
        selectedIndices = [
          this.selectedPointIndex,
          ...(this.cosmographInstance.getConnectedPointIndices(this.selectedPointIndex) || []),
        ];
      } else if (this.selectedLinkIndex != null && this.selectedLink) {
        const sourceIdx = this._renderedPoints.findIndex((p) => p.id === this.selectedLink.source);
        const targetIdx = this._renderedPoints.findIndex((p) => p.id === this.selectedLink.target);
        selectedIndices = [sourceIdx, targetIdx].filter((i) => i >= 0);
      }
      if (selectedIndices.length) {
        this.cosmographInstance.selectPoints(selectedIndices);
      } else {
        this.cosmographInstance.unselectAllPoints();
      }
    },

    updatePhysics() {
      if (!this.cosmographInstance) return;
      if (this.physics_on) {
        this.cosmographInstance.unpause();
      } else {
        this.cosmographInstance.pause();
      }
    },

    // GraphToolbar's switches are v-model'd through props/events rather than a
    // direct v-model on physics_on/hideUnconnected (the toolbar no longer owns
    // that state) -- these mirror what the old inline @change handlers did.
    onPhysicsChange(value) {
      this.physics_on = value;
      this.updatePhysics();
    },
    onHideUnconnectedChange(value) {
      this.hideUnconnected = value;
      this.renderGraph();
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
    // which sit before the real WebGL graph canvas in DOM order -- a plain querySelector('canvas')
    // grabs one of those (empty except mid-lasso-select) instead. _cosmosElement is Cosmograph's
    // own inner wrapper that holds only the graph canvas; it's what captureScreenshot() itself
    // reads from internally, so this targets the same element.
    async captureImage() {
      const canvas = this.cosmographInstance?._cosmosElement?.querySelector('canvas');
      if (!canvas) {
        console.error('Canvas or context is undefined');
        return;
      }

      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d');
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      offscreenCtx.drawImage(canvas, 0, 0);

      this.drawNodeLabels(offscreenCtx, canvas);

      const legendX = 20;
      const legendHeight = 40 + this.legendGroups.length * 35;
      const legendY = Math.max(50, offscreenCanvas.height / 2 - legendHeight - 100);

      let yOffset = 50;
      this.legendGroups.forEach(({ group, color }) => {
        offscreenCtx.beginPath();
        offscreenCtx.arc(legendX + 25, legendY + yOffset + 15, 15, 0, 2 * Math.PI, false);
        offscreenCtx.fillStyle = color;
        offscreenCtx.fill();

        offscreenCtx.fillStyle = 'black';
        offscreenCtx.font = '18px Arial';
        offscreenCtx.fillText(group.charAt(0).toUpperCase() + group.slice(1), legendX + 55, legendY + yOffset + 20);

        yOffset += 35;
      });

      this.imageUrl = offscreenCanvas.toDataURL();
    },

    // Node labels are rendered as absolutely-positioned DOM elements overlaid on the canvas (see
    // Cosmograph's Labels module), not drawn into the WebGL buffer -- so they never show up in a
    // canvas-only capture, even Cosmograph's own captureScreenshot(). Read each rendered label's
    // text and screen position directly off the DOM and draw it onto the capture ourselves,
    // instead of pulling in a whole-DOM screenshot library just for this.
    drawNodeLabels(ctx, canvas) {
      const labelsContainer = this.cosmographInstance?._labels?.labelsContainer;
      if (!labelsContainer) return;

      const canvasRect = canvas.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height) return;
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      const labelEls = Array.from(labelsContainer.querySelectorAll('*'))
        .filter((el) => el.children.length === 0 && el.textContent?.trim());

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      labelEls.forEach((el) => {
        const style = window.getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        // Cosmograph doesn't remove decluttered/off-screen labels from the DOM -- it fades them
        // to opacity 0.1 via a "hidden" class (see cosmographLabelHidden in its CSS) while keeping
        // shown labels at full opacity. Mirror that distinction instead of drawing every label
        // Cosmograph has ever created, which would make the export far busier than the live view.
        if (style.visibility === 'hidden' || style.display === 'none' || !(opacity > 0.5)) return;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (rect.left - canvasRect.left + rect.width / 2) * scaleX;
        const y = (rect.top - canvasRect.top + rect.height / 2) * scaleY;
        ctx.font = `${parseFloat(style.fontSize) * scaleY}px ${style.fontFamily}`;
        ctx.fillStyle = style.color;
        ctx.fillText(el.textContent.trim(), x, y);
      });
    },

    // Same pattern as data-network.vue's labelColor(): chartjs/Cosmograph don't understand CSS
    // theme vars, so read the resolved hex straight from Vuetify's active theme.
    labelColor(colorName) {
      const themeName = this.$vuetify.theme.global.name;
      return this.$vuetify.theme.themes[themeName]?.colors[colorName];
    },

    getShapeStyle(color) {
      return { borderRadius: '50%', backgroundColor: color, width: '13px', height: '13px' };
    },

    async safeDestroy(instance) {
      if (!instance || typeof instance.destroy !== 'function') return;
      try {
        const res = instance.destroy();
        if (res && typeof res.then === 'function') await res;
      } catch (error) {
        console.warn('Error destroying Cosmograph instance:', error);
      }
    },

    selectPointFromGraph(index) {
      if (index == null) return;
      this.selectedPointIndex = index;
      this.selectedLinkIndex = null;
      this.applyDesign();
      this.centerOnPoint(index);
    },

    selectLinkFromGraph(linkIndex) {
      if (linkIndex == null || !this._renderedLinks.length) return;
      this.selectedLinkIndex = linkIndex;
      this.selectedPointIndex = null;
      this.applyDesign();
      const link = this._renderedLinks[linkIndex];
      if (link) {
        const sourceIdx = this._renderedPoints.findIndex((p) => p.id === link.source);
        const targetIdx = this._renderedPoints.findIndex((p) => p.id === link.target);
        if (sourceIdx >= 0 && targetIdx >= 0) this.centerOnEdge(sourceIdx, targetIdx);
      }
    },

    // Rows clicked in NodeRankPanel/EdgeRankPanel come from the full (untrimmed) result, so the
    // node/edge they refer to may currently be cut off by the Top-N graph filter -- raise it
    // first (ensureTopNIncludes) rather than silently failing to select anything.
    async selectNodeById(item) {
      if (!this.result?.points) return;
      await this.ensureTopNIncludes(item.id);
      const index = this._renderedPoints.findIndex((p) => p.id === item.id);
      if (index >= 0) this.selectPointFromGraph(index);
    },

    async selectEdgeByLabels(item) {
      if (!this.result?.links) return;
      await this.ensureTopNIncludes(item.label1);
      await this.ensureTopNIncludes(item.label2);
      const index = this._renderedLinks.findIndex(
        (l) =>
          (l.source === item.label1 && l.target === item.label2) ||
          (l.source === item.label2 && l.target === item.label1)
      );
      if (index >= 0) this.selectLinkFromGraph(index);
    },

    // If the given node id is currently outside the Top-N cutoff, raises Top-N just enough to
    // include it (and patches the graph) rather than leaving selectNodeById/selectEdgeByLabels
    // unable to find it.
    async ensureTopNIncludes(id) {
      if (this.topN == null || this.topN >= this.totalNodeCount) return;
      const idx = (this.result?.points || []).findIndex((p) => p.id === id);
      if (idx >= 0 && idx + 1 > this.topN) {
        this.topN = idx + 1;
        await this.updateGraphData();
      }
    },

    async onTopNChange(value) {
      const next = Number(value);
      if (!Number.isFinite(next) || next === this.topN) return;
      this.topN = next;
      await this.updateGraphData();
    },

    // Patches the live Cosmograph instance to match the current Top-N target (graphPoints/
    // graphLinks) instead of renderGraph()'s full destroy+recreate -- preserves camera position
    // and the running simulation for points that stay. Falls back to renderGraph() if there's no
    // live instance yet (first render).
    //
    // Diffing is done against _renderedPoints/_renderedLinks (what's actually in Cosmograph right
    // now), not the previous graphPoints/graphLinks -- they're equivalent for points (Top-N is
    // always a prefix of the same rank-sorted list, so growing/shrinking it only ever adds/removes
    // a contiguous tail), but NOT for links: result.links has its own fixed, non-rank-sorted order,
    // so a newly-qualifying link can belong anywhere in that order, not just at the end. Rather
    // than rely on that distinction, _renderedPoints/_renderedLinks are updated afterwards with the
    // exact same remove-then-append sequence sent to Cosmograph, so index-based resolution
    // (onPointClick/onLinkClick, centerOnEdge, reapplySelection) always matches Cosmograph's actual
    // row order, whatever internal reindexing it performs.
    async updateGraphData() {
      if (!this.cosmographInstance) {
        await this.renderGraph();
        return;
      }

      // Capture the current selection by identity (not index -- that shifts as points/links are
      // removed), so it can be re-resolved against the patched order afterwards: kept if it
      // survived the Top-N change, cleared if it didn't.
      const selectedPointId = this.selectedPoint?.id ?? null;
      const linkKey = (l) => `${l.source}|${l.target}`;
      const selectedLinkKey = this.selectedLink ? linkKey(this.selectedLink) : null;

      const prevPoints = this._renderedPoints;
      const prevLinks = this._renderedLinks;
      const nextPoints = this.graphPoints;
      const nextLinks = this.graphLinks;

      const prevPointIds = new Set(prevPoints.map((p) => p.id));
      const nextPointIds = new Set(nextPoints.map((p) => p.id));
      const removedPointIds = prevPoints.filter((p) => !nextPointIds.has(p.id)).map((p) => p.id);
      const addedPoints = nextPoints.filter((p) => !prevPointIds.has(p.id));

      const prevLinkKeys = new Set(prevLinks.map(linkKey));
      const nextLinkKeys = new Set(nextLinks.map(linkKey));
      const removedLinks = prevLinks.filter((l) => !nextLinkKeys.has(linkKey(l)));
      const addedLinks = nextLinks.filter((l) => !prevLinkKeys.has(linkKey(l)));

      if (!removedPointIds.length && !addedPoints.length && !removedLinks.length && !addedLinks.length) return;

      try {
        // Links first, so no add/remove ever leaves a link dangling on a point that's mid-removal.
        if (removedLinks.length) {
          await this.cosmographInstance.removeLinksByPointIdPairs(removedLinks.map((l) => [l.source, l.target]));
        }
        if (removedPointIds.length) {
          await this.cosmographInstance.removePointsByIds(removedPointIds);
        }
        if (addedPoints.length) {
          await this.cosmographInstance.addPoints(addedPoints);
        }
        if (addedLinks.length) {
          await this.cosmographInstance.addLinks(addedLinks);
        }
      } catch (error) {
        console.error('[modina] Incremental graph update failed, falling back to a full rebuild:', error);
        await this.renderGraph();
        return;
      }

      const removedPointIdSet = new Set(removedPointIds);
      this._renderedPoints = [...prevPoints.filter((p) => !removedPointIdSet.has(p.id)), ...addedPoints];
      const removedLinkKeySet = new Set(removedLinks.map(linkKey));
      this._renderedLinks = [...prevLinks.filter((l) => !removedLinkKeySet.has(linkKey(l))), ...addedLinks];

      // addPoints() can introduce a group not present in the previous pointColorByMap (e.g.
      // raising Top-N reveals a node from a data layer that had no other nodes in view yet).
      if (addedPoints.length) {
        this._cosmoConfig = { ...this._cosmoConfig, pointColorByMap: this.buildPointColorMap() };
      }

      let newSelectedPointIndex = null;
      if (selectedPointId != null) {
        const i = this._renderedPoints.findIndex((p) => p.id === selectedPointId);
        if (i >= 0) newSelectedPointIndex = i;
      }
      let newSelectedLinkIndex = null;
      if (newSelectedPointIndex == null && selectedLinkKey != null) {
        const i = this._renderedLinks.findIndex((l) => linkKey(l) === selectedLinkKey);
        if (i >= 0) newSelectedLinkIndex = i;
      }
      this.selectedPointIndex = newSelectedPointIndex;
      this.selectedLinkIndex = newSelectedLinkIndex;

      // Gently reheat the simulation so newly added/removed points settle into the layout instead
      // of sitting exactly where they landed, without flinging the already-settled points around
      // the way a fresh start(1) would -- start() reuses each point's current position, it doesn't
      // reset them. Respects the physics toggle: if the user paused it, leave the layout as-is.
      // No explicit fitView()/recentering here -- the whole point of patching instead of rebuilding
      // is to leave the camera where the user left it; the existing onSimulationEnd handler (see
      // renderGraph()) will fit the view once this settles, same as it does after any other
      // simulation run, but only while nothing is selected.
      if (this.physics_on && (addedPoints.length || removedPointIds.length)) {
        this.cosmographInstance.start(0.3);
      }

      await this.applyDesign();
    },

    clearSelection() {
      this.selectedPointIndex = null;
      this.selectedLinkIndex = null;
      this.applyDesign();
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
        await this.renderGraph();
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
    if (this.cosmographInstance && typeof this.cosmographInstance.destroy === 'function') {
      this.cosmographInstance.destroy();
    }
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
  border-radius: 24px;
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

/* Legend -- same structure/classes as data-network.vue's, so both pages read the same way. */
.legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: transparent;
  z-index: 10;
}

.legend-color {
  margin-right: 8px;
}

.legend-item {
  cursor: default;
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
