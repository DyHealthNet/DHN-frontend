const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `${window.location.protocol}//${window.location.host}`;

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

//TODO adapt or add function that also returns the Username (because backend already send that with this API call if logged in)
export async function checkLogin() {
  try {
    const response = await fetch(`${BASE_URL}/network/api/checklogin/`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    });
    console.log("fetch worked")
    const test = await response.json()
    console.log("response:",test)

    return test.is_logged_in; // Return the login status directly
  } catch (error) {
    console.log("fetch did not work")
        console.error('Error submitting form or checking login status:', error);
        return False; // Default to logged out on error
  }
    return False; // Default to logged out on error
}