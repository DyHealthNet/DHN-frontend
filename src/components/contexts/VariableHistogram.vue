<template>
  <v-sparkline
    :auto-line-width="autoLineWidth"
    :fill="fill"
    :line-width="width"
    :model-value="value"
    :padding="padding"
    color="primary-darken-1"
    :smooth="barType === 'trend' ? radius : false"
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
            v-if="barType === 'trend'"
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
        <v-sparkline
            v-if="barType === 'bar'"
            :model-value="value"
            color="primary-darken-1"
            :type="barType"
            :auto-line-width="autoLineWidth"
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
      barData: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        radius: true,
        padding: 8,
        lineCap: 'round',
        value: [],
        valueLabels: [],
        barType: 'bar',
        fill: true,
        dialogActive: false,
        autoLineWidth: true,
      };
    },
    watch: {
      barData: {
        handler() {
          this.value = this.barData?.values || []
          this.valueLabels = this.barData?.labels || []
          this.barType = this.barData?.type || 'bar'
        },
        immediate: true
      }
    },
    computed: {
      width() {
        return 200 / this.barData?.values?.length || 100
      }
    }
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