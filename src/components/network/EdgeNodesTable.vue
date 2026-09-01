<template>
  <!-- The two-endpoint "Display Name / ID / Description / Data Type / Group" table
       shared by EdgeDetails.vue (main network page) and DiffEdgeDetails.vue
       (moDiNA page) -- everything each page shows *around* this (ranking,
       per-context statistics, relationship plots, etc.) stays in the parent. -->
  <v-table density="compact">
    <tbody>
      <tr>
        <td><span class="label">Display Name</span></td>
        <td v-for="n in nodes" :key="`name-${n.id}`">{{ n.label }}</td>
      </tr>
      <tr>
        <td><span class="label">ID</span></td>
        <td v-for="n in nodes" :key="`id-${n.id}`">{{ n.id }}</td>
      </tr>
      <tr>
        <td><span class="label">Description</span></td>
        <td v-for="n in nodes" :key="`descr-${n.id}`">{{ n.description || '-' }}</td>
      </tr>
      <tr v-if="nodes.some((n) => n.dataType)">
        <td><span class="label">Data Type</span></td>
        <td v-for="n in nodes" :key="`type-${n.id}`">{{ n.dataType || '-' }}</td>
      </tr>
      <tr v-if="nodes.some((n) => n.groupLabel)">
        <td><span class="label">Group</span></td>
        <td v-for="n in nodes" :key="`group-${n.id}`">
          <v-chip v-if="n.groupColor" size="small" :style="chipStyle(n.groupColor)">{{ n.groupLabel }}</v-chip>
          <span v-else>{{ n.groupLabel || '-' }}</span>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script>
import { getReadableTextColor } from './networkData.js';

export default {
  name: 'EdgeNodesTable',
  props: {
    // Exactly 2 entries (one per edge endpoint), each { id, label, description,
    // dataType?, groupLabel?, groupColor? } -- callers own the field-name
    // mapping (edge.node0_label vs. sourceLabel, etc.), this component only
    // renders whatever it's given. dataType/groupLabel rows are omitted
    // entirely when neither endpoint has a value.
    nodes: { type: Array, required: true },
  },
  methods: {
    chipStyle(color) {
      return { backgroundColor: color, color: getReadableTextColor(color) };
    },
  },
};
</script>

<style scoped>
.label {
  font-size: 12px;
  color: rgb(var(--v-theme-primary-darken-1));
}
</style>
