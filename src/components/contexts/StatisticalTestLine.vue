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
    :items="contContItems"
    variant="outlined"
    density="compact"
    >
    </v-select>
  </v-col>
  <v-col cols="4" class="my-0">
    <v-select
    :items="catCatItems"
    variant="outlined"
    density="compact"
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
      :items="contCatItemsB"
      label="Binary categories"
      variant="outlined"
      density="compact"
      >
      </v-select>
    </v-col>
    <v-col cols="4" class="my-0">
      <v-select
      :items="contCatItemsM"
      label="Multiple categories"
      variant="outlined"
      density="compact"
      >
      </v-select>
    </v-col>
  </v-row>
</template>

<script>

export default {
  name: 'StatisticalTestLine',
  computed: {
  },
  data() {
    return {
      contContItems: [
        'Pearson Correlation',
        'Spearman Correlation',
      ],

      catCatItems: [
        'Chi-square',
      ],

      contCatItemsB: [
        'ANOVA',
        'Ttest',
        'Kruskal-Wallis',
        'Mann-Whitney U',
      ],

      contCatItemsM: [
        'Kruskal-Wallis',
        'ANOVA'
      ]
    }
  }
}
</script>

<style scoped>

</style>