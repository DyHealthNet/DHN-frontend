<template>
  <div v-if="edge">
    <p><span class="label-title">Edge</span></p>
    <p><span class="label">Variables:</span><br>
      <span class="display-name">{{ edge.source }} &nbsp;↔&nbsp; {{ edge.target }}</span></p>

    <v-table density="compact" class="mt-4">
      <tbody>
        <tr v-if="edge.rank != null">
          <td class="label">Rank</td>
          <td class="value">{{ edge.rank }}</td>
        </tr>
        <tr v-if="edge.weight != null">
          <td class="label">Edge metric (absolute)</td>
          <td class="value">{{ formatNumber(edge.weight) }}</td>
        </tr>
        <tr v-if="edge.signed != null">
          <td class="label">Edge metric (signed)</td>
          <td class="value">{{ formatNumber(edge.signed) }}</td>
        </tr>
      </tbody>
    </v-table>

    <p class="label-subtitle mt-4">Per-context statistics</p>
    <v-table density="compact">
      <thead>
        <tr>
          <th></th>
          <th>{{ contextNames.name1 || 'Context 1' }}</th>
          <th>{{ contextNames.name2 || 'Context 2' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="label">Raw p-value</td>
          <td class="value">{{ formatNumber(edge.rawP1) }}</td>
          <td class="value">{{ formatNumber(edge.rawP2) }}</td>
        </tr>
        <tr>
          <td class="label">Raw effect size</td>
          <td class="value">{{ formatNumber(edge.rawE1) }}</td>
          <td class="value">{{ formatNumber(edge.rawE2) }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
  <p v-else class="text-medium-emphasis text-body-2">Select an edge in the graph or the edge rank table to see its details.</p>
</template>

<script>
export default {
  name: 'DiffEdgeDetails',
  props: {
    edge: {
      type: Object,
      default: null,
    },
    contextNames: {
      type: Object,
      default: () => ({ name1: 'Context 1', name2: 'Context 2' }),
    },
  },
  methods: {
    formatNumber(value) {
      if (typeof value !== 'number') return value ?? '-';
      return value.toPrecision(6);
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
  justify-content: center;
  align-items: center;
}
.display-name {
  font-size: 18px;
  color: rgb(var(--v-theme-darken-1));
}
.value {
  padding-left: 0px;
}
</style>
