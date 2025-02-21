# DyHealthNet Frontend Repository

Frontend is developed with Vue 3 in Vite.

## Project Setup
1. Install Node.js: https://nodejs.org/en
3. Install Vue
4. Install Vite
5. Install Vuetify
6. Install Router

  ```sh
  npm install vite
  npm install vuetify
  npm install router
  npm install vis-network
  npm install axios
  ```

### Compile and Hot-Reload for Development

```sh
npm install 
npm run dev
```

### Adjusting the Backend URL
The backend URL is set in the .env file via the `VITE_BACKEND_URL`. Change the URL to the backend server and make sure the backend server is 
properly called. Don't mix 127.0.0.1 with localhost if you want to save yourself from hours of debugging.
