<template>
  <div ref="rootEl">
  <div v-if="edge">
    <p><span class="label-title">Edge</span></p>
    <p class="display-name text-center">{{ sourceLabel }} &nbsp;↔&nbsp; {{ targetLabel }}</p>

    <p class="label-subtitle mt-4">Nodes</p>
    <v-table density="compact">
      <tbody>
        <tr>
          <td><span class="label">ID</span></td>
          <td class="value">{{ edge.source }}</td>
          <td class="value">{{ edge.target }}</td>
        </tr>
        <tr>
          <td><span class="label">Description</span></td>
          <td class="value">{{ sourceDescription || '-' }}</td>
          <td class="value">{{ targetDescription || '-' }}</td>
        </tr>
        <tr v-if="getIcon">
          <td><span class="label">Type</span></td>
          <td>
            <v-icon size="50" color="transparent">
              <v-img :src="getIcon(sourceGroup)" alt="Node 1 icon" max-width="40" max-height="40" class="rounded-circle" />
            </v-icon>
          </td>
          <td>
            <v-icon size="50" color="transparent">
              <v-img :src="getIcon(targetGroup)" alt="Node 2 icon" max-width="40" max-height="40" class="rounded-circle" />
            </v-icon>
          </td>
        </tr>
      </tbody>
    </v-table>

    <p class="label-subtitle mt-4">Ranking</p>
    <v-table density="compact">
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
          <td class="label">Adjusted p-value</td>
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

    <template v-if="context1 && context2">
      <p class="label-subtitle mt-4">Relationship between contexts</p>
      <div v-if="relationshipPlot" class="relationship-plot">
        <component
          :is="relationshipPlot"
          :xVar="relationshipXVar"
          :yVar="relationshipYVar"
          :xLabel="relationshipXLabel"
          :yLabel="relationshipYLabel"
          :context1="context1"
          :context2="context2"
          :textSize="13"
          :width="plotWidth"
          :height="280"
          v-bind="relationshipPlotProps"
        />
      </div>
      <p v-else class="text-medium-emphasis text-body-2">
        Variable types for this edge's nodes aren't available, so a relationship plot can't be chosen.
      </p>
    </template>
  </div>
  <p v-else class="text-medium-emphasis text-body-2">Select an edge in the graph or the edge rank table to see its details.</p>
  </div>
</template>

<script>
import OverviewBox from '@/components/plots/OverviewBox.vue';
import OverviewHeatmap from '@/components/plots/OverviewHeatmap.vue';
import OverviewLine from '@/components/plots/OverviewLine.vue';

export default {
  name: 'DiffEdgeDetails',
  components: { OverviewBox, OverviewHeatmap, OverviewLine },
  props: {
    edge: {
      type: Object,
      default: null,
    },
    contextNames: {
      type: Object,
      default: () => ({ name1: 'Context 1', name2: 'Context 2' }),
    },
    // id -> point lookup (from differential-network.vue's result.points), used only to surface
    // each endpoint's description here -- avoids duplicating it onto every edge on the backend.
    pointsById: {
      type: Object,
      default: () => ({}),
    },
    // Same group -> icon lookup the main network page's NodeDetails/EdgeDetails use
    // (data-network.vue's getIcon, now shared via networkData.js's getNodeIcon).
    getIcon: {
      type: Function,
      default: null,
    },
    // The two compared contexts ({ contextValue, contextName }) -- same props DiffNodeDetails
    // takes, needed here for the relationship plots' contextValue (contextNames only has names).
    context1: {
      type: Object,
      default: null,
    },
    context2: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      // Fallback until the ResizeObserver reports the panel's actual width on mount.
      plotWidth: 440,
    };
  },
  mounted() {
    if (typeof ResizeObserver === 'undefined' || !this.$refs.rootEl) return;
    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) this.plotWidth = Math.floor(width);
    });
    this.resizeObserver.observe(this.$refs.rootEl);
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  computed: {
    sourceDescription() {
      return this.pointsById[this.edge?.source]?.description;
    },
    targetDescription() {
      return this.pointsById[this.edge?.target]?.description;
    },
    sourceLabel() {
      return this.pointsById[this.edge?.source]?.display_name || this.edge?.source;
    },
    targetLabel() {
      return this.pointsById[this.edge?.target]?.display_name || this.edge?.target;
    },
    sourceGroup() {
      return this.pointsById[this.edge?.source]?.group;
    },
    targetGroup() {
      return this.pointsById[this.edge?.target]?.group;
    },
    sourceType() {
      return this.pointsById[this.edge?.source]?.type;
    },
    targetType() {
      return this.pointsById[this.edge?.target]?.type;
    },
    // Picks the plot whose backend endpoint actually matches both endpoints' data types --
    // continuous x continuous only exists as an overlaid aggregated trend line (no raw
    // scatter, to avoid exposing per-participant values), categorical x categorical as a
    // proportion-difference heatmap, and continuous x categorical as a context-grouped box
    // plot (which requires the categorical var as x). All three are the same components used
    // elsewhere in the app (src/components/plots/), just with both context1 and context2 set,
    // which switches them into their two-context comparison mode.
    relationshipPlot() {
      if (!this.sourceType || !this.targetType) return null;
      const sourceContinuous = this.sourceType === 'continuous';
      const targetContinuous = this.targetType === 'continuous';
      if (sourceContinuous && targetContinuous) return 'OverviewLine';
      if (!sourceContinuous && !targetContinuous) return 'OverviewHeatmap';
      return 'OverviewBox';
    },
    // For the box plot, x must be the categorical variable and y the continuous one; for the
    // other two plots order doesn't matter, so source/target order is kept as-is.
    relationshipSwapped() {
      return this.relationshipPlot === 'OverviewBox' && this.sourceType === 'continuous';
    },
    relationshipXVar() {
      return this.relationshipSwapped ? this.edge?.target : this.edge?.source;
    },
    relationshipYVar() {
      return this.relationshipSwapped ? this.edge?.source : this.edge?.target;
    },
    // Same swap as relationshipXVar/relationshipYVar, but the display labels (falls back to
    // the raw id itself if a point has no display_name) instead of the raw id used for the
    // query -- OverviewBox/Heatmap/Line show these on the axis titles instead of the id.
    relationshipXLabel() {
      return this.relationshipSwapped ? this.targetLabel : this.sourceLabel;
    },
    relationshipYLabel() {
      return this.relationshipSwapped ? this.sourceLabel : this.targetLabel;
    },
    // OverviewHeatmap requires showValues; OverviewBox/OverviewLine don't declare it (so
    // passing it there would just fall through as a stray DOM attribute) -- keep it scoped
    // to the plot that actually uses it instead of passing every prop to every plot type.
    // palette matches data-overview.vue's own defaults (userSelectedPaletteCa/Co) for the
    // same plot types, so these read consistently with the rest of the app -- 'coolwarm' for
    // the heatmap is its own default fallback too, set explicitly here rather than relying on
    // that, since it's the diverging variant a plain 'Viridis' match would defeat the point
    // of (this data is a signed difference, not a count).
    relationshipPlotProps() {
      return this.relationshipPlot === 'OverviewHeatmap'
        ? { showValues: 'No', palette: 'coolwarm' }
        : { palette: 'muted' };
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
.relationship-plot {
  min-width: 0;
  overflow-x: auto;
}
</style>
