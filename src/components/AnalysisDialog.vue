<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        {{ title }}
        <v-spacer></v-spacer>
        <v-icon size="20" @click="$emit('update:modelValue', false)">mdi-close</v-icon>
      </v-card-title>
      <v-card-text>
        <slot></slot>
      </v-card-text>
      <v-card-actions>
        <slot name="actions">
          <v-spacer></v-spacer>
          <v-btn @click="$emit('update:modelValue', false)">Close</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// Generic small-form popup used by AnalysisPanel's per-functionality dialogs (Community
// Detection, Community Annotation, g:Profiler, Reactome, Gemini) so each doesn't hand-roll its
// own v-dialog/v-card boilerplate. Purely presentational -- callers own the open/close state via
// v-model and supply their own body/actions.
export default {
  name: 'AnalysisDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
};
</script>
