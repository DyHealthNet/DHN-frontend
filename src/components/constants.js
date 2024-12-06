const BASE_URL =
    import.meta.env.VITE_BACKEND_URL ||
    `${window.location.protocol}//${window.location.host}`;

export { BASE_URL };