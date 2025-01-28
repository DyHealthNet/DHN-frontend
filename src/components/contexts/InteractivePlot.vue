<template>
  <v-sheet>
    <v-card-text class="sparkline-container">
      <!-- Sparkline -->
      <v-sparkline
        :model-value="dataDistribution"
        :fill="true"
        color="primary-darken-1"
        :smooth="true"
        auto-draw>
        <template v-slot:label="{ index }">
            {{ valueLabels[index] }}
          </template>
      ></v-sparkline>

      <!-- Left Overlay -->
      <div
        class="overlay"
        :style="{ left: `${minBarPosition - 10}`, width: `${minBarPosition}%` }"
      ></div>

      <!-- Right Overlay -->
      <div
        class="overlay"
        :style="{ left: `${maxBarPosition}%`, width: `${100 - maxBarPosition - 4.2}%` }"
      ></div>

      <!-- Draggable Vertical Bars -->
      <div
        class="bar"
        :style="{ left: `${minBarPosition}%` }"
        @mousedown="startDrag('min')"
      >
        <div class="drag-handle"></div>
      </div>
      <div
        class="bar"
        :style="{ left: `${maxBarPosition}%` }"
        @mousedown="startDrag('max')"
      >
        <div class="drag-handle"></div>
      </div>
    </v-card-text>
    Selected Range: {{ range[0] }} - {{ range[1] }}
  </v-sheet>
</template>

<script>
export default {
  data() {
    return {
      dataDistribution: [3, 5, 8, 10, 15, 18, 20, 22, 18, 15, 10, 8, 5, 3],
      valueLabels: ["10", "", "", "", "", "", "", "", "", "", "", "", "", "70"],
      range: [10, 70],
      dragging: null,
    };
  },
  computed: {
    minBarPosition() {
      return this.range[0];
    },
    maxBarPosition() {
      return this.range[1];
    },
  },
  methods: {
    startDrag(bar) {
      this.dragging = bar;
      document.addEventListener("mousemove", this.onDrag);
      document.addEventListener("mouseup", this.stopDrag);
    },
    onDrag(event) {
      if (!this.dragging) return;

      const rect = document.querySelector(".sparkline-container").getBoundingClientRect();
      const position = ((event.clientX - rect.left) / rect.width) * 100;
      const clampedPosition = Math.min(Math.max(position, 0), 100);

      if (this.dragging === "min" && clampedPosition < this.range[1]) {
        this.range[0] = clampedPosition;
      } else if (this.dragging === "max" && clampedPosition > this.range[0]) {
        this.range[1] = clampedPosition;
      }
    },
    stopDrag() {
      this.dragging = null;
      document.removeEventListener("mousemove", this.onDrag);
      document.removeEventListener("mouseup", this.stopDrag);
    },
  },
};
</script>

<style scoped>
.sparkline-container {
  position: relative;
}

/* Bars */
.bar {
  position: absolute;
  top: 0;
  bottom: 22%;
  width: 2px;
  background-color: rgb(var(--v-theme-darken-1));
  cursor: ew-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Drag Handle */
.drag-handle {
  position: absolute;
  width: 15px;
  height: 25px;
  background-color: rgb(var(--v-theme-secondary));
  border-radius: 20%;
  cursor: grab;
  pointer-events: auto;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

/* Overlays */
.overlay {
  position: absolute;
  top: 0;
  bottom: 22%;
  background-color: rgba(0, 0, 0, 0.2); /* Semi-transparent dark overlay */
  pointer-events: none; /* Makes it unclickable */
}
</style>


