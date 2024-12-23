<template>
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
    <v-col cols="4" v-if="showMultTest">
      <p>Multiple Testing Correction</p>
    </v-col>
  </v-row>
  <v-row>
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
        <v-col cols="4" class="my-0" v-if="showMultTest">
      <v-select
          v-model="multTest"
          :items="multTestItems"
          :readonly="disableSelections"
          variant="outlined"
          density="compact"
          @update:model-value="changeTest"
          item-title="label"
          return-object
      >
      </v-select>
    </v-col>
  </v-row>
  <v-row>
    <v-col>
      <p>Categorical-continuous</p>
    </v-col>
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
        {label: 'Bonferroni', value: 'bf'},
        {label: 'Benjamini Hochberg (FDR)', value: 'bh'},
        {label: 'Benjamini–Yekutieli', value: 'by'},
      ],

      contCatItemsB: [
        {label: 'T-test', value: 't-test'},
        {label: 'ANOVA', value: 'anova'},
        {label: 'Kruskal-Wallis', value: 'kruskal-wallis'},
        {label: 'Mann-Whitney U', value: 'mann-whitney u'},
      ],

      contCatItemsM: [
        {label: 'Kruskal-Wallis', value: 'kruskal-wallis'},
        {label: 'ANOVA', value: 'anova'},
      ],


      contCont: this.selectedTests?.contCont ?? {label: 'Pearson correlation', value: 'pearson'},
      catCat: this.selectedTests?.catCat ?? {label: 'Chi-squared test', value: 'chi2'},
      multTest: this.selectedTests?.multTest ?? {label: 'Benjamini Hochberg (FDR)', value: 'bh'},
      catContB: this.selectedTests?.catContB ?? {label: 'T-test', value: 't-test'},
      catContM: this.selectedTests?.catContM ?? {label: 'ANOVA', value: 'anova'},
    }
  },
  methods: {
    changeTest() {
      this.$emit('data-changed', {
        contCont: this.contCont,
        catCat: this.catCat,
        multTest: this.multTest,
        catContB: this.catContB,
        catContM: this.catContM,
      })
    }
  }
}
</script>

<style scoped>

</style>