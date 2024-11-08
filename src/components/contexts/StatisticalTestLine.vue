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
          @change="changeTest"
      >
      </v-select>
    </v-col>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="catCat"
          :items="catCatItems"
          variant="outlined"
          density="compact"
          @change="changeTest"
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
          v-model="contCatB"
          :items="contCatItemsB"
          label="Binary categories"
          variant="outlined"
          density="compact"
          @change="changeTest"
      >
      </v-select>
    </v-col>
    <v-col cols="4" class="my-0">
      <v-select
          v-model="contCatM"
          :items="contCatItemsM"
          label="Multiple categories"
          variant="outlined"
          density="compact"
          @change="changeTest"
      >
      </v-select>
    </v-col>
  </v-row>
</template>

<script>

export default {
  name: 'StatisticalTestLine',
  emits: ['data-changed'],
  data() {
    return {
      contContItems: [
        'Pearson',
        'Spearman',
      ],

      catCatItems: [
        'Chi-square',
      ],

      contCatItemsB: [
        'ANOVA',
        'T-test',
        'Kruskal-Wallis',
        'Mann-Whitney U',
      ],

      contCatItemsM: [
        'Kruskal-Wallis',
        'ANOVA'
      ],

      contCont: 'Pearson Correlation',
      catCat: 'Chi-square',
      contCatB: 'T-test',
      contCatM: 'ANOVA',
    }
  },
  methods: {
    changeTest() {
      this.$emit('data-changed', {
        contCont: this.contCont,
        catCat: this.catCat,
        contCatB: this.contCatB,
        contCatM: this.contCatM,
      })
    }
  }
}
</script>

<style scoped>

</style>