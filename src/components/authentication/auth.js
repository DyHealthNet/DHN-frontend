import { reactive } from 'vue';

const authState = reactive({
  isLoggedIn: null, // Initially unknown
});

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
export function clearCookies() {
  document.cookie = "csrftoken=; Max-Age=0; path=/;"; // Clear CSRF token
  document.cookie = "sessionid=; Max-Age=0; path=/;"; // Clear session cookie (if used)
  console.log("Cookies cleared!");
}

//TODO adapt or add function that also returns the Username (because backend already send that
// with this API call if logged in and authState already captures boolean auth state)
export async function checkLogin() {
  console.log("\n\ncheckLogin is being called!! \n\n")
  try {
    const response = await fetch(`${BASE_URL}/network/api/checklogin/`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    });
    const result = await response.json()
    console.log("authState.isLoggedIn:",result)
    authState.isLoggedIn = result.is_logged_in;

    return result.is_logged_in; // Return the login status directly
  } catch (error) {
    console.log("fetch did not work")
        console.error('Error submitting form or checking login status:', error);
        authState.isLoggedIn = false; // Default to logged out on error
        return false; // Default to logged out on error
  }
}

export { authState }; // Expose the reactive state for use across components