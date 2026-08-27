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
      <v-tab v-if="neighboursTabShown" value="edgesOfNode" rounded="pill" variant="tonal" class="mr-2">
        <v-badge :model-value="!!tabHighlights.edgesOfNode" color="error" dot offset-x="-2" offset-y="-2">
          Neighbors of
        </v-badge>
        <v-icon size="16" class="ml-2" @click.stop="$emit('close-tab', 'edgesOfNode')">mdi-close</v-icon>
      </v-tab>
      <v-tab v-if="enrichmentTabShown" value="enrichment" rounded="pill" variant="tonal" class="mr-2">
        <v-badge :model-value="!!tabHighlights.enrichment" color="error" dot offset-x="-2" offset-y="-2">
          Enrichment
        </v-badge>
        <v-icon size="16" class="ml-2" @click.stop="$emit('close-tab', 'enrichment')">mdi-close</v-icon>
      </v-tab>
      <v-tab v-if="nodeSetAnnotationTabShown" value="nodeSetAnnotation" rounded="pill" variant="tonal" class="mr-2">
        <v-badge :model-value="!!tabHighlights.nodeSetAnnotation" color="error" dot offset-x="-2" offset-y="-2">
          Node Set Annotation
        </v-badge>
        <v-icon size="16" class="ml-2" @click.stop="$emit('close-tab', 'nodeSetAnnotation')">mdi-close</v-icon>
      </v-tab>
      <v-tab v-if="communityAnnotationAvailable" value="communityAnnotation" rounded="pill" variant="tonal" class="mr-2">
        <v-badge :model-value="!!tabHighlights.communityAnnotation" color="error" dot offset-x="-2" offset-y="-2">
          Community Annotation
        </v-badge>
        <v-icon size="16" class="ml-2" @click.stop="$emit('close-tab', 'communityAnnotation')">mdi-close</v-icon>
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
        />
      </v-window-item>

      <v-window-item value="nodeSetAnnotation">
        <NodeSetAnnotationResultsPanel
          :tab="nodeSetAnnotationTab"
          @update:tab="$emit('update:nodeSetAnnotationTab', $event)"
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
import NodeSetAnnotationResultsPanel from './NodeSetAnnotationResultsPanel.vue';
import CommunityAnnotationPanel from './CommunityAnnotationPanel.vue';

export default {
  name: 'NetworkTablesPanel',
  components: { NodeRankingTable, EdgeRankingTable, NodeEdgeTable, EnrichmentResultsPanel, NodeSetAnnotationResultsPanel, CommunityAnnotationPanel },
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
    // Whether the Neighbours tab itself is in the tab bar -- distinct from
    // nodeEdgeTableVisible (whether a node is *currently* displayed), since
    // the tab stays put after it's first produced until the user closes it,
    // even if they then click the background or select an edge.
    neighboursTabShown: { type: Boolean, default: false },

    enrichmentTab: { type: String, default: 'enrichment' },
    enrichmentRan: { type: Boolean, default: false },
    enrichmentResults: { type: Array, default: () => [] },
    enrichmentLoading: { type: Boolean, default: false },
    enrichmentTabShown: { type: Boolean, default: false },

    reactomeEnrichmentRan: { type: Boolean, default: false },
    reactomeEnrichmentResults: { type: Array, default: () => [] },
    reactomeEnrichmentLoading: { type: Boolean, default: false },

    nodeSetAnnotationTab: { type: String, default: 'gemini' },
    geminiRan: { type: Boolean, default: false },
    geminiLabel: { type: Object, default: null },
    geminiLoading: { type: Boolean, default: false },
    nodeSetAnnotationTabShown: { type: Boolean, default: false },

    communityAnnotationAvailable: { type: Boolean, default: false },
    communityAnnotationStatus: { type: String, default: 'idle' },
    communityAnnotationProgress: { type: Object, default: null },
    communityAnnotationResults: { type: Object, default: () => ({}) },

    // { edgesOfNode, enrichment, nodeSetAnnotation, communityAnnotation } -- true for a tab
    // that got fresh content while the user was looking elsewhere (see
    // data-network.vue's notifyTablesContentProduced).
    tabHighlights: { type: Object, default: () => ({}) },
  },
  emits: [
    'update:activeTab',
    'update:enrichmentTab',
    'update:nodeSetAnnotationTab',
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
