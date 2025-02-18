<template>
    <v-container class="text-center">
    <v-row class="d-flex align-center justify-center">
      <v-col cols="12">
        <h1 class="title mt-4">Sign in</h1>
      </v-col>
    </v-row>
      <v-row class="d-flex align-center justify-center">
      <v-col class="d-flex justify-center">
        <v-divider class="my-2" thickness="2"></v-divider>
      </v-col>
    </v-row>
  </v-container>
  <v-container class="d-flex text-center justify-center mt-4">

    <!-- Tabs -->
    <v-card width="50%" rounded="lg" elevation="1" >
      <v-tabs v-model="activeTab" align-tabs="center" bg-color="primary-darken-1" show-arrows>
        <v-tab v-for="tab in tabs" :key="tab.value" :text="tab.name" :value="tab.value"></v-tab>
      </v-tabs>

    <!-- Tabs Content -->
    <v-tabs-window v-model="activeTab">
      <v-window-item :value="0">
        <v-card class="pa-4">
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
              <v-row class="d-flex align-center justify-center" >
                <v-col class="text-center" cols="4">
                  <v-btn class="mt-2" color="primary-darken-1" type="submit" block>Submit</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Sign Up Tab -->
      <v-window-item :value="1">
        <v-card class="pa-4">
          <v-card-title>Sign Up</v-card-title>
          <v-card-text>
            <v-form fast-fail @submit.prevent="signup">
              <v-text-field
                variant="outlined"
                density="compact"
                counter="20"
                v-model="signupForm.username"
                :rules="usernameRules"
                label="Username"
              ></v-text-field>

              <!--<v-text-field
                variant="outlined"
                density="compact"
                counter="20"
                v-model="signupForm.email"
                :rules="[required]"
                label="Email"
                clearable
              ></v-text-field> -->

              <v-text-field
                variant="outlined"
                density="compact"
                v-model="signupForm.password"
                :rules="passwordRules"
                type="password"
                label="Password"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                density="compact"
                v-model="signupForm.confirmPassword"
                :rules="passwordRules"
                type="password"
                label="Confirm Password"
              ></v-text-field>

              <v-row class="d-flex align-center justify-center" >
                <v-col class="text-center" cols="4">
                  <v-btn class="mt-2" color="primary-darken-1" type="submit" block>Submit</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-tabs-window>
    <v-row class="d-flex align-center justify-center" >
      <v-col class="text-center" cols="8">
        <v-divider class="my-9" thickness="2">Or</v-divider>
      </v-col>
    </v-row>
    <v-row class="d-flex align-center justify-center" >
      <v-col class="text-center" cols="5">
        <v-btn size="large" class="align-center justify-center mb-3" color="orcid_button" @click="loginWithORCID">
          <svg-icon type="mdi" :path="pathORCID" class="mr-2"></svg-icon>ORCID
        </v-btn>
      </v-col>
      <v-col class="text-center" cols="5">
        <v-btn size="large" class="align-center justify-center mb-3" color="github_button" @click="loginWithGitHub">
          <svg-icon type="mdi" :path="pathGitHub" class="mr-2"></svg-icon>GitHub
        </v-btn>
      </v-col>
    </v-row>
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
          <v-progress-linear
            :model-value="progress"
            height="4"
            absolute
            style="bottom: 0"
          ></v-progress-linear>
        </v-snackbar>
      </div>
    </v-row>
    </v-card>
  </v-container>
</template>

<script>
import {BASE_URL} from "../components/constants.js";
import router from "@/router.js";
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiGithub } from '@mdi/js';
import { mdiIdentifier } from '@mdi/js';
import {authState, checkLogin, getCookie} from '@/components/authentication/auth.js';

