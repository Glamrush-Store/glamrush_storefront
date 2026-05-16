export function useAuth() {
  const authStore = useAuthStore();
  const { request } = useApi();
  const router = useRouter();
  const route = useRoute();

  function getRedirectTarget() {
    const redirect = Array.isArray(route.query.redirect)
      ? route.query.redirect[0]
      : route.query.redirect;

    if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }

    return "/";
  }

  async function register(name, email, password, passwordConfirmation) {
    const res = await request("/auth/register", {
      method: "POST",
      body: {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      },
    });
    if (res?.data?.token) {
      authStore.setAuth(res.data);
      await router.push(getRedirectTarget());
      return { success: true };
    }
    return {
      success: false,
      message: res?.message ?? "Registration failed",
      errors: res?.errors,
    };
  }

  async function login(email, password) {
    const res = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (res?.data?.token) {
      authStore.setAuth(res.data);
      await router.push(getRedirectTarget());
      return { success: true };
    }
    return {
      success: false,
      message: res?.message ?? "Login failed",
      errors: res?.errors,
    };
  }

  async function logout() {
    await request("/auth/logout", { method: "POST" }).catch(() => {});
    authStore.logout();
  }

  async function forgotPassword(email) {
    const res = await request("/auth/password/forgot", {
      method: "POST",
      body: { email },
    });
    return { success: true, message: res?.message };
  }

  async function verifyCode(email, code) {
    const res = await request("/auth/password/verify", {
      method: "POST",
      body: { email, code },
    });
    if (res?.data?.errors) {
      return {
        success: false,
        message: res?.data?.message,
        errors: res?.data?.errors,
      };
    }
    return { success: true, message: res?.message };
  }

  async function resetPassword(email, password, passwordConfirmation) {
    const res = await request("/auth/password/reset", {
      method: "POST",
      body: { email, password, password_confirmation: passwordConfirmation },
    });
    if (res?.errors) {
      return { success: false, message: res?.message, errors: res?.errors };
    }
    return { success: true, message: res?.message };
  }

  return { register, login, logout, forgotPassword, verifyCode, resetPassword };
}
