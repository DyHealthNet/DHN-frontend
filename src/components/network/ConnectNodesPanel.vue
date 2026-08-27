<template>
  <div class="connect-nodes-panel">
    <v-btn
      block
      class="mb-2"
      color="primary-darken-1"
      @click="individualNodeDialogOpen = true"
    >Individual Node</v-btn>

    <v-btn
      block
      color="primary-darken-1"
      @click="setOfNodesDialogOpen = true"
    >Set of Nodes</v-btn>

    <!-- Individual Node: Significance Filtering / Node Count -->
    <AnalysisDialog v-model="individualNodeDialogOpen" title="Individual Node">
      <!-- TODO Add a settings toggle to set the significance threshold/multiple testing
      correction and the per-type node count here, if we don't want the user to only be able to
      set them in Advanced Settings -->
      <v-select
        v-model="individualNodeAction"
        :items="individualNodeActionOptions"
        item-title="title"
        item-value="value"
        label="Action"
        density="compact"
        variant="outlined"
      ></v-select>
      <p class="text-caption text-medium-emphasis mt-n2 mb-2">{{ individualNodeActionDescription }}</p>

      <p v-if="individualNodeDisabled" class="text-caption text-medium-emphasis">
        Select exactly one node on the network to connect it.
      </p>

      <v-btn
        color="primary-darken-1"
        block
        class="mt-2"
        :disabled="individualNodeDisabled"
        @click="runIndividualNodeAction"
      >Connect</v-btn>
    </AnalysisDialog>

    <!-- Set of Nodes: Significance Filtering / Minimum Spanning Tree -->
    <AnalysisDialog v-model="setOfNodesDialogOpen" title="Set of Nodes">
      <v-select
        v-model="setOfNodesAction"
        :items="setOfNodesActionOptions"
        item-title="title"
        item-value="value"
        label="Action"
        density="compact"
        variant="outlined"
      ></v-select>
      <p class="text-caption text-medium-emphasis mt-n2 mb-2">{{ setOfNodesActionDescription }}</p>

      <p v-if="setOfNodesDisabled" class="text-caption text-medium-emphasis">
        Select at least two nodes on the network to connect them.
      </p>

      <v-btn
        color="primary-darken-1"
        block
        class="mt-2"
        :disabled="setOfNodesDisabled"
        @click="runSetOfNodesAction"
      >Connect</v-btn>
    </AnalysisDialog>
  </div>
</template>

<script>
// Button-grid front-end for the Connect Nodes expansion panel, same pattern as
// AnalysisPanel.vue: one button per section (Individual Node, Set of Nodes) opens a single
// popup with a select field (with a short description of the selected action, mirroring the
// Community Detection algorithm select) and one Connect button that runs whichever action is
// currently selected. Purely presentational/controlled: data-network.vue owns
// connectIndividualNode/connectGroupNodes and all the selection state.
import AnalysisDialog from '@/components/AnalysisDialog.vue';

export default {
  name: 'ConnectNodesPanel',
  components: { AnalysisDialog },
  props: {
    selectedNodeCount: { type: Number, default: 0 },
  },
  emits: ['connect-individual-node', 'connect-group-nodes'],
  data() {
    return {
      individualNodeDialogOpen: false,
      setOfNodesDialogOpen: false,
      individualNodeAction: 'significance', // 'significance' | 'nodeCount'
      setOfNodesAction: 'significance', // 'significance' | 'mst'
    };
  },
  computed: {
    individualNodeDisabled() {
      return this.selectedNodeCount !== 1;
    },
    individualNodeActionOptions() {
      return [
        {
          title: 'Significance Filtering',
          value: 'significance',
          description: 'Connects the selected node to every other node whose statistical association passes the significance threshold (see Advanced Settings).',
        },
        {
          title: 'Node Count',
          value: 'nodeCount',
          description: 'Connects the selected node to a fixed number of its most significant neighbors, instead of every node passing the threshold (count set in Advanced Settings).',
        },
      ];
    },
    individualNodeActionDescription() {
      return this.individualNodeActionOptions.find((option) => option.value === this.individualNodeAction)?.description ?? '';
    },
    setOfNodesDisabled() {
      return this.selectedNodeCount <= 1;
    },
    setOfNodesActionOptions() {
      return [
        {
          title: 'Significance Filtering',
          value: 'significance',
          description: 'Connects every pair of the selected nodes whose statistical association passes the significance threshold.',
        },
        {
          title: 'Minimum Spanning Tree',
          value: 'mst',
          description: 'Connects the selected nodes via a minimum spanning tree instead of every pairwise significant edge, for a sparser view.',
        },
      ];
    },
    setOfNodesActionDescription() {
      return this.setOfNodesActionOptions.find((option) => option.value === this.setOfNodesAction)?.description ?? '';
    },
  },
  methods: {
    runIndividualNodeAction() {
      this.$emit('connect-individual-node', this.individualNodeAction === 'nodeCount');
      this.individualNodeDialogOpen = false;
    },
    runSetOfNodesAction() {
      this.$emit('connect-group-nodes', this.setOfNodesAction === 'mst');
      this.setOfNodesDialogOpen = false;
    },
  },
};
</script>
