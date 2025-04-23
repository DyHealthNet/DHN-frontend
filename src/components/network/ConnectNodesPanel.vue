<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-transit-connection-variant</v-icon>
      Connect Nodes
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <!-- Individual Node Section -->
      <v-responsive class="pa-0">
        <v-row></v-row>
        <v-divider class="my-4" />

        <v-row>
          <v-col cols="12">
            <p>Individual Node</p>
          </v-col>
          <v-col cols="12">
            <v-btn
              :disabled="selectedNetworkNodesLength !== 1"
              color="primary-darken-1"
              block
              :class="{'grey lighten-2': selectedNetworkNodesLength !== 1}"
              @click="this.$emit('connect-individual-node', false)"
            >
              Significance Filtering
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn
              :disabled="selectedNetworkNodesLength !== 1"
              color="primary-darken-1"
              block
              :class="{'grey lighten-2': selectedNetworkNodesLength !== 1}"
              @click="this.$emit('connect-individual-node', true)"
            >
              Node Count
            </v-btn>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <!-- Set of Nodes Section -->
        <v-row>
          <v-col cols="12">
            <p>Set of Nodes</p>
          </v-col>
          <v-col cols="12">
            <v-btn
              class="mt-2"
              :disabled="selectedNetworkNodesLength <= 1"
              color="primary-darken-1"
              block
              :class="{'grey lighten-2': selectedNetworkNodesLength <= 1}"
              @click="this.$emit('connect-group-nodes', false)"
            >
              Significance Filtering
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn
              class="mt-2"
              :disabled="selectedNetworkNodesLength <= 1"
              color="primary-darken-1"
              block
              :class="{'grey lighten-2': selectedNetworkNodesLength <= 1}"
              @click="this.$emit('connect-group-nodes', true)"
            >
              Minimum Spanning Tree
            </v-btn>
          </v-col>
        </v-row>
      </v-responsive>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script>
import { nodeInputStore } from '@/stores/nodeInputStore'

export default {
  name: 'ConnectNodesPanel',
  emits: ['connect-individual-node', 'connect-group-nodes'],
  props: {
    selectedNetworkNodesLength: {
      type: Number,
      required: true,
    },
  },
}
</script>