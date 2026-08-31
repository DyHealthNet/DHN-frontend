<template>
  <v-card outlined>
    <v-toolbar color="primary-darken-1" density="compact">
      <v-toolbar-title>
        Contexts to Compare
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props">mdi-information</v-icon>
          </template>
          <span>Pick two finished contexts that share the same originally selected variable subset (layers) and
            were scored with the same test type and correction method. Only compatible contexts are selectable as
            the second context. Variables moDiNA found unusable in only one of the two contexts don't block the
            comparison -- they're excluded from the result and reported after it runs.</span>
        </v-tooltip>
      </v-toolbar-title>
    </v-toolbar>

    <v-card-text>
      <v-row dense align="center">
        <v-col cols="12" md="5">
          <v-select
            v-model="firstValue"
            :items="finishedContexts"
            item-title="contextName"
            item-value="contextValue"
            label="Context 1"
            density="compact"
            variant="outlined"
            hide-details="auto"
            :loading="isLoading"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:subtitle>
                  <v-chip v-if="item.raw.content?.testType" size="x-small" color="primary-darken-1" label class="mr-1">
                    {{ item.raw.content.testType }}
                  </v-chip>
                  <v-chip v-if="item.raw.content?.correction" size="x-small" color="primary-darken-1" label>
                    {{ item.raw.content.correction }}
                  </v-chip>
                </template>
                <template v-slot:append>
                  <v-icon :color="item.raw.colors?.color">mdi-circle</v-icon>
                </template>
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <v-icon :color="item.raw.colors?.color" size="12" class="mr-2">mdi-circle</v-icon>
              {{ item.raw.contextName }}
              <v-chip v-if="item.raw.content?.testType" size="x-small" color="primary-darken-1" label class="ml-2 mr-1">
                {{ item.raw.content.testType }}
              </v-chip>
              <v-chip v-if="item.raw.content?.correction" size="x-small" color="primary-darken-1" label>
                {{ item.raw.content.correction }}
              </v-chip>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="2" class="text-center">
          <v-icon size="28" color="primary-darken-1">mdi-compare-horizontal</v-icon>
        </v-col>

        <v-col cols="12" md="5">
          <v-select
            v-model="secondValue"
            :items="compatibleContexts"
            item-title="contextName"
            item-value="contextValue"
            label="Context 2"
            density="compact"
            variant="outlined"
            hide-details="auto"
            :disabled="!firstValue"
            :loading="isLoading"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:subtitle>
                  <v-chip v-if="item.raw.content?.testType" size="x-small" color="primary-darken-1" label class="mr-1">
                    {{ item.raw.content.testType }}
                  </v-chip>
                  <v-chip v-if="item.raw.content?.correction" size="x-small" color="primary-darken-1" label>
                    {{ item.raw.content.correction }}
                  </v-chip>
                </template>
                <template v-slot:append>
                  <v-icon :color="item.raw.colors?.color">mdi-circle</v-icon>
                </template>
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <v-icon :color="item.raw.colors?.color" size="12" class="mr-2">mdi-circle</v-icon>
              {{ item.raw.contextName }}
              <v-chip v-if="item.raw.content?.testType" size="x-small" color="primary-darken-1" label class="ml-2 mr-1">
                {{ item.raw.content.testType }}
              </v-chip>
              <v-chip v-if="item.raw.content?.correction" size="x-small" color="primary-darken-1" label>
                {{ item.raw.content.correction }}
              </v-chip>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <p v-if="firstValue && compatibleContexts.length === 0" class="text-error mt-3 mb-0 text-body-2">
        No other finished context shares the same variable subset, test type and correction method as
        "{{ firstContext.contextName }}" ({{ settingsLabel(firstContext) }}). Create one via the Contexts page first.
      </p>
      <p v-else-if="!isLoading && finishedContexts.length === 0" class="text-medium-emphasis mt-3 mb-0 text-body-2">
        No finished contexts yet. Create at least two contexts with the same variables via the Contexts page.
      </p>
    </v-card-text>
  </v-card>
</template>

<script>
import { BASE_URL } from '@/components/constants.js';
import { getCookie } from '@/components/authentication/auth.js';

