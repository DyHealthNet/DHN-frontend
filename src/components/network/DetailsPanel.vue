<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-magnify</v-icon>
      Details
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <v-divider class="my-4" />

      <template v-if="displayedElementType === 'node'">
        <NodeDetails :getIcon="getIcon" :node="displayedElement" />
        <v-switch
          v-model="isDetailsNodeSelected"
          :label="isDetailsNodeSelected ? 'Selected' : 'Not Selected'"
          @change="toggleNetworkNodeSelection"
          color="primary"
          class="ml-2"
        />
      </template>

      <template v-else-if="displayedElementType === 'edge'">
        <EdgeDetails
          :getIcon="getIcon"
          :edge="displayedElement"
          :selectedTests="nodeStore.selectedTests"
        />
      </template>

      <p v-else>
        No element selected. You can inspect a node or an edge by clicking on it.
      </p>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script>
import NodeDetails from "@/components/network/NodeDetails.vue";
import EdgeDetails from "@/components/network/EdgeDetails.vue";
import { nodeInputStore } from '@/stores/nodeInputStore'
import {getIcon, getPrettyType} from "@/components/generalFunctions.js";


export default {
  name: "DetailsPanel",
  emits: ['update-design', 'check-select-all'],
  components: {EdgeDetails, NodeDetails},
  data() {
    return {
      displayedElement: null,
      displayedElementType: null,   // 'node' or 'edge'
      isDetailsNodeSelected: false,
    }
  },
  computed: {
    nodeStore() {
      return nodeInputStore(); // this makes the store available
    },
  },
  methods: {
    getIcon,
    getPrettyType,
    displayNode(node) {
      node.type = this.getPrettyType(node.source_table);
      this.displayedElement = node;
      this.displayedElementType = "node";
      this.isDetailsNodeSelected = this.isNodeInNetworkSelected(node);
    },
    displayEdge(edge) {
      const nodeID0 = edge.to;
      const nodeID1 = edge.from;
      const node0 = this.networkNodes.find((node) => node.id === nodeID0);
      const node1 = this.networkNodes.find((node) => node.id === nodeID1);
      edge.node0_descr = node0.description;
      edge.node1_descr = node1.description;
      edge.node0_label = node0.display_name;
      edge.node1_label = node1.display_name;
      edge.node0_type = this.getPrettyType(node0.source_table);
      edge.node1_type = this.getPrettyType(node1.source_table);
      this.displayedElement = edge;
      this.displayedElementType = "edge";
    },
    isNodeInNetworkSelected(node) {
      return this.nodeStore.selectedNetworkNodes.some(existingNode => existingNode.id === node.id);

    },
    toggleNetworkNodeSelection() {
      console.log("select node")
      const index = this.nodeStore.selectedNetworkNodes.findIndex(n => n.id === this.displayedElement.id); // Check for the node by unique identifier (id)
      console.log("index", index)
      if (index === -1) {
        console.log("select")
        this.nodeStore.selectedNetworkNodes.push(this.displayedElement);
        this.$emit('update-design');
      } else if (index !== -1) {
        console.log("unselect")
        this.nodeStore.selectedNetworkNodes.splice(index, 1);
        this.$emit('update-design');
      }
      this.$emit('check-select-all');
    },
  }
};
</script>