<template>
  <div class="node-set-annotation-results-panel">
    <v-tabs :model-value="tab" color="primary-darken-1" @update:model-value="$emit('update:tab', $event)">
      <ClosableTab v-if="(geminiLabel != null || geminiLoading) && !geminiSubTabDismissed" value="gemini" @close="$emit('close-tab', 'gemini')">
        Gemini
      </ClosableTab>
    </v-tabs>
    <div class="pa-4">
      <p v-if="!hasAnyResult" class="text-caption text-medium-emphasis">
        Perform node set annotation from the Analysis panel to see results here.
      </p>
      <v-window v-else :model-value="tab">
        <v-window-item value="gemini">
          <div v-if="geminiLoading" class="d-flex align-center">
            <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-3"></v-progress-circular>
            <span class="text-caption text-medium-emphasis">Generating label...</span>
          </div>
          <!-- geminiLabel is guaranteed non-null here: hasAnyResult already required
               geminiLabel != null when not loading. -->
          <div v-else>
            <div class="text-subtitle-1 font-weight-medium">{{ geminiLabel.label }}</div>
            <p class="text-caption text-medium-emphasis">{{ geminiLabel.rationale }}</p>
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script>
// Per-selection "Node Set Annotation" results -- its own top-level tab in NetworkTablesPanel,
// split out of EnrichmentResultsPanel/"Enrichment" since Gemini's node-set annotation is
// conceptually distinct from g:Profiler/Reactome pathway enrichment. Structured the same way as
// EnrichmentResultsPanel (a v-tabs/v-window with one sub-tab per method, only shown once run and
// individually closable from then on) even though there's only one method (Gemini) today, so
// another node-set annotation method can be added the same way g:Profiler/Reactome sit side by
// side in the Enrichment tab.
//
// No separate "ran" flag here (unlike gProfiler/Reactome, which track *Ran booleans since an
// enrichment can legitimately succeed with zero significant results) -- a successful Gemini call
// always returns a label, so geminiLabel != null already means "has a result", and a failed call
// surfaces via the page's own error snackbar rather than an empty tab. Purely
// presentational/controlled: data-network.vue owns the state.
import ClosableTab from '@/components/network/ClosableTab.vue';

export default {
  name: 'NodeSetAnnotationResultsPanel',
  components: { ClosableTab },
  props: {
    tab: { type: String, default: 'gemini' },

    geminiLabel: { type: Object, default: null },
    geminiLoading: { type: Boolean, default: false },
    geminiSubTabDismissed: { type: Boolean, default: false },
  },
  emits: ['update:tab', 'close-tab'],
  computed: {
    hasAnyResult() {
      return (this.geminiLabel != null || this.geminiLoading) && !this.geminiSubTabDismissed;
    },
  },
};
</script>
