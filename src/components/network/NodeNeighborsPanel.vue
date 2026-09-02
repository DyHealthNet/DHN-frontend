<template>
  <v-card outlined class="mt-4 node-neighbors-panel">
    <v-tabs v-if="nodes.length" :model-value="tab" color="primary-darken-1" @update:model-value="$emit('update:tab', $event)">
      <ClosableTab v-for="node in nodes" :key="node.id" :value="node.id" @close="$emit('close-tab', `neighbor:${node.id}`)">
        {{ node.display_name }} ({{ edgesForNode(node.id).length }})
      </ClosableTab>
    </v-tabs>
    <p v-if="!nodes.length" class="text-caption text-medium-emphasis pa-4">
      Click a node in the visualization to see its edges here.
    </p>
    <div v-else class="pa-4">
      <v-window :model-value="tab">
        <v-window-item v-for="node in nodes" :key="node.id" :value="node.id">
          <NodeEdgeTable
            :items="edgesForNode(node.id)"
            @select-neighbor="$emit('select-neighbor', $event)"
          />
        </v-window-item>
      </v-window>
    </div>
  </v-card>
</template>

<script>
// The "Neighbors of" tab: instead of just the single currently-displayed node, shows the up to
// 5 most-recently-clicked nodes as separate closable sub-tabs, newest first (each labeled with
// its edge count, e.g. "P12345 (12)", rather than repeating the node name again as a title
// inside the tab body) -- data-network.vue owns the MRU list
// (recentNeighborNodeIds/addRecentNeighborNode) and evicts whichever node is furthest right once
// a 6th is clicked. Closing a sub-tab here removes that node from the list entirely (there's no
// separate result to keep around for it, unlike gProfiler/Reactome/Gemini's dismiss-only
// sub-tabs, which keep their fetched data even while hidden). Purely presentational/controlled:
// data-network.vue owns the node list and the edgesForNode lookup.
import ClosableTab from './ClosableTab.vue';
import NodeEdgeTable from './NodeEdgeTable.vue';

export default {
  name: 'NodeNeighborsPanel',
  components: { ClosableTab, NodeEdgeTable },
  props: {
    tab: { type: String, default: null },
    nodes: { type: Array, default: () => [] }, // [{id, display_name, ...}], newest first
    edgesForNode: { type: Function, default: () => [] },
  },
  emits: ['update:tab', 'close-tab', 'select-neighbor'],
};
</script>
