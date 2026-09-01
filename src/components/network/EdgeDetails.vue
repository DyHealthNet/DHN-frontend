<template>
    <p><span class="label-title">Edge</span></p>
    <p><span class="label">Ranking P Value:</span><br>
      <span class="value">{{ formatValue(edge.p_value) }}</span>
    </p>
    <p><span class="label">Origin:</span><br>
      <span class="value">{{ edge.set }}</span>
    </p>
    <!-- Statistical Test Details -->
    <v-table dense class="mt-8 mb-8">
      <thead>
        <tr>
          <th>Test</th>
          <th>P-Value</th>
          <th>Effect Size</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ edge.test_type }}</td>
          <td>{{ formatValue(edge.p_value) }}</td>
          <td>{{ formatValue(edge.effect_size) }}</td>
        </tr>
      </tbody>
    </v-table>
  <p><span class="label-subtitle" >Connected Nodes:</span></p>
    <EdgeNodesTable v-if="edge" :nodes="edgeNodes" />
</template>

<script>
import EdgeNodesTable from './EdgeNodesTable.vue';

export default {
  components: { EdgeNodesTable },
  props: {
    edge: Object,
  },
  computed: {
    edgeNodes() {
      return [
        { id: this.edge.to, label: this.edge.node0_label, description: this.edge.node0_descr, dataType: this.edge.node0_data_type, groupLabel: this.edge.node0_type, groupColor: this.edge.node0_color },
        { id: this.edge.from, label: this.edge.node1_label, description: this.edge.node1_descr, dataType: this.edge.node1_data_type, groupLabel: this.edge.node1_type, groupColor: this.edge.node1_color },
      ];
    },
  },
  methods: {
    /**
     * Formats the value to handle numbers and nulls gracefully.
     */
    formatValue(value) {
      if (typeof value === 'number') return value.toPrecision(6); // Format numbers
      return value; // Default case
    },
  },
};
</script>

<style scoped>
.label {
  font-size: 12px;
  color: rgb(var(--v-theme-primary-darken-1));
}

.label-subtitle {
  font-size: 16px;
  color: rgb(var(--v-theme-primary-darken-1));
}

.label-title {
  font-size: 24px;
  color: rgb(var(--v-theme-primary-darken-1));
  display: flex;
  justify-content: center; /* Horizontal centering */
  align-items: center; /* Vertical centering */
}

.value {
  padding-left: 0px; /* Adjust the value as needed */
}
</style>