export default {
  name: 'ContextComparisonPicker',
  props: {
    modelValue: {
      type: Object,
      default: () => ({ context1: null, context2: null }),
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      contexts: [],
      isLoading: false,
    };
  },
  computed: {
    finishedContexts() {
      return this.contexts.filter((c) => c.status === 'Finished' && c.content);
    },
    firstValue: {
      get() {
        return this.modelValue.context1?.contextValue ?? null;
      },
      set(value) {
        const context = this.finishedContexts.find((c) => c.contextValue === value) || null;
        let context2 = this.modelValue.context2;
        // Drop the current context2 if it's no longer compatible with the newly picked
        // context1, instead of silently keeping a selection the second dropdown wouldn't
        // itself have offered (compatibleContexts applies the same two checks below).
        if (context2 && (!context || !this.sameVariableSelection(context, context2) || !this.sameSettings(context, context2))) {
          context2 = null;
        }
        this.$emit('update:modelValue', { context1: context, context2 });
      },
    },
    secondValue: {
      get() {
        return this.modelValue.context2?.contextValue ?? null;
      },
      set(value) {
        const context = this.compatibleContexts.find((c) => c.contextValue === value) || null;
        this.$emit('update:modelValue', { context1: this.modelValue.context1, context2: context });
      },
    },
    firstContext() {
      return this.modelValue.context1;
    },
    compatibleContexts() {
      if (!this.firstContext) return [];
      return this.finishedContexts.filter(
        (c) =>
          c.contextValue !== this.firstContext.contextValue &&
          this.sameVariableSelection(c, this.firstContext) &&
          this.sameSettings(c, this.firstContext)
      );
    },
  },
  methods: {
    // content.layers was never actually populated by the backend -- Context.params has no
    // top-level 'layers' key (see restrict_variables()'s docstring in
    // network/contexts/contexts.py), only variables/variablesLayers/variablesSubLayers, which
    // together are the complete, self-sufficient description of a context's variable selection.
    // 'content' is just context.params verbatim, so all three are already available here without
    // an extra fetch. This mirrors what the backend itself now resolves and compares before
    // allowing a comparison (network/views/modina.py's data1.columns.equals(data2.columns), fed
    // by _resolve_context_data) -- doing it here too lets compatibleContexts filter out a genuine
    // selection mismatch before the user even tries to run the comparison, instead of only
    // finding out from the 400 response.
    sameVariableSelection(a, b) {
      const normalize = (context) => {
        const subLayers = context.content?.variablesSubLayers || {};
        return JSON.stringify({
          variables: [...(context.content?.variables || [])].sort(),
          variablesLayers: [...(context.content?.variablesLayers || [])].sort(),
          variablesSubLayers: Object.keys(subLayers)
            .sort()
            .map((layer) => [layer, [...subLayers[layer]].sort()]),
        });
      };
      return normalize(a) === normalize(b);
    },
    // testType/correction are fixed per-context (chosen when its association scores were
    // computed) -- the comparison reuses those stored scores rather than recomputing them, so
    // both contexts must already agree on both, same as sameVariableSelection() above.
    sameSettings(a, b) {
      return a.content?.testType === b.content?.testType && a.content?.correction === b.content?.correction;
    },
    // Small "nonparametric · bh" label shown next to each context so it's visible while picking
    // which ones are actually comparable, instead of only finding out after a failed request.
    settingsLabel(context) {
      const testType = context?.content?.testType;
      const correction = context?.content?.correction;
      if (!testType || !correction) return '';
      return `${testType} · ${correction}`;
    },
    async fetchContexts() {
      this.isLoading = true;
      try {
        const wantedFields = ['contextName', 'contextValue', 'colors', 'status', 'content'];
        const url = new URL(`${BASE_URL}/context/api/retrieveContexts/`);
        url.search = new URLSearchParams({ fields: wantedFields });

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          credentials: 'include',
        });
        const data = await response.json();
        this.contexts = data.result || [];
      } catch (error) {
        console.error('Failed to fetch contexts:', error);
      } finally {
        this.isLoading = false;
      }
    },
  },
  created() {
    this.fetchContexts();
  },
};
</script>
