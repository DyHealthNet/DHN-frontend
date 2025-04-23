<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-filter</v-icon>
      Selection
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <v-row justify="center" align="center">
        <v-col cols="auto">
          <v-switch
            :model-value="selectAll"
            @update:model-value="handleSelectAll"
            :label="selectAll ? 'Unselect all' : 'Select All'"
            @change="toggleALLNetworkNodeSelection"
            color="primary-darken-1"
            class="ml-2"
          />
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <span v-if="nodeStore.selectedNetworkNodes.length === 0">
        No node selected. Double click on a node to add it to this panel or select it via the Details panel.
      </span>

      <v-table dense v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(node, index) in nodeStore.selectedNetworkNodes" :key="node.id">
            <td>{{ node.display_name }}</td>
            <td>{{ getPrettyType(node.source_table) }}</td>
            <td>
              <v-btn
                size="small"
                icon
                color="error"
                @click="removeSelectedNetworkNode(index)">
                <v-icon size="20" color="background">mdi-trash-can-outline</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script>
import { nodeInputStore } from "@/stores/nodeInputStore";
import {getPrettyType} from "@/components/generalFunctions.js";


export default {
  name: "SelectionPanel",
  emits: ['update-design', 'check-select-all','update:selectAll'],
  props: {
    networkNodes: {
      type: Object,
      required: true,
    },
    selectAll: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    nodeStore() {
      return nodeInputStore();
    },
  },
  methods: {
    getPrettyType,
    toggleALLNetworkNodeSelection(){
      if(this.selectAll) {
        for (const node of this.networkNodes) {
          if (!this.nodeStore.selectedNetworkNodes.includes(node)) {
            this.nodeStore.selectedNetworkNodes.push(node);  // Add the node if it's not already selected
          }
        }
      }
      else{
        this.nodeStore.selectedNetworkNodes = [];
      }
      this.$emit('update-design');
      this.$emit('check-select-all');
    },
    removeSelectedNetworkNode(index){
      this.nodeStore.selectedNetworkNodes.splice(index, 1);
      this.$emit('update-design');
      this.$emit('check-select-all');
    },
    handleSelectAll(newValue) {
      this.$emit('update:selectAll', newValue); // tells the parent to update
    },
  },
};
</script>