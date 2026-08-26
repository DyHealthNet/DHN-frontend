<template>
  <div class="status-box">
        <v-tooltip :text="tooltipText">
      <template v-slot:activator="{ props }">
          <v-icon
              v-bind="props"
            :icon="icon"
            size=50
            color="darken-1"
            :class="iconClasses"
          >
          </v-icon>
       </template>
      </v-tooltip>
    <div class="text">
      <p class="title"
      >{{ title }}</p>
      <p v-if="remove"
         :key="remove"
         :class="['remove-text', removeSignClass]"

      >{{ remove }}</p>
      <p class="subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script>

export default {
  props: {
    title: {
      type: String,
      default: 'Completed',
    },
    subtitle: {
      type: String,
      default: 'Progress',
    },
    icon: {
      type: String,
      default: 'mdi-check-circle-outline',
    },
    remove: {
      type: String,
      required: false,
    },
    rounded: {
      type: Boolean,
      default: false,
    }
  },
  name: 'StatusBox',
  computed: {
    tooltipText() {
      if (this.subtitle !== 'Participants') {
        return 'Status of the context calculation';
      }
      return this.rounded
          ? 'Rounded number of participants in your context, to protect privacy'
          : 'Number of participants in your context';
    },
    iconClasses() {
      return {
        'justify-center': true,
        'my-1': true,
        'mx-1': true,
        'spin-animation': this.icon === 'mdi-autorenew',
      };
    },
    removeSignClass() {
      return this.remove.startsWith('+') ? 'positive' : 'negative';
    },
  },
};
</script>

<style scoped>
.status-box {
  width: 150px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  font-family: Arial, sans-serif;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: rgb(var(--v-theme-darken-1));
  margin: 0;
}

.subtitle {
  font-size: 12px;
  color: #888;
  margin: 0;
}

.spin-animation {
    animation: spin 1.8s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.remove-text {
  font-size: 1em;
  color: red;
  position: absolute;
  left: 91.5%;
  opacity: 1;
  animation: slideDownFadeOut 1.5s forwards;
}

.remove-text.positive {
  color: green; /* Green color for positive numbers */
}

.remove-text.negative {
  color: red; /* Red color for negative numbers */
}

@keyframes slideDownFadeOut {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(10px);
  }
  100% {
    transform: translateY(20px);
    opacity: 0;
  }
}

.remove-text.positive {
  animation: slideUpFadeIn 1.5s forwards;
}

@keyframes slideUpFadeIn {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-10px); /* Moves up for positive */
  }
  100% {
    transform: translateY(-20px);
    opacity: 0;
  }
}

</style>
