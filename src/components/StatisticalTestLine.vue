<template>
  <v-row v-if="showHeader">
    <v-col cols="12">
      <p><b>{{ headerText }}</b></p>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="4">
      <p>Test type</p>
    </v-col>
    <v-col cols="4">
      <p>Multiple testing correction</p>
    </v-col>
    <v-col cols="3" v-if="showMultTest">
      <p>Significance Threshold</p>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="testType"
          :items="testTypeItems"
          :readonly="disableSelections"
          variant="outlined"
          density="compact"
          item-title="label"
          item-value="value"
          @update:model-value="changeTest"
      ></v-select>
    </v-col>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="correction"
          :items="correctionItems"
          :readonly="disableSelections"
          variant="outlined"
          density="compact"
          item-title="label"
          item-value="value"
          @update:model-value="changeTest"
      ></v-select>
    </v-col>
    <v-col cols="3" class="my-0" v-if="showMultTest">
      <v-text-field
        v-model="internalSignThresh"
        type="number"
        step="0.01"
        :rules="[value => (value >= 0 && value <= 1) || 'Must be between 0 and 1']"
        density="compact"
        variant="outlined"
        @update:model-value="updateSignThresh"
        @blur="validateThresholdInput"
      />
    </v-col>
  </v-row>
</template>

<script>
export default {
  emits: ["dataChanged"],
  name: "StatisticalTestLine",
  props: {
    selectedTests: {
      type: Object,
      required: false,
    },
    signThresh: {
      type: Number,
      required: false,
      default: 0.05,
    },
    disableSelections: {
      type: Boolean,
      default: false,
    },
    showHeader: {
      type: Boolean,
      default: false,
    },
    headerText: {
      type: String,
      default: "Network Statistics Configuration",
    },
    showMultTest: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      testTypeItems: [
        { label: 'Parametric', value: 'parametric' },
        { label: 'Nonparametric', value: 'nonparametric' },
      ],
      correctionItems: [
        { label: 'Benjamini-Hochberg (BH)', value: 'bh' },
        { label: 'Benjamini-Yekutieli (BY)', value: 'by' },
      ],
      testType: this.selectedTests?.testType ?? 'parametric',
      correction: this.selectedTests?.correction ?? 'bh',
      internalSignThresh: this.signThresh,
    };
  },
  methods: {
    validateThresholdInput() {
      const parsedValue = parseFloat(this.internalSignThresh);
      if (isNaN(parsedValue) || parsedValue < 0) {
        this.internalSignThresh = 0.05;
        this.$emit("dataChanged", { signThresh: this.internalSignThresh });
      } else if (parsedValue > 1) {
        this.internalSignThresh = 1.0;
        this.$emit("dataChanged", { signThresh: this.internalSignThresh });
      }
    },
    changeTest() {
      this.$emit('dataChanged', {
        selectedTests: {
          testType: this.testType,
          correction: this.correction,
        },
      });
    },
    updateSignThresh(newValue) {
      this.internalSignThresh = parseFloat(newValue);
      this.$emit("dataChanged", { signThresh: this.internalSignThresh });
    },
  },
  watch: {
    signThresh(newValue) {
      this.internalSignThresh = parseFloat(newValue);
    },
    selectedTests: {
      handler(newValue) {
        if (newValue?.testType !== undefined) this.testType = newValue.testType;
        if (newValue?.correction !== undefined) this.correction = newValue.correction;
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
</style>
