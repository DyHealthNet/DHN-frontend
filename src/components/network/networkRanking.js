// Mirrors the backend's edge-weight formula (network/views/metagraph.py's
// _compute_minus_log_p/_compute_edge_weight): -log10(p) * |effect size|, with
// p<=0 (or missing) clamped to a tiny epsilon instead of 0/Infinity. Keeping
// this in sync means "important edge" means the same thing here as it does
// for community detection.
function computeEdgeWeight(pValue, effectSize) {
  let p = pValue;
  if (p == null || p <= 0) p = Number.MIN_VALUE;
  const minusLogP = -Math.log10(p);
  const absEffect = effectSize != null ? Math.abs(effectSize) : 0;
  return minusLogP * absEffect;
}

// Ranks edges by p-value ascending, then |effect size| descending as a
// tiebreak -- same convention as NodeEdgeTable.vue's per-node edge sort,
// generalized to the whole network. This is what makes the ranking useful
// even when most/all p-values are 0 (common after multiple-testing
// correction): the effect-size tiebreak takes over. Null-safe: missing
// values sort last on both keys.
function rankEdges(edges) {
  const sorted = [...edges].sort((a, b) => {
    const pa = a.p_value;
    const pb = b.p_value;
    if (pa == null && pb == null) {
      // fall through to effect-size tiebreak below
    } else if (pa == null) {
      return 1;
    } else if (pb == null) {
      return -1;
    } else if (pa !== pb) {
      return pa - pb;
    }
    const ea = a.effect_size != null ? Math.abs(a.effect_size) : null;
    const eb = b.effect_size != null ? Math.abs(b.effect_size) : null;
    if (ea == null && eb == null) return 0;
    if (ea == null) return 1;
    if (eb == null) return -1;
    return eb - ea;
  });
  return sorted.map((edge, index) => ({ ...edge, rank: index + 1 }));
}

// Weighted degree per node: sum of computeEdgeWeight over every edge
// incident to that node, plus the plain (unweighted) edge count. Nodes with
// no edges get degree 0 / weightedDegree 0 and rank last.
function computeWeightedDegree(nodes, edges) {
  const stats = new Map();
  for (const edge of edges) {
    const weight = computeEdgeWeight(edge.p_value, edge.effect_size);
    for (const nodeId of [edge.from, edge.to]) {
      const entry = stats.get(nodeId) || { degree: 0, weightedDegree: 0 };
      entry.degree += 1;
      entry.weightedDegree += weight;
      stats.set(nodeId, entry);
    }
  }

  const ranked = nodes.map((node) => {
    const entry = stats.get(node.id) || { degree: 0, weightedDegree: 0 };
    return { ...node, degree: entry.degree, weightedDegree: entry.weightedDegree };
  });
  ranked.sort((a, b) => b.weightedDegree - a.weightedDegree);
  return ranked.map((node, index) => ({ ...node, rank: index + 1 }));
}

// Sorted list of distinct test types present in a set of edges, for a
// per-test-type filter -- p-values are only comparable within one test type.
function distinctTestTypes(edges) {
  const types = new Set();
  for (const edge of edges) {
    if (edge.test_type) types.add(edge.test_type);
  }
  return Array.from(types).sort();
}

export { computeEdgeWeight, rankEdges, computeWeightedDegree, distinctTestTypes };
