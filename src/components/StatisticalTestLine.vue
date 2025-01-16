<template >
  <!-- Render only the fields specified in visibleFieldNames -->
    <v-row v-if="showHeader">
      <v-col cols="12">
        <p><b>{{ headerText }}</b></p>
      </v-col>
    </v-row>
      <v-row>
    <v-col cols="4">
      <p>Continuous-Continuous</p>
    </v-col>
    <v-col cols="4">
      <p>Categorical-Categorical</p>
    </v-col>
        <v-spacer></v-spacer>
    <v-col cols="3" v-if="showMultTest">
      <p>Multiple Testing Correction</p>
    </v-col>
        <v-spacer></v-spacer>
  </v-row>
  <v-row >
    <v-col cols="4" class="my-0">
      <v-select
          v-model="contCont"
          :items="contContItems"
          :readonly="disableSelections.contCont"
          variant="outlined"
          density="compact"
          @update:model-value="changeTest"
          item-title="label"
          return-object
      >
      </v-select>
    </v-col>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="catCat"
          :items="catCatItems"
          :readonly="disableSelections.catCat"
          variant="outlined"
          density="compact"
          @update:model-value="changeTest"
          item-title="label"
          return-object
      >
      </v-select>
    </v-col>
    <v-spacer></v-spacer>
    <v-col cols="3" class="my-0" v-if="showMultTest">
      <v-select
          v-model="multTest"
          :items="multTestItems"
          :readonly="disableSelections.multTest"
          variant="outlined"
          density="compact"
          @update:model-value="changeTest"
          item-title="label"
          return-object
      >
      </v-select>
    </v-col>
    <v-spacer></v-spacer>
  </v-row>
  <v-row>
    <v-col cols="8">
      <p>Categorical-continuous</p>
    </v-col>
    <v-spacer></v-spacer>
    <v-col cols="3" v-if="showMultTest">
      <p>Significance Threshold</p>
    </v-col>
    <v-spacer></v-spacer>
  </v-row>
  <v-row>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="catContB"
          :items="contCatItemsB"
          :readonly="disableSelections.catContB"
          label="Binary categories"
          variant="outlined"
          density="compact"
          @update:model-value="changeTest"
          item-title="label"
          return-object
      >
      </v-select>
    </v-col>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="catContM"
          :items="contCatItemsM"
          :readonly="disableSelections.catContM"
          label="Multicategorical"
          variant="outlined"
          density="compact"
          @update:model-value="changeTest"
          item-title="label"
          return-object
      >
      </v-select>
    </v-col>
    <v-spacer></v-spacer>
    <v-col cols="3" v-if="showMultTest">
        <v-text-field
          v-model="internalSignThresh"
          :readonly="disableSelections.signThresh"
          type="number"
          step="0.01"
          :rules="[value => (value >= 0 && value <= 1) || 'Must be between 0 and 1']"
          density="compact"
          variant="outlined"
          @blur="validateThresholdInput"
        />
      </v-col>
    <v-spacer></v-spacer>
  </v-row>
</template>

<script>
export default {
name: "StatisticalTestLine",
  props: {
    selectedTests: {
      type: Object,
      required: false
    },
    signThresh: {
      type: Number,
      required: false
    },
    disableSelections: {
    type: Object,
    default: () => ({
        contCont: false,
        catCat: false,
        multTest: false,
        catContB: false,
        catContM: false,
        signThresh: false,
      })
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
      contContItems: [
        {label: 'Pearson correlation', value: 'pearson'},
        {label: 'Spearmans rank correlation', value: 'spearman'},
      ],

      catCatItems: [
        {label: 'Chi-squared test', value: 'chi2'}
      ],

      multTestItems: [
        {label: 'Bonferroni', value: 'bonferroni'},
        {label: 'Benjamini Hochberg (FDR)', value: 'benjamini_hb'},
        {label: 'Benjamini–Yekutieli', value: 'benjamini_yek'},
      ],

      contCatItemsB: [
        {label: 'T-test', value: 'ttest'},
        {label: 'ANOVA', value: 'anova'},
        {label: 'Kruskal-Wallis', value: 'kruskal'},
        {label: 'Mann-Whitney U', value: 'mwu'},
      ],

      contCatItemsM: [
        {label: 'Kruskal-Wallis', value: 'kruskal'},
        {label: 'ANOVA', value: 'anova'},
      ],

      contCont: this.selectedTests?.contCont ?? {label: 'Pearson correlation', value: 'pearson'},
      catCat: this.selectedTests?.catCat ?? {label: 'Chi-squared test', value: 'chi2'},
      multTest: this.selectedTests?.multTest ?? {label: 'Benjamini Hochberg (FDR)', value: 'bh'},
      catContB: this.selectedTests?.catContB ?? {label: 'T-test', value: 'ttest'},
      catContM: this.selectedTests?.catContM ?? {label: 'ANOVA', value: 'anova'},
      internalSignThresh: this.signThresh,
    }
  },
  methods: {
    validateThresholdInput() {
      const parsedValue = parseFloat(this.internalsignThresh);
      if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 1) {
        // Reset to default if the input is invalid
        this.internalsignThresh = 0.05;
      } else {
        // Optionally: Clamp the value to the allowed range
        this.internalsignThresh = Math.min(Math.max(parsedValue, 0), 1);
      }
    },
    changeTest() {
      this.$emit('data-changed', {
        contCont: this.contCont,
        catCat: this.catCat,
        multTest: this.multTest,
        catContB: this.catContB,
        catContM: this.catContM,
      })
    },
  },
  watch: {
    internalSignThresh(newValue) {
      const numericValue = parseFloat(newValue);
      console.log("internalsignThresh: newValue", numericValue)
      console.log("{signThresh: newValue}", {signThresh: numericValue})
      this.$emit("data-changed", {signThresh: numericValue});
    },
  }
}
</script>

<style scoped>

</style>