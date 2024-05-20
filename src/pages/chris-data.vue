<!-- Chris Data Page -->

<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <!--Title-->
          <v-col cols="12" class="text-center">
            <h1><strong>CHRIS DATA</strong></h1>
            <p></p>
          </v-col>
          <!--Main Text-->
          <v-col cols="12">
            <h2>What is CHRIS Data?</h2>
            <p>
              The Cooperative Health Research in South Tyrol (CHRIS) study:<br />
              It is a population-based study with a longitudinal outlook to
              investigate the genetic and molecular basis of age-related common
              chronic conditions and their interaction with lifestyle and
              environment in the general population.
            </p>

            <h2>Why is CHRIS Data useful?</h2>
            <ul>
              <li>
                It aims to identify biological mechanisms underlying
                cardiovascular, metabolic, neurological, and psychiatric health
                conditions and understand how these mechanisms are influenced by
                environmental exposures.
              </li>
              <li>
                The target population in the Alps region has relatively low
                residential mobility across generations and low inbreeding,
                which favors the identification of enriched genetic variants
                associated with diseases/traits.
              </li>
              <li>
                Extensive phenotyping is done covering various domains like
                cardiovascular health, metabolic health, movement disorders,
                chronic pain, sleep, psychiatric health, cognition, etc. through
                interviews, clinical assessments, instrumental measurements
                (ECG, spirals for tremor, etc.), and biospecimen analysis.
              </li>
              <li>
                Information on lifestyle factors like diet, physical activity,
                smoking, and environmental exposures is also collected, allowing
                the study of gene-environment interactions.
              </li>
              <li>
                Family participation is encouraged for pedigree reconstruction
                and disease inheritance mapping.
              </li>
              <li>
                Multi-omics data like genomics (SNP arrays, exome sequencing),
                metabolomics (mitochondrial function metabolites), and biobanked
                samples (DNA, plasma, serum, urine) are available for integrated
                analysis.
              </li>
            </ul>

            <h2>What are the main data types of CHRIS?</h2>
            <ul>
              <li>
                Survey/questionnaire data covering personal information, family
                history, lifestyle, environmental exposures, diseases/conditions
                across various domains.
              </li>
              <li>
                Clinical assessment data like anthropometrics, blood pressure,
                ECG, tremor spirals, cognitive function, etc.
              </li>
              <li>
                Biospecimen data - blood parameters (lipids, glucose,
                biomarkers), urine parameters, DNA samples.
              </li>
              <li>Imaging data - MRI data available.</li>
              <li>
                Genotype data - SNP array data (~1 million SNPs) and exome
                sequencing data.
              </li>
              <li>
                Metabolomics data - Targeted metabolite profiling of
                mitochondrial/energy metabolism and untargeted metabolomics.
              </li>
            </ul>

            <h3>Know more about CHRIS data types?</h3>
            <a href="https://chris.eurac.edu/de" target="_blank">
              <v-btn color="grey">CHRIS Web</v-btn>
            </a>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  // don't forget to export the about us file
  name: "CHRISData",
};
</script>
