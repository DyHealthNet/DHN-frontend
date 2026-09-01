<template>
  <!-- Single root element so class/style passed by the caller (e.g. positioning
       over the graph, matching NetworkLegend's own convention) lands here. -->
  <div class="gradient-legend">
    <p v-if="title" class="text-caption text-medium-emphasis legend-title">{{ title }}</p>
    <div class="gradient-legend-bar" :style="{ background: gradientCss }"></div>
    <div class="gradient-legend-labels text-caption text-medium-emphasis">
      <span v-for="(label, i) in labels" :key="i">{{ label }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GradientLegend',
  props: {
    // Caller builds the full CSS `background` value (e.g. a `linear-gradient(...)`
    // string) -- this component only renders it, since the actual color stops
    // (theme colors, diverging vs. sequential, etc.) are page-specific.
    gradientCss: { type: String, required: true },
    // Rendered left-to-right, evenly spaced, below the bar -- 2 entries for a
    // sequential scale's min/max, 3 for a diverging scale's negative/0/positive.
    labels: { type: Array, default: () => [] },
    title: { type: String, default: '' },
  },
};
</script>

<style scoped>
.gradient-legend {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  width: 170px;
}
.legend-title {
  margin-bottom: 4px;
  font-weight: 600;
}
.gradient-legend-bar {
  width: 100%;
  height: 10px;
  border-radius: 4px;
  border: 1px solid rgba(128, 128, 128, 0.4);
}
.gradient-legend-labels {
  display: flex;
  justify-content: space-between;
}
</style>
