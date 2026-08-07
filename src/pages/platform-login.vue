<template>
    <v-container class="page-container text-center">
    <v-row class="d-flex align-center justify-center">
      <v-col cols="12">
        <h1 class="title mt-4">Platform Access</h1>
      </v-col>
    </v-row>
    <v-row class="d-flex align-center justify-center">
      <v-col cols="12" md="8">
        <p class="text-body-1">
          This deployment of DyHealthNet is currently restricted to people who have
          been given platform credentials. Enter them below to continue.
        </p>
      </v-col>
    </v-row>
      <v-row class="d-flex align-center justify-center">
      <v-col class="d-flex justify-center">
        <v-divider class="my-2" thickness="2"></v-divider>
      </v-col>
    </v-row>
  </v-container>
  <v-container class="page-container d-flex text-center justify-center mt-4">
    <v-card width="50%" rounded="lg" elevation="1">
      <v-card-title>Login</v-card-title>
      <v-card-text>
        <v-form fast-fail @submit.prevent="login">
          <v-text-field
            variant="outlined"
            density="compact"
            counter="20"
            v-model="loginForm.username"
            :rules="usernameRules"
            label="Username"
          ></v-text-field>

          <v-text-field
            variant="outlined"
            density="compact"
            v-model="loginForm.password"
            :rules="passwordRules"
            type="password"
            label="Password"
          ></v-text-field>
          <v-row class="d-flex align-center justify-center">
            <v-col class="text-center" cols="4">
              <v-btn class="mt-2" color="primary-darken-1" type="submit" block>Submit</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-row>
        <div class="text-center ma-2">
          <v-snackbar
              v-model="taskStarted"
              :color="taskType"
              :timeout="timeout * 2"
          >
            <v-icon class="my-0 mr-2">
              mdi-information-outline
            </v-icon>
            {{ taskInfo }}

            <template v-slot:actions>
              <v-btn
                  variant="text"
                  @click="taskStarted = false"
              >
                Close
              </v-btn>
            </template>
          </v-snackbar>
        </div>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import { BASE_URL } from "../components/constants.js";
import router from "@/router.js";
import { getCookie } from '@/components/authentication/auth.js';

export default {
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      usernameRules: [
        v => !!v || "A Username is required",
      ],
      passwordRules: [
        v => !!v || "Password is required",
      ],
      taskStarted: false,
      taskInfo: "",
      taskType: "",
      timeout: 5000,
    };
  },
  methods: {
    async login() {
      try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch(`${BASE_URL}/platform-auth/api/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify(this.loginForm)
        });
        const data = await response.json();
        if (data.status === 'success') {
          const redirect = this.$route.query.redirect;
          if (redirect) {
            await router.push(redirect);
          } else {
            await router.push({ name: 'Home' });
          }
        } else {
          this.taskStarted = true;
          this.taskInfo = "Username or password incorrect.";
          this.taskType = "error";
          this.loginForm.password = "";
        }
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    },
  },
};
</script>

<style scoped>
.title {
  font-size: 2rem;
}
</style>
