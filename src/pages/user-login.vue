<template>
    <v-container class="text-center">
    <v-row>
      <v-col cols="12">
        <h1 class="title mt-4">Sign in</h1>
      </v-col>
    </v-row>
      <v-row>
      <v-col class="d-flex justify-center">
        <v-divider class="my-2" thickness="2"></v-divider>
      </v-col>
    </v-row>
  </v-container>
  <v-container class="d-flex align-center justify-center fill-height" >
    <v-row class="d-flex align-center justify-center">
      <v-col cols="3">
        <v-card>
          <v-card-text>
            <v-form fast-fail @submit.prevent="login">
              <v-text-field
                variant="outlined"
                density="compact"
                counter="20"
                v-model="formData.username"
                :rules="usernameRules"
                label="Username"
              ></v-text-field>

              <!--<v-text-field
                variant="outlined"
                density="compact"
                counter="20"
                v-model="email"
                :rules="[required]"
                label="Email"
                clearable
              ></v-text-field> -->

              <v-text-field
                variant="outlined"
                density="compact"
                v-model="formData.password"
                :rules="passwordRules"
                type="password"
                label="Password"
              ></v-text-field>

              <v-btn class="mt-2" type="submit" block>Submit</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="d-flex align-center justify-center" style="width: 100%;">
      <v-col class="text-center" cols="3">
        <v-divider class="my-9" thickness="2"></v-divider>
        <v-btn size="large" class="align-center justify-center" color="success">ORCID</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <div class="text-center ma-2">
        <v-snackbar
            v-model="taskStarted"
            :color="taskType"
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
  </v-container>
</template>

<script>
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;
import router from "@/router.js";
import axios from "axios";

export default {
  data() {
    return {
      formData: {
        username: '',
        password: ''
      },
      usernameRules: [
        v => !!v || "A Username is required",
        v => (v && v.length <= 20) || "Username must be less than 20 characters"
      ],
      passwordRules: [
        v => !!v || "Password is required",
        v => (v && v.length > 8) || "Password must be more than eight characters"
      ],
      taskStarted: false,
      taskInfo: "",
      taskType: "",
    };
  },
  methods: {
    async login() {
      try {
        const csrfToken = this.getCookie("csrftoken"); // Get the CSRF token from cookies
        console.log(csrfToken)
        // send login data and fetch response
        await fetch(`${BASE_URL}/network/api/login/`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken // Include the CSRF token in the request header
      },
        credentials: 'include',  // This ensures cookies (like the session cookie) are sent with the request
        body: JSON.stringify(this.formData)
      }).then(response => response.json())
          .then(async data => {
            // Check the response to determine success
            if (data.status === 'success') {
              // Redirect to the desired route if login is successful
              await router.push({name: 'Context creation'});  // Replace 'home' with the name of your target route
            } else {
                this.taskStarted = true;
                this.taskInfo = "Username or password incorrect.";
                this.taskType = "error";

                // Reset password field
                this.formData.password = "";
              //alert(data.message);  // Show error message if login failed
            }
          })
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    },
    // Helper function to get cookies
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
  },
};
</script>

<style scoped>
.title {
  font-weight: bold;
}

.divider {
  width: 10%;
  margin-top: 16px;
  margin-bottom: 16px;
}

.outlined-card {
  width: 80%;
  border-radius: 10px;
}
</style>