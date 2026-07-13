<template>
  <div class="auth-page">
    <div class="auth-card login-card">
      <div class="auth-left">
        <div class="brand-badge">📚 LibraryHub</div>

        <div>
          <h1>Welcome Back!</h1>
          <p>Sign in to continue borrowing and managing your reading journey.</p>
        </div>
      </div>

      <div class="auth-form">
        <h3>Login</h3>
        <p class="subtitle">Sign in to borrow books from LibraryHub.</p>

        <div v-if="message" class="alert-box" :class="isError ? 'error' : 'success'">
          {{ message }}
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="user@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button class="main-btn" type="submit" :disabled="loading">
            {{ loading ? "Logging in..." : "Login" }}
          </button>
        </form>

        <p class="switch-link">
          Don't have an account?
          <router-link to="/register">Register</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";

export default {
  data() {
    return {
      form: {
        email: "",
        password: "",
      },
      message: "",
      isError: false,
      loading: false,
    };
  },

  methods: {
    async handleLogin() {
      this.loading = true;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.post("/auth/login", this.form);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        this.message = "Login successfully";
        this.$router.push("/books");

        setTimeout(() => {
          window.location.reload();
        }, 300);
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Login failed";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 120px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 36px 16px;
}

.auth-card {
  width: 960px;
  min-height: 560px;
  display: grid;
  grid-template-columns: 43% 57%;
  border-radius: 30px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.auth-left {
  padding: 42px 34px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.22), transparent 28%),
    linear-gradient(145deg, #b71c1c, #7f1d1d 55%, #111827);
}

.brand-badge {
  width: fit-content;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
  font-weight: 900;
}

.auth-left h1 {
  font-size: 44px;
  font-weight: 900;
  margin-bottom: 12px;
}

.auth-left p {
  max-width: 330px;
  font-size: 17px;
  font-weight: 600;
  opacity: 0.92;
  margin: 0;
}

.auth-form {
  padding: 52px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-form h3 {
  color: #b71c1c;
  font-size: 34px;
  font-weight: 900;
  margin-bottom: 6px;
}

.subtitle {
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  color: #374151;
  font-weight: 800;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  height: 48px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  padding: 0 18px;
  outline: none;
  font-weight: 600;
  transition: 0.2s ease;
}

.form-group input:focus {
  border-color: #b71c1c;
  box-shadow: 0 0 0 4px rgba(183, 28, 28, 0.12);
}

.main-btn {
  width: 100%;
  height: 50px;
  margin-top: 8px;
  border: none;
  border-radius: 999px;
  background: #b71c1c;
  color: white;
  font-size: 17px;
  font-weight: 900;
  transition: 0.2s ease;
}

.main-btn:hover:not(:disabled) {
  background: #8f1414;
  transform: translateY(-1px);
}

.main-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.switch-link {
  margin-top: 20px;
  text-align: center;
  color: #6b7280;
  font-weight: 600;
}

.switch-link a {
  color: #b71c1c;
  font-weight: 900;
  text-decoration: none;
}

.switch-link a:hover {
  text-decoration: underline;
}

.alert-box {
  padding: 13px 16px;
  border-radius: 18px;
  margin-bottom: 18px;
  font-weight: 800;
}

.alert-box.success {
  background: #dcfce7;
  color: #166534;
}

.alert-box.error {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 850px) {
  .auth-card {
    grid-template-columns: 1fr;
  }

  .auth-left {
    min-height: 230px;
  }

  .auth-form {
    padding: 36px 26px;
  }

  .auth-left h1 {
    font-size: 36px;
  }
}
</style>