<template>
    <p><span class="label">Ranking P Value:</span><br>
      <span class="value">{{ formatValue(edge.final_p_value) }}</span>
    </p>
    <p><span class="label">Origin:</span><br>
      <span class="value">{{ edge.set }}</span>
    </p>
    <!-- Dropdowns for P-Value and Effect-Size Attributes -->
    <v-expansion-panels class="mt-8 mb-8" variant="accordion">
      <!-- P-Value Related Attributes -->
      <v-expansion-panel >
        <v-expansion-panel-title>
          <span class="label-title" >Statistical Significance</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <!-- Table for P-Value Related Attributes -->
          <v-table dense>
            <thead>
              <tr>
                <th>Test</th>
                <th>Correction</th>
                <th>P-Value</th>
              </tr>
            </thead>
            <tbody>
              <EdgeAttribute
              v-for="(pValue, pKey) in filteredAttributes.pAttributes"
              sep="_p_"
              :key="pKey"
              :keyName="pKey"
              :value="pValue"
            />
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Effect-Size Related Attributes -->
      <v-expansion-panel>
        <v-expansion-panel-title>
          <span class="label-title" >Effect-Size</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table dense>
            <thead>
            <tr>
              <th>Test</th>
              <th>Effect Size Type</th>
              <th>Effect Size</th>
            </tr>
          </thead>
            <tbody>
            <EdgeAttribute
              v-for="(eValue, eKey) in filteredAttributes.eAttributes"
              sep="_e_"
              :key="eKey"
              :keyName="eKey"
              :value="eValue"
            />
            </tbody>
            </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  <p><span class="label-title" >Connected Nodes:</span></p>
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
// Import EdgeAttribute component
import EdgeAttribute from '@/components/network/EdgeStatisticalAttributes.vue';

export default {
  components: {
    EdgeAttribute,
  },
  props: {
    edge: Object,
    getIcon: Function,
    selectedTests: Object,
  },
  computed: {
    /**
     * Filter and group '_p_' and '_e_' attributes into separate objects
     */
    filteredAttributes() {
      const pAttributes = {};
      const eAttributes = {};

      for (const [key, value] of Object.entries(this.edge)) {
        if (key.includes('_p_') && value !== null && !key.includes('final')) {
          pAttributes[key] = value;
        } else if (key.includes('_e_') && value !== null) {
          eAttributes[key] = value;
        }
      }

      return { pAttributes, eAttributes };
    },
  },
  methods: {
    /**
     * Formats the value to handle numbers and nulls gracefully.
     */
    formatValue(value) {
      if (typeof value === 'number') return value.toPrecision(3); // Format numbers
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

.label-title {
  font-size: 16px;
  color: rgb(var(--v-theme-primary-darken-1));
}

.value {
  padding-left: 0px; /* Adjust the value as needed */
}
</style>