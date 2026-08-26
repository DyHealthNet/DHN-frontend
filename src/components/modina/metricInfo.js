// Human-readable label + explanation for each node metric / edge metric / ranking algorithm
// name the backend can report (network/tasks.py's MODINA_NODE_METRIC/MODINA_EDGE_METRIC/
// MODINA_RANKING_ALGORITHM). Keyed by that exact name so the UI always describes whichever one
// was actually used for a given result, instead of a name baked into each component's template.
// An unrecognized/future key falls back to just showing the raw name rather than breaking.

export const NODE_METRIC_INFO = {
  STC: {
    label: 'STC',
    description: "Statistical test centrality: 1 minus the p-value of a direct two-context test on this node's raw values. Higher means a bigger shift between contexts.",
  },
};

export const EDGE_METRIC_INFO = {
  'diff-L-P': {
    label: 'diff-L-P',
    description: 'Absolute difference in -log10(p) between the two contexts. Higher means a bigger shift in this edge’s significance.',
  },
};

export const RANKING_ALGORITHM_INFO = {
  'PageRank+': {
    label: 'PageRank+',
    description: 'The probability of a long random walk over the network being at this node at any given time — scores across all nodes add up to 1. The walk favors higher-weighted edges (the edge metric) and is seeded/biased by the node metric.',
  },
  nodeRank: {
    label: 'Direct node-metric ranking',
    description: 'Nodes sorted directly by their node-metric value, with no network propagation.',
  },
};

export function metricLabel(map, key) {
  if (!key) return null;
  return map[key]?.label || key;
}

export function metricDescription(map, key) {
  if (!key) return '';
  return map[key]?.description || '';
}
