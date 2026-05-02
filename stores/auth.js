import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    loginError: null,
    isInitialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    async login(credentials, remember) {
      this.isLoading = true;

      try {
        const config = useRuntimeConfig();
        const res = await $fetch(`${config.public.apiBase}/auth/login`, {
          method: "POST",
          body: credentials,
        });
        this.loginError = null;
        this.setAuth(res.data, true);
      } catch (error) {
        if (error.status === 401) {
          this.loginError = error.data.message || "Invalid email or password";
          return;
        }
        this.loginError =
          error.data.message || "An error occurred during login";
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUser() {
      if (!this.token) return;
      try {
        const config = useRuntimeConfig();
        const user = await $fetch(`${config.public.apiBase}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: this.token ? `Bearer ${this.token}` : "",
          },
        });
        this.user = user?.data ?? user;
      } catch (e) {}
    },

    setAuth(data, remember = false) {
      this.token = data.token;
      const tokenCookie = this.useAuthToken(remember);
      tokenCookie.value = data.token;
      this.user = data.user;
    },

    init() {
      const tokenCookie = useCookie("auth_token");
      if (tokenCookie.value) {
        this.token = tokenCookie.value;
      }
      this.isInitialized = true;
    },

    logout() {
      this.user = null;
      this.token = null;
      const tokenCookie = useCookie("auth_token");
      tokenCookie.value = null;
      navigateTo("/");
    },

    decodeToken() {
      if (!this.token) return null;
      try {
        return jwtDecode(this.token);
      } catch {
        return null;
      }
    },

    useAuthToken(remember = true) {
      if (!remember) {
        return useCookie("auth_token", { sameSite: "lax" });
      } else {
        return useCookie("auth_token", {
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    },
  },
});
