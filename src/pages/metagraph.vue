<template>
  <v-app>
    <v-main>
      <v-container class="metagraph-page py-10">
        <v-row>
          <v-col cols="12">
            <div class="hero">
              <div>
                <p class="eyebrow">Metagraph</p>
                <h1 class="title">Cosmograph integration space</h1>
                <p class="subtitle">
                  This page is reserved for a graph explorer powered by Cosmograph.
                  You can wire your node and edge data into the mount area below.
                </p>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row class="mt-4" align="stretch">
          <v-col cols="12">
            <v-card class="graph-card" rounded="xl" elevation="8">
              <v-toolbar color="primary-darken-1" density="comfortable">
                <v-toolbar-title>Cosmograph canvas</v-toolbar-title>
                <v-spacer />
                <v-btn-toggle
                  v-model="selectionMode"
                  class="mr-3"
                  color="white"
                  density="compact"
                  variant="outlined"
                  divided
                  mandatory
                  @update:modelValue="applySelectionMode"
                >
                  <v-btn value="zoom" size="small">Zoom</v-btn>
                  <v-btn value="rect" size="small">Rectangular</v-btn>
                  <v-btn value="polygon" size="small">Polygonal</v-btn>
                </v-btn-toggle>
                <v-btn
                  class="mr-2"
                  color="white"
                  variant="outlined"
                  size="small"
                  :loading="isLoading"
                  :disabled="isLoading || isLeidenLoading"
                  @click="loadMetagraph"
                >
                  Load Metagraph
                </v-btn>
                <v-btn
                  color="white"
                  variant="tonal"
                  size="small"
                  :loading="isLeidenLoading"
                  :disabled="isLoading || isLeidenLoading"
                  @click="runLeidenClustering"
                >
                  Run Leiden Clustering
                </v-btn>
              </v-toolbar>

              <v-card-text>
                <v-row class="controls-row" dense>
                  <v-col cols="12" md="4">
                    <v-switch v-model="useLimit" color="primary" hide-details inset label="Limit total links" />
                    <v-text-field
                      v-if="useLimit"
                      v-model.number="limit"
                      class="mt-2"
                      type="number"
                      min="1"
                      max="20000"
                      density="compact"
                      variant="outlined"
                      label="Total link limit"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="useThreshold"
                      color="primary"
                      hide-details
                      inset
                      label="Apply significance threshold"
                    />
                    <v-text-field
                      v-if="useThreshold"
                      v-model.number="threshold"
                      class="mt-2"
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      density="compact"
                      variant="outlined"
                      label="Threshold"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="usePerNodeLimit"
                      color="primary"
                      hide-details
                      inset
                      label="Cap links per node"
                    />
                    <v-text-field
                      v-if="usePerNodeLimit"
                      v-model.number="perNodeLimit"
                      class="mt-2"
                      type="number"
                      min="1"
                      max="20"
                      density="compact"
                      variant="outlined"
                      label="Links per node"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="resolution"
                      type="number"
                      step="0.1"
                      min="0.1"
                      density="compact"
                      variant="outlined"
                      label="Leiden resolution"
                      hint="Higher values produce more communities"
                      persistent-hint
                    />
                  </v-col>
                </v-row>

                <div v-if="isLoading" class="progress-wrap mb-4">
                  <v-progress-linear indeterminate color="primary" rounded />
                  <p class="progress-text mt-2 mb-1">Loading metagraph...</p>
                </div>

                <div v-if="errorMessage" class="error-note mb-3">
                  {{ errorMessage }}
                </div>

                <div v-if="cacheStatus">
                  <p class="cache-note mb-3">{{ cacheStatus }}</p>
                  <p class="progress-meta mb-0">
                    Links: {{ linksLoaded.toLocaleString() }} | Points: {{ pointsLoaded.toLocaleString() }}
                  </p>
                </div>

                <div class="graph-stage">
                  <div ref="containerRef" class="graph-container"></div>
                </div>

                <v-card class="mt-6" variant="outlined">
                  <v-card-title class="d-flex align-center justify-space-between">
                    <span>Selected nodes</span>
                    <div class="d-flex align-center ga-2">
                      <v-chip size="small" color="primary" variant="tonal">
                        {{ selectedNodes.length }} nodes
                      </v-chip>
                      <v-chip size="small" color="secondary" variant="tonal">
                        {{ selectedSubgraphLinks.length }} links
                      </v-chip>
                      <v-btn
                        size="small"
                        variant="outlined"
                        :disabled="!selectedNodes.length"
                        @click="downloadSelectedSubgraph"
                      >
                        Download subgraph JSON
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <v-table density="compact" class="selected-nodes-table">
                      <thead>
                        <tr>
                          <th class="text-left">Index</th>
                          <th class="text-left">ID</th>
                          <th class="text-left">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="node in selectedNodes" :key="node.index">
                          <td>{{ node.index }}</td>
                          <td>{{ node.id }}</td>
                          <td>{{ node.type ?? '-' }}</td>
                        </tr>
                        <tr v-if="!selectedNodes.length">
                          <td colspan="3" class="py-4 text-medium-emphasis">
                            Select one or more nodes to see them here.
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { Cosmograph, prepareCosmographData } from '@cosmograph/cosmograph'
import { BASE_URL } from '@/components/constants.js'

