import { defineStore } from "pinia";

function decodeJwtPayload(token) {
  const [, payload] = token.split(".");
  if (!payload) return null;

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
  const json = decodeURIComponent(
    atob(padded)
      .split("")
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );

  return JSON.parse(json);
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    loginError: null,
    isInitialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
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
        await useCartStore().mergeGuestCart();
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
      } catch (error) {
        const status = error?.statusCode ?? error?.status;
        if (status === 401 || status === 404) {
          this.clearAuthCredentials();
        }
      }
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
      } else {
        this.user = null;
      }
      this.isInitialized = true;
    },

    clearAuthCredentials() {
      this.user = null;
      this.token = null;

      const defaultTokenCookie = useCookie("auth_token");
      defaultTokenCookie.value = null;

      const rootTokenCookie = useCookie("auth_token", { path: "/" });
      rootTokenCookie.value = null;

      $fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    },

    logout() {
      this.clearAuthCredentials();
      navigateTo("/");
    },

    decodeToken() {
      if (!this.token) return null;
      try {
        return decodeJwtPayload(this.token);
      } catch {
        return null;
      }
    },

    useAuthToken(remember = true) {
      if (!remember) {
        return useCookie("auth_token", { sameSite: "lax", path: "/" });
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
