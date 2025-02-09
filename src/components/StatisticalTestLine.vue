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
          :readonly="disableSelections"
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
          :readonly="disableSelections"
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
          :readonly="disableSelections"
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
          :readonly="disableSelections"
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
          type="number"
          step="0.01"
          :rules="[value => (value >= 0 && value <= 1) || 'Must be between 0 and 1']"
          density="compact"
          variant="outlined"
          @update:model-value="updateSignThresh"
          @blur="validateThresholdInput"
        />
      </v-col>
    <v-spacer></v-spacer>
  </v-row>
</template>

<script>
export default {
emits: ["dataChanged"],
name: "StatisticalTestLine",
  props: {
    selectedTests: {
      type: Object,
      required: false
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
      const parsedValue = parseFloat(this.internalSignThresh);
      if (isNaN(parsedValue) || parsedValue < 0) {
        this.internalSignThresh = 0.05;
        this.$emit("dataChanged", { signThresh: this.internalSignThresh });
      } else if (isNaN(parsedValue) || parsedValue > 1){
        this.internalSignThresh = 1.0;
        this.$emit("dataChanged", { signThresh: this.internalSignThresh });
      }
    },
    changeTest() {
      console.log("changeTest")
      this.$emit('dataChanged', {
        selectedTests: {
          contCont: this.contCont,
            catCat: this.catCat,
          multTest: this.multTest,
          catContB: this.catContB,
          catContM: this.catContM,
      }});
    },
    updateSignThresh(newValue) {
      this.internalSignThresh = parseFloat(newValue);
      this.$emit("dataChanged", { signThresh: this.internalSignThresh });
    },
  },
  // So that changes in the parent are shown in the child component (e.g. if context changes correct
  // values are immediately re-rendered)
  watch: {
    signThresh(newValue) {
      this.internalSignThresh = parseFloat(newValue);
      this.$emit("dataChanged", { signThresh: this.internalSignThresh });
    },

    selectedTests: {
      handler(newValue) {
        // Only emit the change if necessary (if newValue is different from current state)
        if (
          newValue["contCont"] !== this.contCont ||
          newValue["catCat"] !== this.catCat ||
          newValue["multTest"] !== this.multTest ||
          newValue["catContB"] !== this.catContB ||
          newValue["catContM"] !== this.catContM
        ) {
          this.contCont = newValue["contCont"];
          this.catCat = newValue["catCat"];
          this.multTest = newValue["multTest"];
          this.catContB = newValue["catContB"];
          this.catContM = newValue["catContM"];

          this.$emit("dataChanged", {
            selectedTests: {
              contCont: this.contCont,
              catCat: this.catCat,
              multTest: this.multTest,
              catContB: this.catContB,
              catContM: this.catContM,
            },
          });
        }
      },
      deep: true, // Only apply deep to the nested object
    },
  },
}
</script>

<style scoped>

</style>