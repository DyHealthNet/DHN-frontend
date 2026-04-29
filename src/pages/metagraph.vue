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
                  @update:modelValue="applySelectionMode"
                >
                  <v-btn value="rect" size="small">Rectangular</v-btn>
                  <v-btn value="polygon" size="small">Polygonal</v-btn>
                  <v-btn value="zoom" size="small">Zoom</v-btn>
                </v-btn-toggle>
                <v-btn
                  class="mr-2"
                  color="white"
                  variant="outlined"
                  size="small"
                  :loading="isLoading"
                  :disabled="isLoading"
                  @click="loadMetagraph({ forceReload: hasGraph })"
                >
                  {{ hasGraph ? 'Reload Metagraph' : 'Load Metagraph' }}
                </v-btn>
              </v-toolbar>

              <v-card-text>
                <v-row class="controls-row" dense>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="useEdgeLimit"
                      color="primary"
                      hide-details
                      inset
                      label="Limit total links"
                    />
                    <v-text-field
                      v-if="useEdgeLimit"
                      v-model.number="EDGE_LIMIT"
                      class="mt-2"
                      type="number"
                      min="1"
                      max="2000"
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
                      v-model.number="EDGE_THRESHOLD"
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
                      v-model.number="PER_NODE_LIMIT"
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
                </v-row>

                <div v-if="isLoading" class="progress-wrap mb-4">
                  <v-progress-linear indeterminate color="primary" rounded />
                  <p class="progress-text mt-2 mb-1">Loading metagraph...</p>
                  <p class="progress-meta mb-0">
                    Links: {{ linksLoaded.toLocaleString() }} | Points: {{ pointsLoaded.toLocaleString() }}
                  </p>
                </div>

                <div v-if="cacheInfo" class="cache-note mb-3">
                  {{ cacheInfo }}
                </div>

                <div v-if="errorMessage" class="error-note mb-3">
                  {{ errorMessage }}
                </div>

                <div class="graph-stage">
                  <div ref="containerRef" class="graph-container"></div>
                </div>
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
      hasGraph: false,
      linksLoaded: 0,
      pointsLoaded: 0,
      cacheInfo: '',
      errorMessage: '',
      cosmographInstance: null,
      useEdgeLimit: true,
      useThreshold: true,
      usePerNodeLimit: true,
      EDGE_LIMIT: 2000,
      EDGE_THRESHOLD: 0.999,
      PER_NODE_LIMIT: 5,
      CACHE_DB_NAME: 'dhn-metagraph-cache',
      CACHE_STORE: 'graphs',
      CACHE_NAMESPACE: 'cosmograph-network-v3',
      CACHE_TTL_MS: 6 * 60 * 60 * 1000,
      selectionMode: 'zoom',
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
    openCacheDb() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.CACHE_DB_NAME, 1)
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains(this.CACHE_STORE)) {
            db.createObjectStore(this.CACHE_STORE)
          }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    },
    async readCache() {
      const db = await this.openCacheDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.CACHE_STORE, 'readonly')
        const store = tx.objectStore(this.CACHE_STORE)
        const req = store.get(this.getCacheKey())
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
      })
    },
    async writeCache(payload) {
      const db = await this.openCacheDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.CACHE_STORE, 'readwrite')
        const store = tx.objectStore(this.CACHE_STORE)
        const req = store.put(payload, this.getCacheKey())
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    },
    async readLatestGraphCache() {
      const db = await this.openCacheDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.CACHE_STORE, 'readonly')
        const store = tx.objectStore(this.CACHE_STORE)
        const req = store.openCursor()
        let latest = null

        req.onsuccess = () => {
          const cursor = req.result
          if (!cursor) {
            resolve(latest)
            return
          }

          const key = String(cursor.key || '')
          const value = cursor.value
          const isGraphCache = key.startsWith('cosmograph-network-') || key.startsWith('cosmograph-network:')
          if (isGraphCache && value && Array.isArray(value.points) && Array.isArray(value.links)) {
            if (!latest || (value.cachedAt || 0) > (latest.cachedAt || 0)) {
              latest = value
            }
          }
          cursor.continue()
        }

        req.onerror = () => reject(req.error)
      })
    },
    getCacheKey() {
      return `${this.CACHE_NAMESPACE}:limit-${this.useEdgeLimit ? this.EDGE_LIMIT : 'off'}:threshold-${this.useThreshold ? this.EDGE_THRESHOLD : 'off'}:pernode-${this.usePerNodeLimit ? this.PER_NODE_LIMIT : 'off'}`
    },
    buildRequestUrl() {
      const params = new URLSearchParams()
      if (this.useEdgeLimit) {
        params.set('limit', String(this.EDGE_LIMIT))
      }
      if (this.useThreshold) {
        params.set('threshold', String(this.EDGE_THRESHOLD))
      }
      if (this.usePerNodeLimit) {
        params.set('per_node_limit', String(this.PER_NODE_LIMIT))
      }
      return `${BASE_URL}/network/api/getCosmographNetwork/?${params.toString()}`
    },
    async fetchGraph() {
      const res = await fetch(this.buildRequestUrl())
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

      const prepared = await prepareCosmographData(this.dataConfig, rawPoints || [], rawLinks || [])
      if (!prepared) {
        this.errorMessage = 'Failed to prepare graph data for Cosmograph.'
        return
      }

      const { points, links, cosmographConfig } = prepared

      console.log('cosmographConfig:', cosmographConfig)

      if (this.cosmographInstance && typeof this.cosmographInstance.destroy === 'function') {
        this.cosmographInstance.destroy()
      }

      this.cosmographInstance = new Cosmograph(this.$refs.containerRef, {
        points,
        links,
        disableLogging: false,
        ...cosmographConfig,
      })
      console.log('Cosmograph Instance:', this.cosmographInstance)

      this.hasGraph = true
      this.applySelectionMode()
    },

    applySelectionMode() {
      if (!this.cosmographInstance) return

      try {
        this.cosmographInstance.deactivateRectSelection?.()
        this.cosmographInstance.deactivatePolygonalSelection?.()
      } catch (e) {
        // ignore selection teardown failures
      }

      try {
        this.cosmographInstance.setConfig?.({
          enableZoom: this.selectionMode === 'zoom',
          selectPointOnClick: false,
          selectPointOnLabelClick: false,
          focusPointOnClick: false,
          focusPointOnLabelClick: false,
        })
      } catch (e) {
        // ignore config update failures
      }

      if (this.selectionMode === 'rect') {
        try {
          this.cosmographInstance.activateRectSelection?.()
        } catch (e) {
          // ignore selection activation failures
        }
      }

      if (this.selectionMode === 'polygon') {
        try {
          this.cosmographInstance.activatePolygonalSelection?.()
        } catch (e) {
          // ignore selection activation failures
        }
      } else if (this.selectionMode === 'zoom') {
        try {
          this.cosmographInstance.unselectAllPoints?.()
        } catch (e) {
          // ignore selection clearing failures
        }
      }
    },

    async loadMetagraph({ forceReload = false } = {}) {
      if (!this.$refs.containerRef || this.isLoading) return

      this.isLoading = true
      this.errorMessage = ''
      this.cacheInfo = ''
      let fallbackCache = null

      try {
        if (!forceReload) {
          const cached = await this.readCache()
          if (cached && cached.cachedAt && (Date.now() - cached.cachedAt) < this.CACHE_TTL_MS) {
            this.pointsLoaded = cached.points?.length || 0
            this.linksLoaded = cached.links?.length || 0
            this.cacheInfo = `Loaded from browser cache (${this.linksLoaded.toLocaleString()} links).`
            await this.renderGraph(cached.points || [], cached.links || [])
            return
          }

          fallbackCache = await this.readLatestGraphCache()
          if (fallbackCache && fallbackCache !== cached && fallbackCache.cachedAt
              && (Date.now() - fallbackCache.cachedAt) < this.CACHE_TTL_MS) {
            this.pointsLoaded = fallbackCache.points?.length || 0
            this.linksLoaded = fallbackCache.links?.length || 0
            this.cacheInfo = `Loaded compatible browser cache (${this.linksLoaded.toLocaleString()} links).`
            await this.renderGraph(fallbackCache.points || [], fallbackCache.links || [])
            return
          }
        }

        const graph = await this.fetchGraph()
        this.pointsLoaded = graph.points?.length || 0
        this.linksLoaded = graph.links?.length || 0
        await this.writeCache({
          cachedAt: Date.now(),
          points: graph.points,
          links: graph.links,
        })
        this.cacheInfo = `Fetched live data (${graph.links.length.toLocaleString()} links) and cached in browser.`
        await this.renderGraph(graph.points || [], graph.links || [])
      } catch (error) {
        if (!fallbackCache) {
          try {
            fallbackCache = await this.readLatestGraphCache()
          } catch (cacheReadError) {
            // keep original fetch error
          }
        }

        if (fallbackCache && Array.isArray(fallbackCache.points) && Array.isArray(fallbackCache.links)) {
          this.pointsLoaded = fallbackCache.points.length
          this.linksLoaded = fallbackCache.links.length
          this.cacheInfo = `Live fetch failed, showing cached graph (${this.linksLoaded.toLocaleString()} links).`
          await this.renderGraph(fallbackCache.points, fallbackCache.links)
          return
        }

        console.error('Failed to load Cosmograph network data:', error)
        this.errorMessage = `Failed to load Cosmograph network data: ${error.message || error}`
      } finally {
        this.isLoading = false
      }
    },
  },
  mounted() {
    // Intentionally no auto-load; user starts via button.
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