<template>
    <p><span class="label-title">Edge</span></p>
    <p><span class="label">Ranking P Value:</span><br>
      <span class="value">{{ formatValue(edge.final_p_value) }}</span>
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
          <td>{{ formatValue(edge.final_p_value) }}</td>
          <td>{{ formatValue(edge.final_e_value) }}</td>
        </tr>
      </tbody>
    </v-table>
  <p><span class="label-subtitle" >Connected Nodes:</span></p>
    <v-table dense v-if="edge">
      <thead>
      </thead>
      <tbody>
        <!-- Row for Display Name -->
        <tr>
          <td><span class="label">Display Name</span></td>
          <td>{{ edge.node0_label }}</td>
          <td>{{ edge.node1_label }}</td>
        </tr>
        <!-- Row for ID -->
        <tr>
          <td><span class="label">ID</span></td>
          <td>{{ edge.to }}</td>
          <td>{{ edge.from }}</td>
        </tr>
        <!-- Row for Description -->
        <tr>
          <td><span class="label">Description</span></td>
          <td>{{ edge.node0_descr }}</td>
          <td>{{ edge.node1_descr }}</td>
        </tr>
        <!-- Row for Icons -->
        <tr>
          <td><span class="label">Type</span></td>
          <td>
            <v-icon size="50" color="transparent">
              <v-img
                :src="getIcon(edge.node0_type)"
                alt="Node 0 Icon"
                max-width="40"
                max-height="40"
                class="rounded-circle"
              />
            </v-icon>
          </td>
          <td>
            <v-icon size="50" color="transparent">
              <v-img
                :src="getIcon(edge.node1_type)"
                alt="Node 1 Icon"
                max-width="40"
                max-height="40"
                class="rounded-circle"
              />
            </v-icon>
          </td>
        </tr>
      </tbody>
    </v-table>
</template>

<script>
export default {
  props: {
    edge: Object,
    getIcon: Function,
    selectedTests: Object,
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