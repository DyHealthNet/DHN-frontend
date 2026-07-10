<template>
  <v-app>
    <v-main>
      <v-container class="modina-page py-10">
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
            <DiffNetworkSettings v-model="settings" />
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
          <v-col cols="12" md="8">
            <v-card class="graph-card" rounded="xl" elevation="8">
              <v-toolbar color="primary-darken-1" density="comfortable">
                <v-toolbar-title>Differential Network Visualization</v-toolbar-title>
                <v-spacer />
                <v-chip size="small" color="white" variant="outlined" class="mr-2">
                  {{ result.points?.length || 0 }} nodes
                </v-chip>
                <v-chip size="small" color="white" variant="outlined" class="mr-3">
                  {{ result.links?.length || 0 }} edges
                </v-chip>
                <v-btn
                  color="white"
                  variant="outlined"
                  size="small"
                  :disabled="!selectedPointIndex && !selectedLinkIndex"
                  @click="clearSelection"
                >
                  Deselect
                </v-btn>
              </v-toolbar>
              <v-card-text>
                <div class="graph-stage">
                  <div ref="containerRef" class="graph-container"></div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="info-card" rounded="xl" elevation="8">
              <v-toolbar color="primary-darken-1" density="comfortable">
                <v-toolbar-title>Details</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <DiffNodeDetails v-if="selectedPoint" :node="selectedPoint" />
                <DiffEdgeDetails
                  v-else-if="selectedLink"
                  :edge="selectedLink"
                  :context-names="contextNames"
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
              :items="result.nodeRanking || []"
              :selected-node="selectedPoint?.id"
              @select-node="selectNodeById"
            />
          </v-col>
          <v-col cols="12" md="6">
            <EdgeRankPanel
              :items="result.edgeRanking || []"
              :selected-edge="selectedLink ? `${selectedLink.source}_${selectedLink.target}` : null"
              @select-edge="selectEdgeByLabels"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
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

export default {
  name: 'DifferentialNetworkPage',
  components: {
    ContextComparisonPicker,
    DiffNetworkSettings,
    NodeRankPanel,
    EdgeRankPanel,
    DiffNodeDetails,
    DiffEdgeDetails,
  },
  data() {
    return {
      selectedContexts: { context1: null, context2: null },
      settings: {
        edgeMetric: 'diff-L-PE',
        nodeMetric: 'WDC-E',
        rankingAlg: 'PageRank+',
        maxPathLength: 2,
        testType: 'nonparametric',
        correction: 'bh',
        filterTarget: null,
        filterMethod: null,
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
      dataConfig: {
        points: {
          pointIdBy: 'id',
          pointColorBy: 'type',
          pointColorStrategy: 'categorical',
          pointSizeBy: 'score',
          pointDefaultSize: 8,
          pointLabelBy: 'id',
          showLabels: true,
          showHoveredPointLabel: true,
        },
        links: {
          linkSourceBy: 'source',
          linkTargetsBy: ['target'],
          linkWidthBy: 'weight',
        },
      },
    };
  },
  computed: {
    canRun() {
      return (
        this.selectedContexts.context1 &&
        this.selectedContexts.context2 &&
        (this.settings.edgeMetric || this.settings.nodeMetric) &&
        this.settings.rankingAlg &&
        !this.isRunning
      );
    },
    hasResult() {
      return !!this.result;
    },
    contextNames() {
      return {
        name1: this.selectedContexts.context1?.contextName,
        name2: this.selectedContexts.context2?.contextName,
      };
    },
    selectedPoint() {
      if (this.selectedPointIndex == null || !this.result?.points) return null;
      return this.result.points[this.selectedPointIndex] || null;
    },
    selectedLink() {
      if (this.selectedLinkIndex == null || !this.result?.links) return null;
      return this.result.links[this.selectedLinkIndex] || null;
    },
  },
  methods: {
    buildRequestBody() {
      return {
        context1: this.selectedContexts.context1.contextValue,
        context2: this.selectedContexts.context2.contextValue,
        edgeMetric: this.settings.edgeMetric,
        nodeMetric: this.settings.nodeMetric,
        rankingAlg: this.settings.rankingAlg,
        maxPathLength: this.settings.maxPathLength,
        testType: this.settings.testType,
        correction: this.settings.correction,
        filterTarget: this.settings.filterTarget,
        filterMethod: this.settings.filterMethod,
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
      this.clearSelection();
      this.statusText = 'Starting differential network computation...';

      try {
        const response = await fetch(`${BASE_URL}/diffnet/api/createComparison`, {
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
          const url = new URL(`${BASE_URL}/diffnet/api/comparisonStatus`);
          url.search = new URLSearchParams({ runId: this.runId });
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            credentials: 'include',
          });
          const data = await response.json();

          if (data.status === 'SUCCESS') {
            this.result = data.result;
            this.statusText = 'Comparison finished.';
            this.isRunning = false;
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

    async renderGraph() {
      if (!this.$refs.containerRef || !this.result) return;

      const prepared = await prepareCosmographData(
        this.dataConfig,
        this.result.points || [],
        this.result.links || []
      );
      if (!prepared) {
        this.errorMessage = 'Failed to prepare graph data for Cosmograph.';
        return;
      }
      const { points, links, cosmographConfig } = prepared;

      await this.safeDestroy(this.cosmographInstance);
      this.cosmographInstance = null;

      this.cosmographInstance = new Cosmograph(this.$refs.containerRef, {
        points,
        links,
        selectPointOnClick: false,
        resetSelectionOnEmptyCanvasClick: false,
        onPointClick: (pointLike) => this.selectPointFromGraph(pointLike),
        ...cosmographConfig,
      });
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

    resolvePointIndex(pointLike) {
      if (typeof pointLike === 'number') return pointLike;
      if (!pointLike) return null;
      if (typeof pointLike.index === 'number') return pointLike.index;
      if (pointLike.id == null || !this.result?.points) return null;
      const idx = this.result.points.findIndex((p) => p && p.id === pointLike.id);
      return idx >= 0 ? idx : null;
    },

    selectPointFromGraph(pointLike) {
      const index = this.resolvePointIndex(pointLike);
      if (index == null) return;
      this.selectedPointIndex = index;
      this.selectedLinkIndex = null;
    },

    selectNodeById(item) {
      if (!this.result?.points) return;
      const index = this.result.points.findIndex((p) => p.id === item.node);
      if (index >= 0) {
        this.selectedPointIndex = index;
        this.selectedLinkIndex = null;
        this.cosmographInstance?.selectPoint?.(index, false, false);
      }
    },

    selectEdgeByLabels(item) {
      if (!this.result?.links) return;
      const index = this.result.links.findIndex(
        (l) =>
          (l.source === item.label1 && l.target === item.label2) ||
          (l.source === item.label2 && l.target === item.label1)
      );
      if (index >= 0) {
        this.selectedLinkIndex = index;
        this.selectedPointIndex = null;
      }
    },

    clearSelection() {
      this.selectedPointIndex = null;
      this.selectedLinkIndex = null;
      this.cosmographInstance?.unselectAllPoints?.();
    },
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
  font-size: clamp(2rem, 4vw, 3.2rem);
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
  border-radius: 20px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(25, 118, 210, 0.10), transparent 34%),
    radial-gradient(circle at bottom right, rgba(255, 193, 7, 0.08), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(250, 250, 250, 0.98));
  border: 1px dashed rgba(25, 118, 210, 0.25);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.graph-container {
  width: 100%;
  height: 640px;
}
</style>
