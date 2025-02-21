<template>
    <!--<p><strong style="font-size: 24px">Selected Node</strong></p>-->
        <!-- Icon placed at top-right corner -->
    <v-icon
      class="me-6"
      size="50"
      color="transparent"
      style="position: absolute; right: 0;"
    >
    <v-img
    :src="getIcon(node.type)"
    alt="icon"
    max-width="40"
    max-height="40"
    class="me-0 rounded-circle"
    ></v-img>
      </v-icon>
    <p><span class="label-title">Node</span></p>
    <p><span class="label">Name:</span><br>
      <span class="display-name">{{ node.display_name }}</span></p>
    <p><span class="label">Description:</span> <br>
      <span class="value">{{ node.description }}</span></p>
      <p title="We use Uniprot for proteins, HMDB for metabolites and SNOMED for phenotypes">
        <span v-if="node.x_refs && node.x_refs.length">
          <span class="label">Reference:</span><br>
          <v-chip
            v-for="(xref, index) in node.x_refs.split('|')"
            :key="index"
            :class="{'me-2': index < node.x_refs.split('|').length - 1}"
            class="custom-chip"
            color="node-logo-background"
            outlined
            small
          >
            <a :href="generateLink(xref.trim())" target="_blank" class="custom-link">
              {{ xref.trim() }}
            </a>
          </v-chip>
        </span>
      </p>
      <!-- No chip alternative
      <p title="We use Uniprot for proteins, HMDB for metabolites and SNOMED for phenotypes">
      <span class="label">Reference:</span><br>
      <span v-if="node.x_refs && node.x_refs.length">
        <span v-for="(xref, index) in node.x_refs.split('|')" :key="index">
          <a :href="generateLink(xref.trim())" target="_blank" style="color: rgb(var(--v-theme-primary-darken-1))">
            {{ xref.trim() }}
          </a>
          <span v-if="index < node.x_refs.split('|').length - 1">,&#8203;</span>
        </span>
      </span>
      <span v-else> none</span>
    </p> -->
    <p><span class="label">ID:</span><br>
      <span class="value">{{ node.id }}</span></p>
</template>

<script>
export default {
  props: {
    node: Object,
    getIcon: Function,
  },
  methods: {
    generateLink(xref) {
      switch (xref.split(".")[0]) {
        case "uniprot":
          return `https://www.uniprot.org/uniprotkb/${xref.split(".")[1]}`;
        case "hmdb":
          return `https://hmdb.ca/metabolites/${xref.split(".")[1]}`;
        case "snomedct":
          return `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${
              xref.split(".")[1]
          }`;
        case "mondo":
          return `https://monarchinitiative.org/MONDO:${xref.split(".")[1]}`;
        case "umls":
          return `https://www.ncbi.nlm.nih.gov/medgen/${xref.split(".")[1]}`;
        case "omim":
          return `https://omim.org/entry/${xref.split(".")[1]}`;
        case "orpha":
          return `https://www.orpha.net/en/disease/detail/${xref.split(".")[1]}`;
        case "chemspider":
          return `https://www.chemspider.com/Chemical-Structure.${xref.split(".")[1]}.html`;

        default:
          return "#"; // default case if source_table doesn't match
      }
    },
  }
};
</script>

<style scoped>
.label {
  font-size: 12px;
  color: rgb(var(--v-theme-primary-darken-1));
}
.label-title {
  font-size: 24px;
  color: rgb(var(--v-theme-primary-darken-1));
  display: flex;
  justify-content: center;
  align-items: center;
}
.display-name {
  font-size: 18px; /* Larger text size */
  color: rgb(var(--v-theme-darken-1));
  padding-left: 0px; /* This adds the indent to all lines */
}
.value {
  padding-left: 0px; /* This adds the indent to all lines */
}
.custom-chip {
  background-color: rgb(var(--v-theme-node-logo-background)); /* Use any custom color */
  color: rgb(var(--v-theme-darken-1)); /* Adjust text color to contrast well */
  text-decoration: none; /* Remove underline */
}
.custom-chip a {
  color: rgb(var(--v-theme-darken-1)); /* Change link text color inside the chip */
}
.custom-link:hover {
  color: rgb(var(--v-theme-background)); /* Change hover color to pink (or any color you prefer) */
  background-color: transparent; /* Ensure no background color change */
  text-decoration: underline; /* Optional: underline the link on hover */
}
</style>