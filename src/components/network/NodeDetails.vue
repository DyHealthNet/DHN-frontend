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
    <p v-if="node.subtype"><span class="label">Subtype:</span> <br>
      <span class="value">{{ node.subtype }}</span></p>
      <p title="We use Uniprot for proteins, HMDB for metabolites and SNOMED for phenotypes">
        <span v-if="validXrefs.length">
          <span class="label">Reference:</span><br>
          <v-chip
            v-for="(xref, index) in validXrefs"
            :key="index"
            :class="{'me-2': index < validXrefs.length - 1}"
            class="custom-chip"
            color="node-logo-background"
            outlined
            small
          >
            <a :href="xref.url" target="_blank" class="custom-link">
              {{ xref.label }}
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
  computed: {
    // xrefs are usually a bare accession (e.g. "P02768", "HMDB0001539",
    // multiple values ";"-separated) routed to the database matching the
    // node's own type. A few datasets still carry the legacy "db.accession"
    // form (values "|"-separated); that's only kept if the embedded db
    // matches the node's own type too. Anything that doesn't resolve to a
    // valid-looking id for the node's target database is dropped instead of
    // falling back to a dead "#" link.
    validXrefs() {
      if (!this.node.x_refs || !this.node.x_refs.length) return [];
      const targetDb = this.targetDbForType(this.node.type);
      return this.node.x_refs
        .split(/[;|]/)
        .map((xref) => xref.trim())
        .filter(Boolean)
        .map((xref) => this.resolveXref(xref, targetDb))
        .filter(Boolean);
    },
  },
  methods: {
    targetDbForType(type) {
      const t = (type || "").toLowerCase();
      if (t.includes("protein")) return "uniprot";
      if (t.includes("metabolite")) return "hmdb";
      if (t.includes("phenotype")) return "snomedct";
      return null;
    },
    resolveXref(xref, targetDb) {
      let db = targetDb;
      let id = xref;
      if (xref.includes(".")) {
        const [prefix, ...rest] = xref.split(".");
        db = prefix.toLowerCase();
        id = rest.join(".");
        if (targetDb && db !== targetDb) return null;
      }
      if (!db || !id) return null;
      const url = this.buildUrl(db, id);
      return url ? { label: xref, url } : null;
    },
    buildUrl(db, id) {
      switch (db) {
        case "uniprot":
          return /^[A-Z0-9]{6,10}(-\d+)?$/i.test(id)
            ? `https://www.uniprot.org/uniprotkb/${id}`
            : null;
        case "hmdb":
          return /^HMDB\d{5,7}$/i.test(id)
            ? `https://hmdb.ca/metabolites/${id}`
            : null;
        case "snomedct":
          return /^\d{6,18}$/.test(id)
            ? `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${id}`
            : null;
        default:
          return null; // only Uniprot/HMDB/SNOMED CT are linked out to
      }
    },
  },
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