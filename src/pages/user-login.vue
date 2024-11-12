<template>
  <v-container class="d-flex align-center justify-center fill-height">
    <v-row class="d-flex align-center justify-center fill-height">
      <v-col cols="2">
        <v-btn class="d-flex justify-center" color="success">ORCID</v-btn>
        <v-divider class="my-9" thickness="2"></v-divider>

        <v-card>
          <v-card-text>
            <v-form fast-fail @submit.prevent>
              <v-text-field
                variant="outlined"
                density="compact"
                v-model="firstName"
                :rules="firstNameRules"
                label="First name"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                density="compact"
                v-model="lastName"
                :rules="lastNameRules"
                type="password"
                label="Last name"
              ></v-text-field>

              <v-btn class="mt-2" type="submit" block>Submit</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      firstName: "",
      lastName: "",
      firstNameRules: [
        v => !!v || "First name is required",
        v => (v && v.length <= 10) || "First name must be less than 10 characters"
      ],
      lastNameRules: [
        v => !!v || "Password is required",
        v => (v && v.length > 8) || "Password must be more than eight characters"
      ]
    };
  }
};
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>