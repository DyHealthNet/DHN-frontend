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
                <v-btn
                  class="mr-2"
                  color="white"
                  variant="outlined"
                  size="small"
                  :loading="isLoading"
                  :disabled="isLoading"
                  @click="loadMetagraph"
                >
                  Load Metagraph
                </v-btn>
              </v-toolbar>

              <v-card-text>
                <div v-if="isLoading" class="progress-wrap mb-4">
                  <v-progress-linear indeterminate color="primary" rounded />
                  <p class="progress-text mt-2 mb-1">Loading metagraph...</p>
                  <p class="progress-meta mb-0">
                    Links: {{ linksLoaded.toLocaleString() }} | Points: {{ pointsLoaded.toLocaleString() }}
                  </p>
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
      errorMessage: '',
      cosmographInstance: null,
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
    buildRequestUrl() {
      const params = new URLSearchParams()
      params.set('per_node_limit', '2')
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

      if (this.cosmographInstance && typeof this.cosmographInstance.destroy === 'function') {
        this.cosmographInstance.destroy()
      }

      this.cosmographInstance = new Cosmograph(this.$refs.containerRef, {
        points,
        links,
        ...cosmographConfig,
      })

      this.hasGraph = true
    },

    async loadMetagraph() {
      if (!this.$refs.containerRef || this.isLoading) return

      this.isLoading = true
      this.errorMessage = ''

      try {
        const graph = await this.fetchGraph()
        this.pointsLoaded = graph.points?.length || 0
        this.linksLoaded = graph.links?.length || 0
        await this.renderGraph(graph.points || [], graph.links || [])
      } catch (error) {
        console.error('Failed to load Cosmograph network data:', error)
        this.errorMessage = `Failed to load Cosmograph network data: ${error.message || error}`
      } finally {
        this.isLoading = false
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