export default {
  data() {
    return {
      isLoading: false,
      isLeidenLoading: false,
      hasGraph: false,
      linksLoaded: 0,
      pointsLoaded: 0,
      errorMessage: '',
      cacheStatus: '',
      cosmographInstance: null,
      graphPoints: [],
      graphLinks: [],
      selectedPointIndices: [],
      selectedNodes: [],
      selectedSubgraphLinks: [],
      selectionMode: 'zoom',
      useLimit: true,
      useThreshold: true,
      usePerNodeLimit: true,
      limit: 2000,
      threshold: 0.999,
      perNodeLimit: 2,
      resolution: 1.0,
      cacheVersion: 'v1',
      dataConfig: {
        points: {
          pointIdBy: 'id',
          pointColorBy: 'type',
          pointColorStrategy: 'categorical',
          pointDefaultSize: 10,
          pointLabelBy: 'id',
          showLabels: true,
          showHoveredPointLabel: true,
          pointClusterBy: 'type',
          showClusterLabels: true,
        },
        links: {
          linkSourceBy: 'source',
          linkTargetsBy: ['target'],
          linkWidthBy: 'weight',
        },
      },
    }
  },
  methods: {
    buildRequestUrl(leiden=false) {
      const params = new URLSearchParams()
      if (this.useLimit && this.limit !== '' && this.limit != null) {
        params.set('limit', String(this.limit))
      }
      if (this.useThreshold && this.threshold !== '' && this.threshold != null) {
        params.set('threshold', String(this.threshold))
      }
      if (this.usePerNodeLimit && this.perNodeLimit !== '' && this.perNodeLimit != null) {
        params.set('per_node_limit', String(this.perNodeLimit))
      }
      if (leiden && this.resolution !== '' && this.resolution != null {
        params.set('resolution', String(this.resolution))
      }
      return `${BASE_URL}/metagraph/api/getCosmograph/?${params.toString()}`
    },
    getGraphCacheKey() {
      return `metagraph-cache:${this.cacheVersion}:${this.buildRequestUrl()}`
    },
    readGraphCache() {
      try {
        console.log('Attempting to read graph cache with key:', this.getGraphCacheKey())  
        const cached = window.localStorage.getItem(this.getGraphCacheKey())
        if (!cached) return null
        const parsed = JSON.parse(cached)
        if (!parsed || !Array.isArray(parsed.points) || !Array.isArray(parsed.links)) return null
        return parsed
      } catch (error) {
        console.warn('Failed to read graph cache:', error)
        return null
      }
    },
    writeGraphCache(graph) {
      try {
        window.localStorage.setItem(this.getGraphCacheKey(), JSON.stringify(graph))
        console.log('Attempting to write graph cache with key:', this.getGraphCacheKey())  
      } catch (error) {
        console.warn('Failed to write graph cache:', error)
      }
    },
    async fetchGraph(requestUrl) {
      const res = await fetch(requestUrl)
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const bodyPreview = (await res.text()).slice(0, 120)
        throw new Error(`Expected JSON but got '${contentType}'. Body starts with: ${bodyPreview}`)
      }

      return res.json()
    },
    async renderGraph(rawPoints, rawLinks) {

      if (!this.$refs.containerRef) {
        return
      }

      this.graphPoints = Array.isArray(rawPoints) ? rawPoints : []
      this.graphLinks = Array.isArray(rawLinks) ? rawLinks : []

      const prepared = await prepareCosmographData(this.dataConfig, rawPoints || [], rawLinks || [])
      if (!prepared) {
        this.errorMessage = 'Failed to prepare graph data for Cosmograph.'
        return
      }

      const { points, links, cosmographConfig } = prepared

      // Safely destroy previous instance (await if promise) and clear container
      try {
        await this.safeDestroy(this.cosmographInstance)
        this.cosmographInstance = null
        this.$refs.containerRef && (this.$refs.containerRef.innerHTML = '')
      } catch (err) {
        console.warn('Failed to cleanup container or containerRef:', err)
      }

      try {
        this.cosmographInstance = new Cosmograph(this.$refs.containerRef, {
          points,
          links,
          onPointsFiltered: (filteredPoints, selectedPointIndices, selectedLinkIndices) =>
            this.handlePointsFiltered(filteredPoints, selectedPointIndices, selectedLinkIndices),
          ...cosmographConfig,
        })
      } catch (err) {
        console.error('Failed to initialize Cosmograph instance:', err)
        throw err
      }

      this.hasGraph = true
      this.applySelectionMode()
      this.syncSelectionFromGraph([])
    },

    async safeDestroy(inst) {
      if (!inst || typeof inst.destroy !== 'function') return
      try {
        const res = inst.destroy()
        if (res && typeof res.then === 'function') await res
        else await Promise.resolve()
      } catch (e) {
        console.warn('Error destroying Cosmograph instance:', e)
      }
    },

    handlePointsFiltered(filteredPoints, selectedPointIndices) {
      this.syncSelectionFromGraph(selectedPointIndices || [])
    },

    syncSelectionFromGraph(selectedPointIndices) {
      this.selectedPointIndices = Array.isArray(selectedPointIndices) ? selectedPointIndices : []
      this.selectedNodes = this.selectedPointIndices
        .map((index) => {
          const point = this.graphPoints[index]
          if (!point) return null
          return { ...point, index }
        })
        .filter(Boolean)

      const selectedIds = new Set(this.selectedNodes.map((node) => node.id))
      this.selectedSubgraphLinks = this.graphLinks.filter((link) => selectedIds.has(link.source) && selectedIds.has(link.target))
    },

    downloadSelectedSubgraph() {
      if (!this.selectedNodes.length) return

      const payload = {
        points: this.selectedNodes.map(({ index, ...point }) => point),
        links: this.selectedSubgraphLinks,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'selected-subgraph.json'
      link.click()
      URL.revokeObjectURL(url)
    },

    applySelectionMode() {
      if (!this.cosmographInstance) return

      try {
        this.cosmographInstance.deactivateRectSelection?.()
        this.cosmographInstance.deactivatePolygonalSelection?.()
      } catch (error) {
        console.warn('Failed to deactivate selection modules:', error)
        // ignore teardown errors from selection modules
      }

      if (this.selectionMode === 'rect') {
        this.cosmographInstance.activateRectSelection?.()
      } else if (this.selectionMode === 'polygon') {
        this.cosmographInstance.activatePolygonalSelection?.()
      }
    },

    async loadMetagraph() {
      if (!this.$refs.containerRef || this.isLoading) return
      console.log('Loading metagraph');

      this.isLoading = true
      this.errorMessage = ''
      this.cacheStatus = ''

      try {
        const cachedGraph = this.readGraphCache()
        console.log('cachedGraph:', cachedGraph);
        const graph = cachedGraph || (await this.fetchGraph(this.buildRequestUrl()))
        console.log('graph:', graph);
        this.pointsLoaded = graph.points?.length || 0
        this.linksLoaded = graph.links?.length || 0
        if (cachedGraph) {
          this.cacheStatus = 'Loaded graph from browser cache.'
        } else {
          this.writeGraphCache(graph)
          this.cacheStatus = 'Saved graph to browser cache.'
        }
        this.dataConfig['points']['pointClusterBy'] = 'type'
        await this.renderGraph(graph.points || [], graph.links || [])
        console.log('Graph rendered successfully');
      } catch (error) {
        console.error('Failed to load Cosmograph network data:', error)
        this.errorMessage = `Failed to load Cosmograph network data: ${error.message || error}`
      } finally {
        this.isLoading = false
      }
    },
    async runLeidenClustering() {
      if (!this.$refs.containerRef || this.isLoading || this.isLeidenLoading) return

      this.isLeidenLoading = true
      this.errorMessage = ''
      this.cacheStatus = ''

      try {
        const graph = await this.fetchGraph(this.buildLeidenRequestUrl(leiden=true))
        this.pointsLoaded = graph.points?.length || 0
        this.linksLoaded = graph.links?.length || 0

        const algo = graph.meta?.algorithm || 'unknown'
        const communities = graph.meta?.community_count ?? 0
        this.cacheStatus = `Leiden clustering complete (${algo}, ${communities} communities).`

        this.dataConfig['points']['pointClusterBy'] = 'community'
        await this.renderGraph(graph.points || [], graph.links || [])
      } catch (error) {
        console.error('Failed to run Leiden clustering:', error)
        this.errorMessage = `Failed to run Leiden clustering: ${error.message || error}`
      } finally {
        this.isLeidenLoading = false
      }
    },
  },
  beforeUnmount() {
    if (this.cosmographInstance && typeof this.cosmographInstance.destroy === 'function') {
      this.cosmographInstance.destroy()
    }
  },
}
</script>

<style scoped>
.metagraph-page {
  min-height: calc(100vh - 220px);
}

.hero {
  padding: 2rem;
  border-radius: 24px;
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
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.05;
}

.subtitle {
  margin-top: 0.9rem;
  max-width: 720px;
  font-size: 1.02rem;
  opacity: 0.82;
}

.graph-card,
.info-card {
  height: 100%;
}

.graph-stage {
  min-height: 640px;
  border-radius: 20px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(25, 118, 210, 0.10), transparent 34%),
    radial-gradient(circle at bottom right, rgba(255, 193, 7, 0.08), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(250, 250, 250, 0.98));
  border: 1px dashed rgba(25, 118, 210, 0.25);
  display: grid;
  place-items: center;
  padding: 2rem;
}

.graph-container {
  width: 100%;
  height: 700px;
}

.progress-wrap {
  max-width: 760px;
}

.progress-text {
  font-weight: 600;
}

.progress-meta {
  opacity: 0.82;
  font-size: 0.92rem;
}

.cache-note {
  font-size: 0.92rem;
  color: rgba(20, 84, 37, 1);
}

.error-note {
  font-size: 0.92rem;
  color: rgba(166, 36, 36, 1);
}

.graph-placeholder {
  text-align: center;
  max-width: 420px;
}

.graph-placeholder h2 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-size: 1.4rem;
}

.graph-placeholder p {
  margin: 0;
  opacity: 0.78;
}

.checklist {
  padding-left: 1.2rem;
  margin: 0;
}

.checklist li {
  margin-bottom: 0.8rem;
}
</style>