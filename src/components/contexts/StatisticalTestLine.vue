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
          v-model="catContB"
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
          v-model="catContM"
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
  props: {
    selectedTests: {
      type: Object,
      required: false
    }
  },
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

      contCont: this.selectedTests?.contCont ?? 'Pearson',
      catCat: this.selectedTests?.catCat ?? 'Chi-square',
      catContB: this.selectedTests?.catContB ?? 'T-test',
      catContM: this.selectedTests?.catContM ??'ANOVA',
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