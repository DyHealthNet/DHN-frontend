<template>
    <v-container class="text-center">
    <v-row>
      <v-col cols="12">
        <h1 class="title mt-4">You have successfully logged out!</h1>
      </v-col>
    </v-row>
      <v-row>
      <v-col class="d-flex justify-center">
        <v-divider class="my-2" thickness="2"></v-divider>
      </v-col>
    </v-row>
  </v-container>
</template>
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
<script>
import {authState, checkLogin, getCookie} from '@/components/authentication/auth.js';
import router from "@/router.js"; // If you're using a reactive auth state
import {BASE_URL} from "../components/constants.js";


export default {
  async mounted() {
    await this.logout(); // Perform logout when the component is mounted
  },
  methods: {
    async logout() {
      try {
        const csrfToken = getCookie('csrftoken'); // Get the CSRF token from cookies
        console.log(csrfToken)
        const response = await fetch(`${BASE_URL}/auth/api/logout/`, {
          method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken // Include the CSRF token in the request header
        },
        credentials: 'include',
        }).then(response => response.json())
          .then(async data => {
            // Check the response to determine success
            if (data.status === 'success') {
              console.log("Logged out successfully");
              // add checkLogin? (not necessary as logout was successfull and will be checked before accessing restricted site)
              authState.isLoggedIn = false; // Update auth state if you use it
          } else {
          console.error("Logout failed:", response.statusText);
        }
      })
      } catch (error) {
        console.error("Error during logout:", error);
      }
    },
  },
};
</script>
