<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      <v-icon color="primary-darken-1" size="25" class="ml-0 mr-3 my-0">mdi-information-outline</v-icon>
      Network Overview
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-card outlined class="network-overview">
        <v-card-text>
          <v-row justify="center" align="center" class="mt-2 mb-2">
            <!-- Nodes -->
            <v-col cols="6" class="text-center">
              <v-label class="text-caption">NODES</v-label>
              <v-sheet color="transparent" class="text-h4 font-weight-bold">
                {{ nodes }}
              </v-sheet>
            </v-col>
            <!-- Edges -->
            <v-col cols="6" class="text-center">
              <v-label class="text-caption">EDGES</v-label>
              <v-sheet color="transparent" class="text-h4 font-weight-bold">
                {{ edges }}
              </v-sheet>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script>
export default {
  name: "NetworkOverviewPanel",
  props: {
    nodes: {
      type: Number,
      required: true,
    },
    edges: {
      type: Number,
      required: true,
    },
  },
};
</script>