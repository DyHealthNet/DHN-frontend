<template>
  <div ref="container" class="cosmograph-graph"></div>
</template>

<script>
import { Cosmograph } from '@cosmograph/cosmograph';

// Owns the Cosmograph instance lifecycle and index-safe data upload, shared by
// data-network.vue and differential-network.vue -- previously each page built
// this independently, and moDiNA's independent path (via Cosmograph's own
// prepareCosmographData(), a DuckDB pipeline with no row-order guarantee)
// caused real bugs (edge/node color reading the wrong row after an internal
// join reordered it). This component always builds points/links by hand with
// explicit sequential indices (pointIndexBy: 'idx' / linkSourceIndexBy /
// linkTargetIndexBy), so array position IS Cosmograph's row index, guaranteed
// by construction -- the pattern data-network.vue already proved out.
//
// It knows nothing about what a color/size *means* (rank vs. STC vs. group,
// single- vs. multi-select) -- callers pass resolver functions and interpret
// emitted click/selection indices under their own model. See pointColorFn/
// pointSizeFn/linkColorFn/linkWidthFn props and the point-click/link-click/
// background-click/rect-selected/polygon-selected emits.
export default {
  name: 'CosmographGraph',
  props: {
    // { id, display_name?, ...anything the color/size fns need }. Already
    // filtered by the caller (hideUnconnected/Top-N applied upstream) --
    // refreshData() uploads exactly this set.
    nodes: { type: Array, default: () => [] },
    // { id?, source, target, ...anything the color/width fns need }. source/
    // target are node ids.
    edges: { type: Array, default: () => [] },
    physicsOn: { type: Boolean, default: true },
    // (node, index) => color string. Called by Cosmograph's own pointColorByFn
    // per point/per render -- the component resolves `node` from its own
    // order-safe `nodes` prop by index and hands it to this function, so
    // callers never need to look anything up by index themselves.
    pointColorFn: { type: Function, required: true },
    // (node, index) => number.
    pointSizeFn: { type: Function, required: true },
    // (edge, index) => color string.
    linkColorFn: { type: Function, required: true },
    // (edge, index) => number.
    linkWidthFn: { type: Function, required: true },
    backgroundColor: { type: String, required: true },
    hoveredPointRingColor: { type: String, required: true },
    unknownColor: { type: String, required: true },
    pointDefaultSize: { type: Number, default: 11 },
    pointGreyoutOpacity: { type: Number, default: 0.55 },
    linkGreyoutOpacity: { type: Number, default: 0.35 },
  },
  emits: [
    'point-click', 'link-click', 'background-click',
    'rect-selected', 'polygon-selected', 'simulation-end', 'error',
  ],
  data() {
    return {
      cosmographInstance: null,
      // id -> point index, rebuilt by refreshData() -- exposed via getPointIndex()
      // so callers can resolve their own ids (e.g. an edge's `source`/`target`,
      // or a table row's node id) into a Cosmograph index without keeping their
      // own copy of this map.
      nodeIdToIdx: new Map(),
      indexToNodeId: [],
      indexToEdgeId: [],
      // Chains every setConfig() call (refreshData()/refreshDesign()) so none
      // ever overlap -- Cosmograph's setConfig() doesn't serialize against a
      // prior in-flight call on its own, and racing two uploads into the same
      // page-wide DuckDB-WASM worker is exactly what caused an
      // "InternalError: out of memory" crash before this existed.
      _configUpdateChain: null,
      _cosmoConfig: null,
    };
  },
  watch: {
    physicsOn(value) {
      this.updatePhysics(value);
    },
  },
  methods: {
    // id -> point index, or -1 if not currently displayed. For callers that
    // need to resolve their own data (an edge's source/target, a table row's
    // node id) into a Cosmograph index for centerOnIndices()/selectIndices().
    getPointIndex(id) {
      return this.nodeIdToIdx.has(id) ? this.nodeIdToIdx.get(id) : -1;
    },
    getPointId(index) {
      return this.indexToNodeId[index];
    },
    getLinkId(index) {
      return this.indexToEdgeId[index];
    },
    // Rebuilds points/links from the current nodes/edges props and uploads
    // them. Tries setConfig() first (reusing the live instance) for every
    // update, new data included -- only falls back to a full destroy + fresh
    // instance if setConfig() actually throws (e.g. a schema it can't
    // reconcile in place), rather than always paying for a teardown.
    async refreshData() {
      const container = this.$refs.container;
      if (!container) return;

      // Only the columns Cosmograph's config actually reads (id/idx/
      // display_name) -- not a full node spread. Uploading extra columns just
      // bloats the DuckDB table for nothing, and DuckDB's SUMMARIZE (which
      // Cosmograph runs after every upload, over every column) has choked on
      // an unclamped raw numeric column doing exactly that. Callers keep their
      // own full node/edge objects and pass them to pointColorFn/etc. by index
      // (see below), not through this upload.
      const pointsForCosmo = this.nodes.map((node, i) => ({
        id: node.id,
        idx: i,
        display_name: node.display_name ?? node.id,
      }));
      const nodeIdToIdx = new Map(pointsForCosmo.map((p) => [p.id, p.idx]));
      const linksForCosmo = this.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        sourceIndex: nodeIdToIdx.get(edge.source),
        targetIndex: nodeIdToIdx.get(edge.target),
      }));

      this.nodeIdToIdx = nodeIdToIdx;
      this.indexToNodeId = pointsForCosmo.map((p) => p.id);
      this.indexToEdgeId = this.edges.map((e) => e.id);

      // Cosmograph's setConfig() merges the object it's given onto its default
      // config, not onto the currently-active one -- every call (refreshData()
      // and refreshDesign() alike) must carry the full config, or fields like
      // points/links/pointIdBy get silently reset. Keep the authoritative copy
      // on the instance and always pass all of it.
      this._cosmoConfig = {
        points: pointsForCosmo,
        links: linksForCosmo,
        pointIdBy: 'id',
        pointIndexBy: 'idx',
        linkSourceBy: 'source',
        linkTargetBy: 'target',
        linkSourceIndexBy: 'sourceIndex',
        linkTargetIndexBy: 'targetIndex',
        pointLabelBy: 'display_name',
        showLabels: true,
        showDynamicLabels: true,
        // Labels are colored like their point by default; the hovered label
        // gets its own CSS class so it can be forced to plain white regardless
        // of the point's own color -- see the :deep() rule below.
        showHoveredPointLabel: true,
        hoveredPointLabelClassName: 'cosmo-hovered-label',
        // Points that survive a data update (e.g. a Top-N/hideUnconnected
        // change) keep their existing position instead of the whole layout
        // jumping when Cosmograph rebuilds its simulation engine on a points
        // change -- doesn't make the update itself any cheaper, just less
        // jarring to watch.
        preservePointPositionsOnDataUpdate: true,
        ...this.designConfig(),
      };

      await this._runConfigUpdate(container);
    },
    // Recolors/reweights/retheme without touching points/links data -- kept
    // lightweight so pan/zoom/camera state isn't reset on every click or
    // theme toggle. Safe to call even if refreshData() hasn't run yet this
    // tick (falls through to a no-op via the instance-exists guard below).
    async refreshDesign() {
      if (!this.cosmographInstance || !this._cosmoConfig) return;
      this._cosmoConfig = { ...this._cosmoConfig, ...this.designConfig() };
      this._configUpdateChain = (this._configUpdateChain || Promise.resolve())
        .then(() => this.cosmographInstance?.setConfig(this._cosmoConfig))
        .catch((e) => console.warn('CosmographGraph: refreshDesign setConfig failed', e));
      await this._configUpdateChain;
    },
    // The theming/callback half of the config -- shared by refreshData() and
    // refreshDesign(). New function references every call so Cosmograph's
    // config-change detection (reference equality) actually re-invokes them --
    // the resolver props can change behavior (e.g. a color-mode switch)
    // without nodes/edges themselves changing.
    designConfig() {
      return {
        pointColorBy: 'idx',
        pointColorByFn: (value, index) => this.pointColorFn(this.nodes[index], index),
        pointSizeBy: 'idx',
        pointSizeByFn: (value, index) => this.pointSizeFn(this.nodes[index], index),
        linkColorBy: 'sourceIndex',
        linkColorByFn: (value, index) => this.linkColorFn(this.edges[index], index),
        linkWidthBy: 'sourceIndex',
        linkWidthByFn: (value, index) => this.linkWidthFn(this.edges[index], index),
        pointDefaultSize: this.pointDefaultSize,
        // A single click puts the graph into "some selection active" mode
        // (see selectIndices()), so this greyout kicks in on basically every
        // click -- Cosmograph's own default for links (0.1) is near-invisible,
        // and points on their implicit default faded out hard too. Keep
        // non-selected elements clearly present, just visually deprioritized.
        pointGreyoutOpacity: this.pointGreyoutOpacity,
        linkGreyoutOpacity: this.linkGreyoutOpacity,
        enableSimulation: this.physicsOn,
        // Cosmograph's own native click-to-select fires independently of the
        // onPointClick callback below and drives its own selection dimming --
        // callers handle all click/selection semantics themselves via
        // selectIndices(), so this stays off.
        selectPointOnClick: false,
        renderHoveredPointRing: true,
        resetSelectionOnEmptyCanvasClick: false,
        backgroundColor: this.backgroundColor,
        hoveredPointRingColor: this.hoveredPointRingColor,
        unknownColor: this.unknownColor,
        onPointClick: (index) => this.$emit('point-click', index),
        onLinkClick: (linkIndex) => this.$emit('link-click', linkIndex),
        onBackgroundClick: () => this.$emit('background-click'),
        onRectSelected: (selection, pointIndices) => this.$emit('rect-selected', pointIndices),
        onPolygonSelected: () => this.$emit('polygon-selected', this.cosmographInstance?.getSelectedPointIndices()),
        // Physics keeps spreading points across the simulation space; the
        // caller decides whether/how to re-fit once it settles (e.g. skipping
        // it while something's focused, so this doesn't undo a click's own
        // camera move) -- see the simulation-end emit.
        onSimulationEnd: () => this.$emit('simulation-end'),
      };
    },
    // Shared by refreshData() (which also changes points/links) and the retry
    // path below -- always carries the full stored config (see refreshData()'s
    // own comment on why).
    async _runConfigUpdate(container) {
      this._configUpdateChain = (this._configUpdateChain || Promise.resolve()).then(async () => {
        // Checked here, not before the chain is queued: an earlier queued
        // update (still pending when this one was scheduled) may itself
        // create the instance by the time this link actually runs.
        if (this.cosmographInstance) {
          await this.cosmographInstance.setConfig(this._cosmoConfig);
        } else {
          this.cosmographInstance = new Cosmograph(container, this._cosmoConfig);
        }
        await this.cosmographInstance.dataUploaded();
      });
      try {
        await this._configUpdateChain;
      } catch (e) {
        // setConfig() on a reused instance failed (e.g. a schema it couldn't
        // reconcile in place) -- fall back to a full rebuild rather than
        // leaving the graph in whatever state the failed update left it in.
        console.warn('CosmographGraph: setConfig-based update failed, falling back to a full rebuild', e);
        this._configUpdateChain = null;
        try {
          await this.destroy();
          this.cosmographInstance = new Cosmograph(container, this._cosmoConfig);
          await this.cosmographInstance.dataUploaded();
        } catch (e2) {
          console.error('CosmographGraph: rebuild also failed', e2);
          this.$emit('error', 'Could not render the network graph. Please try again.');
        }
      }
      // Physics-off case: onSimulationEnd never fires (no simulation runs), so fit here too.
      this.cosmographInstance?.fitView(0);
    },
    async destroy() {
      const inst = this.cosmographInstance;
      this.cosmographInstance = null;
      if (inst && typeof inst.destroy === 'function') {
        try {
          await inst.destroy();
        } catch (e) {
          console.warn('CosmographGraph: destroy failed', e);
        }
      }
    },
    updatePhysics(on) {
      if (!this.cosmographInstance) return;
      if (on) this.cosmographInstance.unpause();
      else this.cosmographInstance.pause();
    },
    // Applies the caller's selection model as the dim/highlight visual --
    // callers decide *which* indices count as selected (single- vs.
    // multi-select) and pass them here; this only renders it.
    selectIndices(pointIndices) {
      if (!this.cosmographInstance) return;
      if (pointIndices && pointIndices.length) {
        this.cosmographInstance.selectPoints(pointIndices);
      } else {
        this.cosmographInstance.unselectAllPoints();
      }
    },
    unselectAll() {
      this.cosmographInstance?.unselectAllPoints();
    },
    getConnectedPointIndices(index) {
      return this.cosmographInstance?.getConnectedPointIndices(index) || [];
    },
    getSelectedPointIndices() {
      return this.cosmographInstance?.getSelectedPointIndices();
    },
    // Pans (not zooms) to the midpoint of the given indices, at whatever zoom
    // level is already active -- a single point centers on itself; two (e.g.
    // an edge's endpoints) center on their midpoint. No zoom change, unlike
    // fitToIndices() below -- these are genuinely different UX and callers
    // pick whichever they want.
    panToIndices(indices) {
      if (!this.cosmographInstance || !indices || !indices.length) return;
      const positions = indices
        .map((i) => this.cosmographInstance.getPointPositionByIndex(i))
        .filter(Boolean);
      if (!positions.length) return;
      const midX = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
      const midY = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;
      const currentZoom = this.cosmographInstance.getZoomLevel();
      this.cosmographInstance.setZoomTransformByPointPositions(new Float32Array([midX, midY]), 700, currentZoom);
    },
    // Zooms/pans to frame the given indices -- Cosmograph's own
    // fitViewByIndices(), a small zoom change unlike panToIndices() above.
    fitToIndices(indices, duration = 700) {
      this.cosmographInstance?.fitViewByIndices(indices, duration);
    },
    resetView() {
      this.cosmographInstance?.fitView();
    },
    // this.$refs.container also holds Cosmograph's polygonal/rectangular
    // area-select overlay canvases, which sit before the real WebGL graph
    // canvas in DOM order -- a plain querySelector('canvas') grabs one of
    // those (empty except mid-lasso-select) instead of the graph.
    // _cosmosElement is Cosmograph's own inner wrapper that holds only the
    // graph canvas; it's what captureScreenshot() itself reads from
    // internally, so this targets the same element.
    getGraphCanvas() {
      return this.cosmographInstance?._cosmosElement?.querySelector('canvas') || null;
    },
    // Node labels are rendered as absolutely-positioned DOM elements overlaid
    // on the canvas (see Cosmograph's Labels module), not drawn into the
    // WebGL buffer -- so they never show up in a canvas-only capture, even
    // Cosmograph's own captureScreenshot(). Read each rendered label's text
    // and screen position directly off the DOM and draw it onto the capture.
    drawNodeLabels(ctx, canvas) {
      const labelsContainer = this.cosmographInstance?._labels?.labelsContainer;
      if (!labelsContainer) return;

      const canvasRect = canvas.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height) return;
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      const labelEls = Array.from(labelsContainer.querySelectorAll('*'))
        .filter((el) => el.children.length === 0 && el.textContent?.trim());

      // save/restore so textAlign/textBaseline/font/fillStyle don't leak into
      // whatever the caller draws next (e.g. a legend panel with its own
      // defaults).
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      labelEls.forEach((el) => {
        const style = window.getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        // Cosmograph doesn't remove decluttered/off-screen labels from the
        // DOM -- it fades them to opacity 0.1 via a "hidden" class while
        // keeping shown labels at full opacity. Mirror that distinction
        // instead of drawing every label Cosmograph has ever created.
        if (style.visibility === 'hidden' || style.display === 'none' || !(opacity > 0.5)) return;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (rect.left - canvasRect.left + rect.width / 2) * scaleX;
        const y = (rect.top - canvasRect.top + rect.height / 2) * scaleY;
        ctx.font = `${parseFloat(style.fontSize) * scaleY}px ${style.fontFamily}`;
        ctx.fillStyle = style.color;
        ctx.fillText(el.textContent.trim(), x, y);
      });
      ctx.restore();
    },
    // Produces a labeled PNG data URL of the current graph view -- the canvas
    // capture plus DOM-rendered labels, composited on an offscreen canvas so
    // capturing doesn't trigger a live redraw. `drawExtra(ctx, canvas)` is an
    // optional caller-supplied hook for anything page-specific to layer on
    // top (e.g. a legend panel, which differs per page).
    async captureImage(drawExtra) {
      const canvas = this.getGraphCanvas();
      if (!canvas) {
        console.error('CosmographGraph: canvas not available for capture');
        return null;
      }
      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d');
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      offscreenCtx.drawImage(canvas, 0, 0);
      this.drawNodeLabels(offscreenCtx, canvas);
      if (drawExtra) drawExtra(offscreenCtx, offscreenCanvas);
      return offscreenCanvas.toDataURL();
    },
    applyRectSelection() {
      this.cosmographInstance?.deactivatePolygonalSelection?.();
      // Clear any leftover point-selection constraint before handing off to
      // the tool -- otherwise it'd scope the drag down to whatever was
      // already selected instead of the whole graph.
      this.cosmographInstance?.unselectAllPoints();
      this.cosmographInstance?.activateRectSelection?.();
    },
    applyPolygonSelection() {
      this.cosmographInstance?.deactivateRectSelection?.();
      this.cosmographInstance?.unselectAllPoints();
      this.cosmographInstance?.activatePolygonalSelection?.();
    },
    deactivateSelectionTools() {
      this.cosmographInstance?.deactivateRectSelection?.();
      this.cosmographInstance?.deactivatePolygonalSelection?.();
    },
  },
  async beforeUnmount() {
    await this.destroy();
  },
};
</script>

<style scoped>
.cosmograph-graph {
  width: 100%;
  height: 100%;
}

/* Cosmograph mounts label elements into this container itself, outside Vue's
   own render tree -- :deep() reaches them anyway since they're still inside
   this component's DOM subtree. Overrides the label's own point-color
   inheritance (no pointLabelColor is set, so labels default to their point's
   color) with plain white specifically for whichever label is currently
   hovered. */
:deep(.cosmo-hovered-label) {
  color: #fff !important;
}
</style>
