<template>
  <v-sparkline
    :auto-line-width="autoLineWidth"
    :fill="fill"
    :line-width="width"
    :model-value="value"
    :padding="padding"
    color="primary-darken-1"
    :smooth="radius || false"
    :stroke-linecap="lineCap"
    :type="barType"
    auto-draw
    @click="dialogActive = true"
  >
  </v-sparkline>
<v-dialog max-width="1000" v-model="dialogActive">
    <v-card title="Data distribution for XY">
      <v-card-text>
          <v-sparkline
            :auto-line-width="autoLineWidth"
            :fill="fill"
            :line-width="width"
            :model-value="value"
            :padding="padding"
            color="primary-darken-1"
            :smooth="radius || false"
            :stroke-linecap="lineCap"
            :type="barType"
            auto-draw
            @click="dialogActive = true"
          >
            <template v-slot:label="{ index }">
            {{ valueLabels[index] }}
          </template>
          </v-sparkline>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          text="Close"
          @click="dialogActive = false"
        ></v-btn>
      </v-card-actions>
    </v-card>
</v-dialog>
</template>

<script>

  export default {
    props: {
      barType: {
        type: String,
        default: 'trend'
      },
    },
    data: () => ({
      width: 2,
      radius: 10,
      padding: 8,
      lineCap: 'round',
      value: [0, 1, 2, 4, 5, 14, 5, 6, 6, 4, 15, 18, 22, 15, 5],
      valueLabels: [0, 6.6, 13.3, 20, 26.6, 33.3, 40, 46.6, 53.3, 60, 66.6, 73.3, 80, 86.6, 100],
      fill: true,
      dialogActive: false,
      autoLineWidth: true,
    }),
  }
</script>


<style>
.min-number {
  position: absolute;
  left: 76%;
  top: 50%
}

.max-number {
  position: absolute;
  right: 9%;
  top: 50%
}
</style>