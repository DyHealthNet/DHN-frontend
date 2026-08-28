<template>
  <div class="network-tables-panel">
    <v-tabs
      :model-value="activeTab"
      color="primary-darken-1"
      slider-color="transparent"
      density="comfortable"
      class="chip-tabs"
      @update:model-value="$emit('update:activeTab', $event)"
    >
      <v-tab value="nodeRanking" rounded="pill" variant="tonal" class="mr-2">Node Ranking</v-tab>
      <v-tab value="edgeRanking" rounded="pill" variant="tonal" class="mr-2">Edge Ranking</v-tab>
      <v-tab value="edgesOfNode" rounded="pill" variant="tonal" class="mr-2">
        <v-badge :model-value="!!tabHighlights.edgesOfNode" color="error" dot offset-x="-2" offset-y="-2">
          Neighbors of
        </v-badge>
      </v-tab>
      <v-tab value="enrichment" rounded="pill" variant="tonal" class="mr-2">
        <v-badge :model-value="!!tabHighlights.enrichment" color="error" dot offset-x="-2" offset-y="-2">
          Enrichment
        </v-badge>
      </v-tab>
      <v-tab value="nodeSetAnnotation" rounded="pill" variant="tonal" class="mr-2">
        <v-badge :model-value="!!tabHighlights.nodeSetAnnotation" color="error" dot offset-x="-2" offset-y="-2">
          Node Set Annotation
        </v-badge>
      </v-tab>
      <v-tab value="communityAnnotation" rounded="pill" variant="tonal" class="mr-2">
        <v-badge :model-value="!!tabHighlights.communityAnnotation" color="error" dot offset-x="-2" offset-y="-2">
          Community Annotation
        </v-badge>
      </v-tab>
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
          :displayed-node-id="displayedNodeId"
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
        <NodeNeighborsPanel
          :tab="neighborsTab"
          @update:tab="$emit('update:neighborsTab', $event)"
          :nodes="neighborNodes"
          :edges-for-node="edgesForNode"
          @select-neighbor="$emit('select-neighbor', $event)"
          @close-tab="$emit('close-tab', $event)"
        />
      </v-window-item>

      <v-window-item value="enrichment">
        <EnrichmentResultsPanel
          :tab="enrichmentTab"
          @update:tab="$emit('update:enrichmentTab', $event)"
          :enrichment-ran="enrichmentRan"
          :enrichment-results="enrichmentResults"
          :enrichment-loading="enrichmentLoading"
          :gprofiler-sub-tab-dismissed="gprofilerSubTabDismissed"
          :reactome-enrichment-ran="reactomeEnrichmentRan"
          :reactome-enrichment-results="reactomeEnrichmentResults"
          :reactome-enrichment-loading="reactomeEnrichmentLoading"
          :reactome-sub-tab-dismissed="reactomeSubTabDismissed"
          @close-tab="$emit('close-tab', $event)"
        />
      </v-window-item>

      <v-window-item value="nodeSetAnnotation">
        <NodeSetAnnotationResultsPanel
          :tab="nodeSetAnnotationTab"
          @update:tab="$emit('update:nodeSetAnnotationTab', $event)"
          :gemini-label="geminiLabel"
          :gemini-loading="geminiLoading"
          :gemini-sub-tab-dismissed="geminiSubTabDismissed"
          @close-tab="$emit('close-tab', $event)"
        />
      </v-window-item>

      <v-window-item value="communityAnnotation">
        <CommunityAnnotationPanel
          :status="communityAnnotationStatus"
          :progress="communityAnnotationProgress"
          :results="communityAnnotationResults"
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
import NodeNeighborsPanel from './NodeNeighborsPanel.vue';
import EnrichmentResultsPanel from './EnrichmentResultsPanel.vue';
import NodeSetAnnotationResultsPanel from './NodeSetAnnotationResultsPanel.vue';
import CommunityAnnotationPanel from './CommunityAnnotationPanel.vue';

export default {
  name: 'NetworkTablesPanel',
  components: { NodeRankingTable, EdgeRankingTable, NodeNeighborsPanel, EnrichmentResultsPanel, NodeSetAnnotationResultsPanel, CommunityAnnotationPanel },
  props: {
    activeTab: { type: String, default: 'nodeRanking' },

    graphNodes: { type: Array, default: () => [] },
    graphEdges: { type: Array, default: () => [] },
    nodesById: { type: [Map, Object], default: () => new Map() },

    selectedNodeIds: { type: Array, default: () => [] },
    clusteringActive: { type: Boolean, default: false },
    communityLabelFor: { type: Function, default: null },
    displayedNodeId: { type: String, default: null },

    neighborsTab: { type: String, default: null },
    neighborNodes: { type: Array, default: () => [] },
    edgesForNode: { type: Function, default: () => [] },

    enrichmentTab: { type: String, default: 'enrichment' },
    enrichmentRan: { type: Boolean, default: false },
    enrichmentResults: { type: Array, default: () => [] },
    enrichmentLoading: { type: Boolean, default: false },
    gprofilerSubTabDismissed: { type: Boolean, default: false },

    reactomeEnrichmentRan: { type: Boolean, default: false },
    reactomeEnrichmentResults: { type: Array, default: () => [] },
    reactomeEnrichmentLoading: { type: Boolean, default: false },
    reactomeSubTabDismissed: { type: Boolean, default: false },

    nodeSetAnnotationTab: { type: String, default: 'gemini' },
    geminiLabel: { type: Object, default: null },
    geminiLoading: { type: Boolean, default: false },
    geminiSubTabDismissed: { type: Boolean, default: false },

    communityAnnotationStatus: { type: String, default: 'idle' },
    communityAnnotationProgress: { type: Object, default: null },
    communityAnnotationResults: { type: Object, default: () => ({}) },

    // { edgesOfNode, enrichment, nodeSetAnnotation, communityAnnotation } -- true for a tab
    // that got fresh content while the user was looking elsewhere (see
    // data-network.vue's notifyTablesContentProduced). These top-level tabs are always shown
    // now (not closable) -- only their sub-tabs (gProfiler/Reactome within Enrichment, Gemini
    // within Node Set Annotation) can be individually closed, see close-tab above.
    tabHighlights: { type: Object, default: () => ({}) },
  },
  emits: [
    'update:activeTab',
    'update:enrichmentTab',
    'update:nodeSetAnnotationTab',
    'update:neighborsTab',
    'select-node',
    'select-edge',
    'select-neighbor',
    'toggle-select-node',
    'close-tab',
  ],
};
</script>

<style scoped>
/* Chip-look for the top-level table tabs: compact, pill-shaped, spaced apart,
   rather than a flush full-width Material tab bar. */
.chip-tabs :deep(.v-tab) {
  flex: 0 0 auto;
  min-width: 0;
}
</style>
