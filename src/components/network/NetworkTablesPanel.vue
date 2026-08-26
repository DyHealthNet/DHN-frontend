<template>
  <div class="network-tables-panel">
    <v-tabs :model-value="activeTab" color="primary-darken-1" @update:model-value="$emit('update:activeTab', $event)">
      <v-tab value="nodeRanking">Node Ranking</v-tab>
      <v-tab value="edgeRanking">Edge Ranking</v-tab>
      <v-tab value="edgesOfNode" :disabled="!nodeEdgeTableVisible">Edges of Node</v-tab>
      <v-tab value="enrichment" :disabled="!enrichmentTabAvailable">Enrichments</v-tab>
      <v-tab value="communityAnnotation" :disabled="!communityAnnotationAvailable">Community Annotation</v-tab>
    </v-tabs>

    <v-window :model-value="activeTab">
      <v-window-item value="nodeRanking">
        <NodeRankingTable
          :nodes="graphNodes"
          :edges="graphEdges"
          interactive
          :selected-node-ids="selectedNodeIds"
          :clustering-active="clusteringActive"
          :community-label-for="communityLabelFor"
          @select-node="$emit('select-node', $event)"
          @toggle-select-node="$emit('toggle-select-node', $event)"
        />
      </v-window-item>

      <v-window-item value="edgeRanking">
        <EdgeRankingTable
          :edges="graphEdges"
          :nodes-by-id="nodesById"
          interactive
          @select-edge="$emit('select-edge', $event)"
        />
      </v-window-item>

      <v-window-item value="edgesOfNode">
        <NodeEdgeTable
          v-if="nodeEdgeTableVisible"
          :node-label="nodeLabel"
          :items="nodeEdgeTableItems"
          @select-neighbor="$emit('select-neighbor', $event)"
        />
        <p v-else class="text-caption text-medium-emphasis pa-4">
          Click a node in the visualization to see its edges here.
        </p>
      </v-window-item>

      <v-window-item value="enrichment">
        <EnrichmentResultsPanel
          :tab="enrichmentTab"
          @update:tab="$emit('update:enrichmentTab', $event)"
          :enrichment-ran="enrichmentRan"
          :enrichment-results="enrichmentResults"
          :enrichment-loading="enrichmentLoading"
          :reactome-enrichment-ran="reactomeEnrichmentRan"
          :reactome-enrichment-results="reactomeEnrichmentResults"
          :reactome-enrichment-loading="reactomeEnrichmentLoading"
          :gemini-ran="geminiRan"
          :gemini-label="geminiLabel"
          :gemini-loading="geminiLoading"
        />
      </v-window-item>

      <v-window-item value="communityAnnotation">
        <CommunityAnnotationPanel
          :status="communityAnnotationStatus"
          :progress="communityAnnotationProgress"
          :results="communityAnnotationResults"
          @run-community-annotation="$emit('run-community-annotation')"
        />
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
// The "Tables" side of the Visualization/Tables tab switch in the Network page's graph
// card -- a flat row of every ranking/result table the current graph view can produce.
// Pulled out of data-network.vue so that already-large file doesn't grow further with
// table-switching markup. Purely presentational/controlled: data-network.vue owns all the
// state, this only renders it and reports selection/tab changes back.
import NodeRankingTable from './NodeRankingTable.vue';
import EdgeRankingTable from './EdgeRankingTable.vue';
import NodeEdgeTable from './NodeEdgeTable.vue';
import EnrichmentResultsPanel from './EnrichmentResultsPanel.vue';
import CommunityAnnotationPanel from './CommunityAnnotationPanel.vue';

export default {
  name: 'NetworkTablesPanel',
  components: { NodeRankingTable, EdgeRankingTable, NodeEdgeTable, EnrichmentResultsPanel, CommunityAnnotationPanel },
  props: {
    activeTab: { type: String, default: 'nodeRanking' },

    graphNodes: { type: Array, default: () => [] },
    graphEdges: { type: Array, default: () => [] },
    nodesById: { type: [Map, Object], default: () => new Map() },

    selectedNodeIds: { type: Array, default: () => [] },
    clusteringActive: { type: Boolean, default: false },
    communityLabelFor: { type: Function, default: null },

    nodeEdgeTableVisible: { type: Boolean, default: false },
    nodeLabel: { type: String, default: '' },
    nodeEdgeTableItems: { type: Array, default: () => [] },

    enrichmentTab: { type: String, default: 'enrichment' },
    enrichmentRan: { type: Boolean, default: false },
    enrichmentResults: { type: Array, default: () => [] },
    enrichmentLoading: { type: Boolean, default: false },

    reactomeEnrichmentRan: { type: Boolean, default: false },
    reactomeEnrichmentResults: { type: Array, default: () => [] },
    reactomeEnrichmentLoading: { type: Boolean, default: false },

    geminiRan: { type: Boolean, default: false },
    geminiLabel: { type: Object, default: null },
    geminiLoading: { type: Boolean, default: false },

    communityAnnotationAvailable: { type: Boolean, default: false },
    communityAnnotationStatus: { type: String, default: 'idle' },
    communityAnnotationProgress: { type: Object, default: null },
    communityAnnotationResults: { type: Object, default: () => ({}) },
  },
  emits: [
    'update:activeTab',
    'update:enrichmentTab',
    'select-node',
    'select-edge',
    'select-neighbor',
    'toggle-select-node',
    'run-community-annotation',
  ],
  computed: {
    enrichmentTabAvailable() {
      return this.enrichmentRan || this.enrichmentLoading
        || this.reactomeEnrichmentRan || this.reactomeEnrichmentLoading
        || this.geminiRan || this.geminiLoading;
    },
  },
};
</script>
