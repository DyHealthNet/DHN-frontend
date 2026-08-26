<template>
  <v-container class="context-creation-page page-container py-10">
    <v-row>
      <v-col cols="12">
            <div class="hero">
              <div>
                <p class="eyebrow">Context creation</p>
                <h1 class="title">Custom Context Creation</h1>
                <p class="subtitle">
                  Define your own context by selecting participants of interest based on custom rules.
                </p>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-card class="mt-4" outlined>
          <v-tabs v-model="contextTab" align-tabs="center" bg-color="primary-darken-1" show-arrows>
            <v-tab v-for="tab in tabs" :key="tab.contextValue" :text="tab.contextName" :value="tab.contextValue"></v-tab>
          </v-tabs>
          <v-window v-model="contextTab">
            <v-window-item v-for="tab in tabs" :key="tab.contextValue" :value="tab.contextValue">
              <v-card color="surface">
                <v-card-text>
                  <v-row>
                    <!-- keyed on renderVersion too: copyContextToNextTab() bumps it to force this
                         instance to remount, since ContextSetup only reads `content` in data(). -->
                    <ContextSetup :key="`${tab.contextValue}-${tab.renderVersion || 0}`"
                                  :title="tab.contextName" :content="tab.content" :status="tab.status"
                                  :value="tab.contextValue" @data-changed="updateTabName"
                                  :calculating="calculating" @calculation-start="calculating = true"
                                  @calculation-end="calculating = false"
                                  :has-free-tab="tabs.some(t => t.contextValue !== tab.contextValue && !t.content)"
                                  @copy-context="copyContextToNextTab" />
                  </v-row>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-card>
  </v-container>
</template>

<script>
import {getCookie} from "@/components/authentication/auth.js";
import {BASE_URL} from "@/components/constants.js";
import ContextSetup from "@/components/contexts/ContextSetup.vue";

export default {
  name: "ContextCreation",
  components: {
    ContextSetup
  },
  data() {
    return {
      contextTab: 1,
      preTabs: [
        { contextName: "Context 1", contextValue: 1, content: null, status:"Waiting"},
        { contextName: "Context 2",
          contextValue: 2,
          content: {
            connect: { inside: "OR", outside: "AND" },
            conditions: {'group-0': [{column: 'Abc', operator: 'equals (=)', value: '1'},
                                     {column: 'def', operator: 'in range', value: [0, 5]}],
                         'group-1': [{column: 'Ghi', operator: 'in', value: ['male', 'female']}]},
            tests: {contCont: 'Spearman', catCat: 'Chi-square', catContM: 'ANOVA', catContB: 'ANOVA'},
            layers: ['Metabolite', 'Phenotype'],
            contextName: "Test" },
            status:"Finished",
        },
        { contextName: "Context 3", contextValue: 3, content: null, status:"Waiting"},
        { contextName: "Context 4", contextValue: 4, content: null, status:"Waiting"},
        { contextName: "Context 5", contextValue: 5, content: null, status:"Waiting"}
      ],
      tabs: [],
      calculating : false,
    };
  },
  methods: {
    updateTabName(tabName) {
      let newTabName = "";
      if (tabName.length > 15) {
        newTabName = tabName.substring(0, 15) + "...";
      }
      else if (tabName.length === 0) {
        newTabName = "Context " + this.contextTab;
      }
      else {
        newTabName = tabName;
      }
      this.tabs[this.contextTab - 1].contextName = newTabName;
    },

    handleCalculationStatus(isCalculating) {
      this.calculating = isCalculating;
    },

    // Finds the nearest empty tab after the source tab (wrapping around, but never the
    // source tab itself) and seeds it with a copy of the source's live settings. contextName
    // arrives already blanked out (see ContextSetup.copyContext) so the new tab starts
    // untitled - the user has to name it before Submit is enabled (see titleMissing).
    // "Empty" is judged by content, same as the backend's own free-slot check - a tab with
    // unsaved (never-submitted) edits still counts as free and would have those edits
    // overwritten by the copy, since they only exist in that tab's own ContextSetup instance.
    copyContextToNextTab({sourceValue, params}) {
      const sourceIndex = this.tabs.findIndex(t => t.contextValue === sourceValue);
      if (sourceIndex === -1) {
        return;
      }

      const n = this.tabs.length;
      let targetIndex = -1;
      for (let offset = 1; offset < n; offset++) {
        const idx = (sourceIndex + offset) % n;
        if (!this.tabs[idx].content) {
          targetIndex = idx;
          break;
        }
      }
      if (targetIndex === -1) {
        return; // no free tab available
      }

      const targetTab = this.tabs[targetIndex];
      targetTab.content = {...params, contextValue: targetTab.contextValue};
      targetTab.contextName = '';
      targetTab.status = 'Waiting';
      // force ContextSetup to remount for this tab so it re-initializes from the new content
      targetTab.renderVersion = (targetTab.renderVersion || 0) + 1;

      this.contextTab = targetTab.contextValue;
    },

    fillTabNames() {
      // for all tabs that have content, fill the tab name with the context name
      this.tabs.forEach((tab) => {
        if (tab.content) {
          tab.contextName = tab.content.contextName;
        }
      });
    },

    async getAllContexts() {
      await fetch(`${BASE_URL}/context/api/retrieveContexts/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie("csrftoken")
        },
        credentials: 'include',
      })
          .then(response => response.json())
          .then(data => {
            this.tabs = data.result;
            console.log(this.tabs);
          })
          .catch((error) => {
            console.error('Error:', error);
            this.tabs = this.preTabs;
          });
    },
  },
  mounted() {
    this.fillTabNames();
  },
  created() {
    this.getAllContexts();
  }
};
</script>

<style scoped>

.context-creation-page {
  min-height: calc(100vh - 220px);
}

.hero {
  padding: 2rem;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(17, 24, 39, 0.04));
  border: 1px solid rgba(25, 118, 210, 0.16);
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary-darken-1));
}

.title {
  margin: 0;
  font-size: 2.5rem;
  line-height: 1.05;
}

.subtitle {
  margin-top: 0.9rem;
  max-width: 720px;
  font-size: 1.02rem;
  opacity: 0.82;
}

@media (max-width: 1919px) {
  .responsive-card {
    width: 95%;
  }
}

</style>
