<template>
  <div class="status-box">
        <v-tooltip :text="tooltipText">
      <template v-slot:activator="{ props }">
          <v-icon
              v-bind="props"
            :icon="icon"
            size=50
            color="black"
            :class="iconClasses"
          >
          </v-icon>
       </template>
      </v-tooltip>
    <div class="text">
      <p class="title">{{ title }}</p>
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
  },
  name: 'StatusBox',
  data() {
    return {
      tooltipText: 'Annette B., Thomas M., Werner H. and 97 more',
      // make the icon spin if the title is 'In Progress'
    };
  },
  methods: {
    disableTooltip() {
      if (this.subtitle !== 'Participants') {
        this.tooltipText = '';
        console.log('Tooltip disabled');
      }
    },
  },
  created() {
    this.disableTooltip();
  },
  computed: {
    iconClasses() {
      return {
        'justify-center': true,
        'my-1': true,
        'mx-1': true,
        'spin-animation': this.icon === 'mdi-autorenew',
      };
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
  color: #333;
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
</style>
