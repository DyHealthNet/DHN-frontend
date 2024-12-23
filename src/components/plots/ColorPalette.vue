<template>
  <!-- A rectangle with vertical colors -->
  <v-sheet elevation="2" max-width="130px" min-width="130px" max-height="80px" rounded="lg" class="palette-container">
    <v-row justify="center" class="palette-row">
      <div class="d-flex palette">
        <div
          v-for="color in colors"
          :key="color"
          :style="{ backgroundColor: color }"
          class="palette-color"
        ></div>
      </div>
    </v-row>
    <v-row align="center" class="radio-row">
      <v-radio
        v-model="selectedPalette"
        class="palette-radio"
        @click="() => $emit('palette-selected', paletteId)"
      ></v-radio>
    </v-row>
  </v-sheet>
</template>

<script>
export default {
  name: 'ColorPalette',
  emits: ['palette-selected'],
  props: {
    colors: {
      type: Array,
      required: true,
    },
    paletteId: {
      type: String,
      required: true,
    },
    currentPalette: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      paletteName: this.paletteId,
    }
  },
  computed: {
    selectedPalette: {
      get() {
        return this.currentPalette === this.paletteName
      },
      set(value) {
        this.paletteName = value
      },
    },
  }
}
</script>

<style scoped>
.palette-container {
  padding: 8px 4px;
  overflow: hidden;
}

.palette-row {
  width: 100%;
  justify-content: center;
  margin-left: 0;
  margin-right: 0;
}

.palette {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 125px;
}

.palette-color {
  height: 40px;
  flex-grow: 1;
  margin: 0 1px;
  border-radius: 4px;
  overflow: hidden;
}

.radio-row {
  margin-top: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/*  override the default radio alignment through vues internal structure */
.v-selection-control {
  justify-content: center;
}

.palette-radio {
  --v-theme-radio-size: 24px;
}
</style>