import { reactive } from 'vue';

const contextState = reactive({
  processFinished: false, // Initially unknown
  showIndicator: false,
  taskStarted: false,
  taskInfo:"",
  taskType:"info"
});

export { contextState }; // Expose the reactive state for use across components
