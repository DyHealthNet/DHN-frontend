<template>
<v-col cols="3" class="filter-padding">
  <v-autocomplete
    v-model="columnName"
    :items="columnItems"
    density="compact"
    variant="outlined"
    ></v-autocomplete>
</v-col>
  <v-col cols="3" class="filter-padding">
  <v-select
    v-model="selectedOperator"
    :items="operators"
    density="compact"
    variant="outlined"
    ></v-select>
</v-col>
  <v-col cols="3" class="filter-padding">
  <v-combobox
    v-model="selectedValue"
    :items="possibleValues"
    density="compact"
    variant="outlined"
    ></v-combobox>
</v-col>
  <v-col class="center-button">
    <v-btn
    :color="connectCol"
    @click="printValue"
    >
      <v-icon
          :color="iconCol"
          size="19"
          class="justify-center my-1 mr-2"
      >mdi-plus-circle-outline</v-icon>
      {{ connection }}
    </v-btn>
  </v-col>
  <v-col>
      <v-icon color="black" size="25" class="my-1 center-icon" @click="printValue">mdi-close-circle-outline</v-icon>
  </v-col>
</template>

<script>
export default {
  name: 'FilterLine',
  props: {
    connection: {
      type: String,
      default: 'AND'
    },
    first: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      columnName: "",
      columnItems: [
        'Sex (x0_sex)',
        'Food frequency: Meat (x0fd01)',
        'Type of diabetes (x0dm02)',
        'NEIL2 / Protein (x0so3291)',
        'Diabetes treatment (x0dm03)',
      ],
      selectedOperator: "",
      operators: [
          'is (=)',
          'less than (<)',
          'greater than (>)',
          'in'
      ],
      selectedValue: "",
      possibleValues: [
          'Male',
          'Female'
      ]
    };
  },
  methods: {
    printValue() {
      console.log(this.columnName, this.selectedOperator, this.selectedValue);
    }
  },
  computed:{
    connectCol() {
      return this.connection === 'AND' ? '#adbfd3' : '#23425b';
    },
    iconCol() {
      return this.connection === 'AND' ? 'black' : 'white';
    }
  }
};
</script>

<style scoped>

.center-button {
  padding-top: 21px;
}
.center-icon {
  padding-top: 28px;
}

.filter-padding {
  padding-top: 24px;
  padding-bottom: 1px;
}

</style>