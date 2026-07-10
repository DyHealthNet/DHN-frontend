<template>
  <v-card outlined>
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Differential Network Settings
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props">mdi-information</v-icon>
          </template>
          <span>Configure the moDiNA edge metric, node metric and ranking algorithm used to build and rank the differential network.</span>
        </v-tooltip>
      </v-toolbar-title>
    </v-toolbar>

    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="4">
          <v-select
            v-model="local.edgeMetric"
            :items="edgeMetricItems"
            item-title="title"
            item-value="value"
            label="Edge metric"
            clearable
            density="compact"
            variant="outlined"
            hide-details="auto"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props" :subtitle="item.raw.subtitle"></v-list-item>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="local.nodeMetric"
            :items="nodeMetricItems"
            item-title="title"
            item-value="value"
            label="Node metric"
            clearable
            density="compact"
            variant="outlined"
            hide-details="auto"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props" :subtitle="item.raw.subtitle"></v-list-item>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="local.rankingAlg"
            :items="rankingAlgItems"
            item-title="title"
            item-value="value"
            :item-props="rankingItemProps"
            label="Ranking algorithm"
            density="compact"
            variant="outlined"
            hide-details="auto"
          ></v-select>
        </v-col>
      </v-row>

      <p v-if="!local.edgeMetric && !local.nodeMetric" class="text-error mt-2 mb-0 text-body-2">
        Select at least one of edge metric or node metric.
      </p>

      <v-expansion-panels class="mt-6" variant="popout">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon color="primary-darken-1" size="30" class="mr-3 my-0">mdi-cog-outline</v-icon>
            <span>Advanced Settings</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-row dense v-if="local.edgeMetric === 'int-IS-E'">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="local.maxPathLength"
                  type="number"
                  min="1"
                  max="4"
                  label="Max path length (int-IS-E)"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row dense v-if="local.nodeMetric === 'STC'" :class="{ 'mt-2': local.edgeMetric === 'int-IS-E' }">
              <v-col cols="12" md="4">
                <v-select
                  v-model="local.testType"
                  :items="[{ value: 'nonparametric', title: 'Non-parametric (Mann-Whitney U / Chi²)' }, { value: 'parametric', title: 'Parametric (t-test / Chi²)' }]"
                  item-title="title"
                  item-value="value"
                  label="STC test type"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="local.correction"
                  :items="[{ value: 'bh', title: 'Benjamini-Hochberg' }, { value: 'by', title: 'Benjamini-Yekutieli' }]"
                  item-title="title"
                  item-value="value"
                  label="Multiple testing correction"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                ></v-select>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

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
                <v-col cols="6" md="2">
                  <v-select
                    v-model="local.filterMethod"
                    :items="[{ value: 'degree', title: 'Degree' }, { value: 'density', title: 'Density' }]"
                    item-title="title"
                    item-value="value"
                    label="Method"
                    density="compact"
                    variant="outlined"
                    hide-details="auto"
                  ></v-select>
                </v-col>
                <v-col cols="6" md="2">
                  <v-text-field
                    v-model.number="local.filterParam"
                    type="number"
                    step="0.01"
                    min="0"
                    label="Parameter"
                    density="compact"
                    variant="outlined"
                    hide-details="auto"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="2" v-if="local.filterTarget === 'context-specific'">
                  <v-select
                    v-model="local.filterMetric"
                    :items="[{ value: 'raw-P', title: 'raw-P' }, { value: 'rescaled-E', title: 'rescaled-E' }]"
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
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script>
const EDGE_METRICS = [
  { value: 'diff-P', title: 'diff-P — |Δ p-value|', subtitle: 'Absolute difference of adjusted p-values between contexts' },
  { value: 'diff-E', title: 'diff-E — |Δ effect size|', subtitle: 'Absolute difference of rescaled effect sizes' },
  { value: 'diff-L-P', title: 'diff-L-P — |Δ -log10(p)|', subtitle: 'Absolute difference of -log10 p-values' },
  { value: 'diff-L-PE', title: 'diff-L-PE — |Δ (-log10(p) × effect)|', subtitle: 'Absolute difference of a combined significance × effect-size score' },
  { value: 'int-IS-E', title: 'int-IS-E — integrated interaction score', subtitle: 'Path-integrated effect-size score; uses max path length below' },
  { value: 'sum-diff-PE', title: 'sum-diff-PE — diff-P + diff-E', subtitle: 'Raw-scale sum of p-value and effect-size differences' },
  { value: 'sum-diff-L-PE', title: 'sum-diff-L-PE — diff-L-P + diff-E', subtitle: 'Direction-coherent sum of log-p and effect-size differences' },
];

