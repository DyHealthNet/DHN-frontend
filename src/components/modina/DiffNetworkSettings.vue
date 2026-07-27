<template>
  <v-card outlined>
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Differential Network Settings
        <v-tooltip bottom max-width="360">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props">mdi-information</v-icon>
          </template>
          <span>{{ infoTooltip }}</span>
        </v-tooltip>
      </v-toolbar-title>
    </v-toolbar>

    <v-card-text>
      <v-row dense align="center">
        <v-col cols="12" md="4">
          <v-select
            v-model="local.filterTarget"
            :items="[{ value: null, title: 'No filtering' }, { value: 'context-specific', title: 'Context-specific (before differential network)' }, { value: 'differential', title: 'Differential network (after construction)' }]"
            item-title="title"
            item-value="value"
            label="Edge filtering"
            density="compact"
            variant="outlined"
            hide-details="auto"
          ></v-select>
        </v-col>

        <template v-if="local.filterTarget">
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="local.filterParam"
              type="number"
              step="0.01"
              min="0"
              max="1"
              label="Density"
              density="compact"
              variant="outlined"
              hide-details="auto"
            ></v-text-field>
          </v-col>
          <v-col cols="6" md="3" v-if="local.filterTarget === 'context-specific'">
            <v-select
              v-model="local.filterMetric"
              :items="[{ value: 'raw-P', title: 'Adjusted p-value' }, { value: 'rescaled-E', title: 'rescaled-E' }]"
              item-title="title"
              item-value="value"
              label="Filter on"
              density="compact"
              variant="outlined"
              hide-details="auto"
            ></v-select>
          </v-col>
          <v-col cols="6" md="2" v-if="local.filterTarget === 'context-specific'">
            <v-select
              v-model="local.filterRule"
              :items="[{ value: 'union', title: 'Union' }, { value: 'zero', title: 'Zero-fill' }]"
              item-title="title"
              item-value="value"
              label="Integration rule"
              density="compact"
              variant="outlined"
              hide-details="auto"
            ></v-select>
          </v-col>
        </template>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import { NODE_METRIC_INFO, EDGE_METRIC_INFO, RANKING_ALGORITHM_INFO, metricLabel, metricDescription } from './metricInfo.js';

export default {
  name: 'DiffNetworkSettings',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    // Reported by the backend on the actual result -- null until a comparison has completed, in
    // which case the tooltip stays generic rather than naming a specific metric/algorithm.
    nodeMetric: {
      type: String,
      default: null,
    },
    edgeMetric: {
      type: String,
      default: null,
    },
    rankingAlgorithm: {
      type: String,
      default: null,
    },
  },
  emits: ['update:modelValue'],
  computed: {
    local: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    infoTooltip() {
      if (!this.nodeMetric || !this.edgeMetric) {
        return "moDiNA builds the differential network from each context's already-computed "
          + 'association scores (test type and correction method are fixed by the contexts '
          + 'themselves -- see the context picker above). The specific node metric, edge metric '
          + 'and ranking algorithm used will be shown here once a comparison has been run.';
      }
      const nodeLabel = metricLabel(NODE_METRIC_INFO, this.nodeMetric);
      const edgeLabel = metricLabel(EDGE_METRIC_INFO, this.edgeMetric);
      const algoLabel = this.rankingAlgorithm ? metricLabel(RANKING_ALGORITHM_INFO, this.rankingAlgorithm) : null;
      const algoDescription = this.rankingAlgorithm ? metricDescription(RANKING_ALGORITHM_INFO, this.rankingAlgorithm) : '';
      return `moDiNA built this differential network using ${nodeLabel} (${metricDescription(NODE_METRIC_INFO, this.nodeMetric)}) `
        + `for nodes and ${edgeLabel} (${metricDescription(EDGE_METRIC_INFO, this.edgeMetric)}) for edges`
        + (algoLabel ? `, ranked via ${algoLabel} -- ${algoDescription}` : '')
        + `, reusing each context's already-computed association scores (test type and correction `
        + 'method are fixed by the contexts themselves -- see the context picker above).';
    },
  },
  watch: {
    'local.filterTarget'(newVal) {
      if (!newVal) {
        this.local.filterMetric = null;
        this.local.filterRule = null;
      } else {
        this.local.filterParam = this.local.filterParam || 1;
        if (newVal === 'context-specific') {
          this.local.filterMetric = this.local.filterMetric || 'raw-P';
          this.local.filterRule = this.local.filterRule || 'union';
        }
      }
    },
  },
};
</script>