export default {
  components: {
		SvgIcon
	},
  data() {
    return {
      activeTab: 0,
      tabs: [
        { name: "Login", value: 0 },
        { name: "Sign Up", value: 1 },
      ],
      loginForm: {
        username: '',
        password: ''
      },
      signupForm: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      usernameRules: [
        v => !!v || "A Username is required",
        v => (v && v.length <= 20) || "Username must be less than 20 characters"
      ],
      passwordRules: [
        v => !!v || "Password is required",
        v => (v && v.length > 8) || "Password must be more than eight characters"
      ],
      secPasswordCheckRules: [
        (v) => !!v || "Confirm Password is required.",
        (v) =>
          v === this.signupForm.password || "Passwords do not match.", // Compare passwords
      ],
      taskStarted: false,
      taskInfo: "",
      taskType: "",
      pathORCID: mdiIdentifier,
      pathGitHub: mdiGithub,

      progress: 100,
      timeout: 5000,
    };
  },
  mounted() {
    // Initial check for query parameters when the component is first mounted
    this.checkLoginRedirect();
  },
  watch: {
  '$route.query': {
    handler(newQuery) {
      // Watch for query parameter changes
      console.log("Query changed:", newQuery);
      this.checkLoginRedirect(newQuery);
    },
    immediate: true, // Run immediately on initialization
  },
  taskStarted(value) {
    if (value) {
      this.startProgress();
    } else {
      this.stopProgress();
    }
  },

},
  methods: {
    checkLoginRedirect() {
      const message = this.$route.query.message;

      if (message === "login_required" && !this.taskStarted) {
        this.taskInfo = "Access to the requested page is restricted to logged-in users. Please log in to continue.";
        this.taskStarted = true;
        this.taskType = "info";
        this.startProgress()
      }
    },
    async login() {
      try {
        const csrfToken = getCookie('csrftoken'); // Get the CSRF token from cookies
        console.log(csrfToken)
        // send login data and fetch response
        await fetch(`${BASE_URL}/auth/api/login/`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken // Include the CSRF token in the request header
      },
        credentials: 'include',  // This ensures cookies (like the session cookie) are sent with the request
        body: JSON.stringify(this.loginForm)
      }).then(response => response.json())
          .then(async data => {
            // Check the response to determine success
            if (data.status === 'success') {
              console.log('Logged IN successfully')
              // update authState directly or more secure query the backend for it
              // (actually not even necessary as redirection to login restricted page should ensure another checkLogin call)
              //authState.isLoggedIn = true;
              await checkLogin();
              // Redirect to the desired route if login is successful
              await router.push({name: 'Context creation'});
            } else {
                this.taskStarted = true;
                this.taskInfo = "Username or password incorrect.";
                this.taskType = "error";

                // Reset password field
                this.loginForm.password = "";
              //alert(data.message);  // Show error message if login failed
            }
          })
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    },
    async signup() {
      try {
        const csrfToken = getCookie('csrftoken'); // Get the CSRF token from cookies
        console.log(csrfToken)
        // send login data and fetch response
        await fetch(`${BASE_URL}/auth/api/register/`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken // Include the CSRF token in the request header
      },
        credentials: 'include',  // This ensures cookies (like the session cookie) are sent with the request
        body: JSON.stringify(this.signupForm)
      }).then(response => response.json())
          .then(async data => {
            // Check the response to determine success
            if (data.status === 'success') {
              // Redirect to the desired route if login is successful
              await router.push({name: 'Context creation'});
            } else {
                this.taskStarted = true;
                this.taskInfo = "Username not allowed or password inputs do not match.";
                this.taskType = "error";

                // Reset password field
                this.signupForm.password = "";
                this.signupForm.confirmPassword = "";
              //alert(data.message);  // Show error message if login failed
            }
          })
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    },
    async loginWithORCID() {
      window.location.href = `${BASE_URL}/auth/api/orcid/login/`;
    },
    async loginWithGitHub() {
      let loginUrl = `${BASE_URL}/auth/api/github/login/`;
      const redirect_url = this.$route.query.redirect
      console.log("redirect_url", redirect_url)
      if (redirect_url) {
        const fullredirection = `${window.location.protocol}//${window.location.host}${redirect_url}`;
        loginUrl += `?next=${encodeURIComponent(fullredirection)}`;
      }
      console.log("loginUrl", loginUrl)
      window.location.href = loginUrl;
    },

    startProgress() {
      console.log("Starting progress");
      const interval = 50; // Update interval in milliseconds
      const decrement = (interval / this.timeout) * 100;
      this.progress = 100;

      this.progressTimer = setInterval(() => {
        this.progress -= decrement;
        if (this.progress <= 0) {
          this.stopProgress();
          this.taskStarted = false; // Ensure snackbar is dismissed
        }
      }, interval);
    },

    stopProgress() {
      clearInterval(this.progressTimer); // Clean up the interval
      this.progress = 100; // Reset progress
    },
  },
};
</script>

<style scoped>
.title {
  font-size: 2rem;
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