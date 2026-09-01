<template>
  <!-- The name/description/group/data-type/ID block shared by NodeDetails.vue
       (main network page) and DiffNodeDetails.vue (moDiNA page) -- everything
       each page shows *around* this (ranking tables, distribution plots, etc.)
       stays in the parent, since those don't overlap between the two pages. -->
  <v-icon
    v-if="iconUrl"
    class="me-6"
    size="50"
    color="transparent"
    style="position: absolute; right: 0;"
  >
    <v-img :src="iconUrl" alt="icon" max-width="40" max-height="40" class="me-0 rounded-circle"></v-img>
  </v-icon>
  <p><span class="label-title">Node</span></p>
  <p><span class="label">Name:</span><br>
    <span class="display-name">{{ displayName }}</span></p>
  <p v-if="description"><span class="label">Description:</span><br>
    <span class="value">{{ description }}</span></p>
  <p v-if="groupLabel"><span class="label">Group:</span><br>
    <v-chip v-if="groupColor" size="small" :style="groupChipStyle">{{ groupLabel }}</v-chip>
    <span v-else>{{ groupLabel }}</span></p>
  <p v-if="dataType"><span class="label">Data Type:</span><br>
    <span class="value">{{ dataType }}</span></p>
  <p v-if="subtype"><span class="label">Subtype:</span><br>
    <span class="value">{{ subtype }}</span></p>
  <span v-if="xrefs.length">
    <span class="label">Reference:</span><br>
    <v-chip
      v-for="(xref, index) in xrefs"
      :key="index"
      :class="{'me-2': index < xrefs.length - 1}"
      class="custom-chip"
      color="node-logo-background"
      variant="outlined"
      size="small"
    >
      <a :href="xref.url" target="_blank" class="custom-link">{{ xref.label }}</a>
    </v-chip>
  </span>
  <p><span class="label">ID:</span><br>
    <span class="value">{{ nodeId }}</span></p>
</template>

<script>
import { getReadableTextColor } from './networkData.js';

export default {
  name: 'NodeIdentityCard',
  props: {
    displayName: { type: String, default: '' },
    nodeId: { type: String, default: '' },
    description: { type: String, default: '' },
    // Pre-resolved label/color -- callers own group-lookup logic (node.type vs.
    // node.group, capitalization, etc. differ between pages), this component
    // only renders whatever it's given.
    groupLabel: { type: String, default: '' },
    groupColor: { type: String, default: '' },
    dataType: { type: String, default: '' },
    // Only NodeDetails.vue (main page) currently has these -- DiffNodeDetails.vue
    // just won't pass them, and the rows simply don't render.
    subtype: { type: String, default: '' },
    xrefs: { type: Array, default: () => [] },
    // Pre-resolved icon URL (caller's own getIcon(...) call) -- the two pages key
    // it off different fields (node.type vs. node.group), so that lookup stays
    // in the parent.
    iconUrl: { type: String, default: '' },
  },
  computed: {
    groupChipStyle() {
      return this.groupColor ? { backgroundColor: this.groupColor, color: getReadableTextColor(this.groupColor) } : {};
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
  font-size: 24px;
  color: rgb(var(--v-theme-primary-darken-1));
  display: flex;
  justify-content: center;
  align-items: center;
}
.display-name {
  font-size: 18px;
  color: rgb(var(--v-theme-darken-1));
  padding-left: 0px;
}
.value {
  padding-left: 0px;
}
.custom-chip {
  background-color: rgb(var(--v-theme-node-logo-background));
  color: rgb(var(--v-theme-darken-1));
  text-decoration: none;
}
.custom-chip a {
  color: rgb(var(--v-theme-darken-1));
}
.custom-link:hover {
  color: rgb(var(--v-theme-background));
  background-color: transparent;
  text-decoration: underline;
}
</style>
