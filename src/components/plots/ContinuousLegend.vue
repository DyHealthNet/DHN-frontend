<template>
  <div class="color-legend-container" :style="{ height: `${height}px`, top: `10px` }">
    <div class="legend-wrapper">
      <div class="color-bar" :style="colorBarStyle"></div>
      <div class="ticks">
        <div v-for="tick in ticks" :key="tick.value" class="tick" :style="{ top: tick.position + '%' }">
          <div class="tick-mark"></div>
          <div class="tick-label">{{ tick.value.toFixed(1) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { scaleLinear } from "d3-scale";
import { interpolateViridis, interpolateMagma } from "d3-scale-chromatic";

export default {
  name: "ContinuousLegend",
  props: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    tickCount: {
      type: Number,
      default: 5 // Number of ticks to show
    },
    palette: {
      type: String,
      default: "viridis"
    },
    height: {
      type: Number,
      default: 400
    }
  },
  computed: {
    colorBarStyle() {
      const gradientSteps = 100; // More steps for smoother gradient
      const colors = Array.from({ length: gradientSteps }, (_, i) => {
        const t = i / (gradientSteps - 1);
        return `${this.colorScale(t)} ${t * 100}%`;
      }).join(", ");
      return {
        background: `linear-gradient(to bottom, ${colors})`,
        width: "35px",
        height: "100%",
        borderRadius: "4px"
      };
    },
    colorScale() {
      if (this.palette === "rocket") return interpolateMagma;
      return interpolateViridis;
    },
    ticks() {
      const scale = scaleLinear().domain([this.min, this.max]).range([0, 100]);
      return Array.from({ length: this.tickCount }, (_, i) => {
        const value = scale.invert((i / (this.tickCount - 1)) * 100);
        return { value, position: ((i / (this.tickCount - 1)) * 100) - 1.5 };
      });
    }
  }
};
</script>

<style scoped>
.color-legend-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.legend-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  height: 100%;
  width: 50px;
}

.color-bar {
  flex-shrink: 0;
  border: 1px solid rgb(var(--v-theme-chart));;
  position: relative;
}

.ticks {
  position: absolute;
  left: 40px;
  height: 100%;
  width: 30px;
}

.tick {
  position: absolute;
  display: flex;
  align-items: center;
  left: 0;
}

.tick-mark {
  width: 6px;
  height: 1px;
  background: rgb(var(--v-theme-chart));
  margin-right: 4px;
}

.tick-label {
  font-size: 0.8em;
  color: rgb(var(--v-theme-chart));
}

.label {
  font-size: 0.9em;
  color: #666;
}
</style>
