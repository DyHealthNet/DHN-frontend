<template>
  <!-- Single root element (not a bare v-for fragment) so class/style passed by the
       caller (e.g. class="legend" for positioning) fall through onto this div,
       the same way they would onto a plain element. -->
  <div class="network-legend">
    <p v-if="title" class="text-caption text-medium-emphasis legend-title">{{ title }}</p>
    <v-row
      v-for="item in items"
      :key="item.key"
      align="center"
      class="mb-2 legend-item"
      :class="{ 'legend-item-active': item.active, 'legend-item-selectable': selectable }"
      no-gutters
      @click="selectable && $emit('select', item.key)"
    >
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-col cols="auto" class="legend-dot" v-bind="props">
            <div class="legend-color" :style="getShapeStyle(item.color)"></div>
          </v-col>
          <v-col cols="auto" class="legend-text" v-bind="props">
            <span>{{ item.label }}</span>
          </v-col>
        </template>
        <span>{{ selectable ? `Click to select/deselect all ${item.label} nodes` : item.label }}</span>
      </v-tooltip>
    </v-row>
  </div>
</template>

<script>
import { getShapeStyle } from '@/components/network/networkData.js';

export default {
  props: {
    // { key, label, color, active? } -- callers own group-key -> label/color/active
    // logic (e.g. clustering vs node-type labels differ between pages), this
    // component only renders whatever it's given.
    items: { type: Array, default: () => [] },
    // Toggles click-to-select styling/behavior (used on the main network page's
    // legend, not on the read-only moDiNA one).
    selectable: { type: Boolean, default: false },
    // Optional heading shown above the items, e.g. "Communities (Leiden)" --
    // omitted entirely (no empty space reserved) when not given.
    title: { type: String, default: '' },
  },
  emits: ['select'],
  methods: {
    getShapeStyle,
  },
};
</script>

<style scoped>
.legend-color {
  margin-right: 8px; /* Space between the color and the text */
}
.legend-title {
  margin-bottom: 4px;
  font-weight: 600;
}
.legend-item {
  cursor: default;
}
.legend-item-selectable {
  cursor: pointer;
}
.legend-item-active .legend-text span {
  font-weight: 700;
  text-decoration: underline;
}
</style>
