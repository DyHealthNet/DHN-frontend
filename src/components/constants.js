import { ref, reactive } from "vue";

const BASE_URL =
    import.meta.env.VITE_BACKEND_URL ||
    `${window.location.protocol}//${window.location.host}`;

export { BASE_URL };

export const loadingStates = ref({
  isLoading: false,
  isLoadingBar: false,
  isLoadingBox: false,
  isLoadingLine: false,
  isLoadingHeatmap: false,
  isLoadingPie: false,
  isLoadingDensity: false
})

export function setLoadingState(key, value){
  if (key in loadingStates.value){
    loadingStates.value[key] = value;
  } else {
    console.warn(`Key ${key} not found in loadingStates`);
  }
}

export const isLoading = ref(false);
export function setIsLoading(value) {
  isLoading.value = value;
}
