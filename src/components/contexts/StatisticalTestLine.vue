<template>
  <v-row>
    <v-col cols="4">
      <p><b>Continuous-continuous</b></p>
    </v-col>
    <v-col cols="4">
      <p><b>Categorical-categorical</b></p>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="contCont"
          :items="contContItems"
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
      <p><b>Categorical-continuous</b></p>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="catContB"
          :items="contCatItemsB"
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
          label="Multiple categories"
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
  name: 'StatisticalTestLine',
  emits: ['data-changed'],
  props: {
    selectedTests: {
      type: Object,
      required: false
    }
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
      catContB: this.selectedTests?.catContB ?? {label: 'T-test', value: 'ttest'},
      catContM: this.selectedTests?.catContM ?? {label: 'ANOVA', value: 'anova'},
    }
  },
  methods: {
    changeTest() {
      this.$emit('data-changed', {
        contCont: this.contCont,
        catCat: this.catCat,
        catContB: this.catContB,
        catContM: this.catContM,
      })
    }
  }
}
</script>

<style scoped>

</style>