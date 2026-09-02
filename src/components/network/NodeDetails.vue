<template>
  <NodeIdentityCard
    :display-name="node.display_name"
    :node-id="node.id"
    :description="node.description"
    :group-label="node.type"
    :group-color="groupColor"
    :data-type="node.data_type"
    :subtype="node.subtype"
    :xrefs="validXrefs"
    :icon-url="getIcon(node.type)"
  />
</template>

<script>
import NodeIdentityCard from './NodeIdentityCard.vue';
import { resolveXrefs } from './networkData.js';

export default {
  components: { NodeIdentityCard },
  props: {
    node: Object,
    getIcon: Function,
    // (node) => hex color | undefined -- same group color the legend/graph and
    // NodeRankingTable's Group column use, passed in rather than recomputed here
    // so this panel never drifts out of sync with them.
    getGroupColor: Function,
  },
  computed: {
    groupColor() {
      return this.getGroupColor ? this.getGroupColor(this.node) : null;
    },
    // node.type is this page's own pretty GROUP label (see data-network.vue's
    // getPrettyType) -- resolveXrefs needs that, not a data_type, to pick the
    // right target database.
    validXrefs() {
      return resolveXrefs(this.node.x_refs, this.node.type);
    },
  },
};
</script>