const NODE_METRICS = [
  { value: 'DC-P', title: 'DC-P — degree centrality (p-value)', subtitle: 'Δ share of significant incident edges (by p-value)' },
  { value: 'DC-E', title: 'DC-E — degree centrality (effect size)', subtitle: 'Δ share of non-zero-effect incident edges' },
  { value: 'WDC-P', title: 'WDC-P — weighted degree centrality (1−p)', subtitle: 'Δ summed (1−p) over incident edges' },
  { value: 'WDC-L-P', title: 'WDC-L-P — weighted degree centrality (−log10 p)', subtitle: 'Δ summed −log10(p) over incident edges' },
  { value: 'WDC-E', title: 'WDC-E — weighted degree centrality (effect size)', subtitle: 'Δ summed |effect size| over incident edges' },
  { value: 'PRC-P', title: 'PRC-P — PageRank centrality (1−p)', subtitle: 'Δ PageRank using (1−p)-weighted edges' },
  { value: 'PRC-L-P', title: 'PRC-L-P — PageRank centrality (−log10 p)', subtitle: 'Δ PageRank using −log10(p)-weighted edges' },
  { value: 'PRC-E', title: 'PRC-E — PageRank centrality (effect size)', subtitle: 'Δ PageRank using |effect size|-weighted edges' },
  { value: 'STC', title: 'STC — statistical test centrality', subtitle: 'Direct test of whether the variable itself differs between contexts' },
];

const RANKING_ALGS = [
  { value: 'PageRank+', title: 'PageRank+ (personalized)', requires: ['edge', 'node'] },
  { value: 'PageRank', title: 'PageRank', requires: ['edge'] },
  { value: 'DimontRank', title: 'DimontRank (signed)', requires: ['edge'] },
  { value: 'absDimontRank', title: 'DimontRank (absolute)', requires: ['edge'] },
  { value: 'nodeRank', title: 'Node metric ranking', requires: ['node'] },
  { value: 'edgeRank', title: 'Edge metric ranking', requires: ['edge'] },
];

export default {
  name: 'DiffNetworkSettings',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      edgeMetricItems: EDGE_METRICS,
      nodeMetricItems: NODE_METRICS,
      rankingAlgItems: RANKING_ALGS,
    };
  },
  computed: {
    local: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },
  watch: {
    'local.edgeMetric'() {
      this.ensureValidRanking();
    },
    'local.nodeMetric'() {
      this.ensureValidRanking();
    },
    'local.filterTarget'(newVal) {
      if (!newVal) {
        this.local.filterMethod = null;
        this.local.filterMetric = null;
        this.local.filterRule = null;
      } else if (!this.local.filterMethod) {
        this.local.filterMethod = 'degree';
        this.local.filterParam = this.local.filterParam || 1;
        if (newVal === 'context-specific') {
          this.local.filterMetric = this.local.filterMetric || 'raw-P';
          this.local.filterRule = this.local.filterRule || 'union';
        }
      }
    },
  },
  methods: {
    isRankingValid(alg) {
      const requires = RANKING_ALGS.find((r) => r.value === alg)?.requires || [];
      if (requires.includes('edge') && !this.local.edgeMetric) return false;
      if (requires.includes('node') && !this.local.nodeMetric) return false;
      return true;
    },
    rankingItemProps(item) {
      const valid = this.isRankingValid(item.value);
      return {
        disabled: !valid,
        subtitle: valid ? undefined : 'Requires ' + item.requires.join(' + ') + ' metric to be selected',
      };
    },
    ensureValidRanking() {
      if (!this.isRankingValid(this.local.rankingAlg)) {
        const firstValid = RANKING_ALGS.find((r) => this.isRankingValid(r.value));
        this.local.rankingAlg = firstValid ? firstValid.value : null;
      }
    },
  },
};
</script>
