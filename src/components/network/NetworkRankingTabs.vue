<template>
  <v-card outlined class="mt-4">
    <v-overlay v-model="showLoadingfullNetworkStats" scroll-strategy="none" contained class="d-flex justify-center align-center">
      <v-progress-circular indeterminate color="primary" size="60"></v-progress-circular>
    </v-overlay>
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <slot name="toolbar-actions"></slot>
    </v-toolbar>
    <div v-if="subtitle" class="px-4 pt-2 text-caption text-medium-emphasis">{{ subtitle }}</div>

    <v-tabs v-model="tab" color="primary">
      <v-tab value="edges">
        Edges
        <v-chip size="small" variant="outlined" class="ml-2">{{ edges.length }}</v-chip>
      </v-tab>
      <v-tab value="nodes">
        Nodes
        <v-chip size="small" variant="outlined" class="ml-2">{{ nodes.length }}</v-chip>
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="edges">
        <EdgeRankingTable
          :edges="edges"
          :nodes-by-id="nodesById"
          :interactive="interactive"
          @select-edge="$emit('select-edge', $event)"
        />
      </v-window-item>
      <v-window-item value="nodes">
        <NodeRankingTable
          :nodes="nodes"
          :edges="edges"
          :interactive="interactive"
          @select-node="$emit('select-node', $event)"
        />
      </v-window-item>
    </v-window>
  </v-card>
</template>

<script>
import EdgeRankingTable from './EdgeRankingTable.vue';
import NodeRankingTable from './NodeRankingTable.vue';
import {loadingStates} from "@/components/constants.js";


export default {
  name: 'NetworkRankingTabs',
  components: { EdgeRankingTable, NodeRankingTable },
  props: {
    title: {
      type: String,
      default: 'Network Ranking',
    },
    subtitle: {
      type: String,
      default: '',
    },
    edges: {
      type: Array,
      default: () => [],
    },
    nodes: {
      type: Array,
      default: () => [],
    },
    nodesById: {
      type: [Map, Object],
      default: () => new Map(),
    },
    // Forwarded to both tables -- false for the "Full Network Statistics"
    // instance (a read-only starting point above the graph), true for the
    // instance under the graph, where a row click should focus that node/edge.
    interactive: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['select-node', 'select-edge'],
  data() {
    return {
      tab: 'edges',
    };
  },
  computed: {
        showLoadingfullNetworkStats() {
      return loadingStates.value.isLoadingfullNetworkStats; // Directly reactive to `loadingStates`
    },
  }
};
</script>
