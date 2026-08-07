import { BASE_URL } from "../constants.js";

// Platform-wide login (in-app replacement for the browser's native Basic-Auth
// popup, see network/middleware.py::PlatformBasicAuthMiddleware on the backend).
// Kept separate from auth.js so this whole feature can be deleted as a unit.
export async function checkPlatformAuth() {
  try {
    const response = await fetch(`${BASE_URL}/platform-auth/api/checkstatus/`, {
      method: 'GET',
      credentials: 'include',
    });
    const result = await response.json();
    return { enabled: result.platform_auth_enabled, isAuthenticated: result.is_authenticated };
  } catch (error) {
    console.error('Error checking platform auth status:', error);
    // Fail closed: if the check itself is unreachable, treat the gate as enabled
    // and unauthenticated so the user lands on the platform-login page.
    return { enabled: true, isAuthenticated: false };
  }
}
