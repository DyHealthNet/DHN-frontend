<template>
  <v-container class="text-center">
    <v-row>
      <v-col cols="12">
        <h1 class="title mt-4">Create a custom context</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col class="d-flex justify-center">
        <v-divider class="my-2" thickness="2"></v-divider>
      </v-col>
    </v-row>
  </v-container>

  <v-container class="d-flex justify-center mt-4">
    <v-card rounded="lg" elevation="1" class="responsive-card">
      <v-tabs v-model="contextTab" align-tabs="center" bg-color="primary-darken-1" show-arrows>
        <v-tab v-for="tab in tabs" :key="tab.contextValue" :text="tab.contextName" :value="tab.contextValue"></v-tab>
      </v-tabs>
      <v-window v-model="contextTab">
        <v-window-item v-for="tab in tabs" :key="tab.contextValue" :value="tab.contextValue">
          <v-card color="surface">
            <v-card-text>
              <v-row>
                <ContextSetup :title="tab.contextName" :content="tab.content" :status="tab.status"
                              :value="tab.contextValue" @data-changed="updateTabName"
                              :calculating="calculating" @calculation-start="calculating = true"
                              @calculation-end="calculating = false" />
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
            layers: ['Metabolomics', 'Phenomics'],
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
.responsive-card {
  width: 80%;
  transition: width 0.3s ease;
}
@media (max-width: 1500px) {
  .responsive-card {
    width: 100%;
  }
}

.title {
  font-weight: bold;
}

.divider {
  width: 10%;
  margin-top: 16px;
  margin-bottom: 16px;
}

.outlined-card {
  width: 80%;
  border-radius: 10px;
}
</style>
