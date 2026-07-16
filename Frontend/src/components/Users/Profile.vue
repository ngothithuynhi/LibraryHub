<template>
  <div class="profile-page">
    <section class="profile-hero">
      <div>
        <span class="eyebrow">Account Profile</span>
        <h1>{{ displayName }}</h1>
        <p>{{ user?.email || "Manage your LibraryHub account information." }}</p>
      </div>

      <div class="profile-avatar">
        {{ userInitials }}
      </div>
    </section>

    <div v-if="message" class="message-box" :class="isError ? 'error' : 'success'">
      {{ message }}
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>

    <template v-else-if="user">
      <section class="profile-layout">
        <div class="profile-panel">
          <div class="panel-header">
            <h2>Personal Information</h2>
            <span class="role-badge">{{ getRoleName(user.role) }}</span>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span>User ID</span>
              <strong>#{{ user.id }}</strong>
            </div>

            <div class="info-item">
              <span>Full Name</span>
              <strong>{{ user.name || "N/A" }}</strong>
            </div>

            <div class="info-item">
              <span>Email</span>
              <strong>{{ user.email || "N/A" }}</strong>
            </div>

            <div class="info-item">
              <span>Role</span>
              <strong>{{ getRoleName(user.role) }}</strong>
            </div>

            <div class="info-item">
              <span>Created At</span>
              <strong>{{ formatDate(user.createdAt) }}</strong>
            </div>

            <div class="info-item">
              <span>Updated At</span>
              <strong>{{ formatDate(user.updatedAt) }}</strong>
            </div>
          </div>
        </div>

        <aside class="quick-actions">
          <h3>Quick Actions</h3>

          <router-link class="action-link primary" to="/my-borrows">
            View Borrow History
          </router-link>

          <router-link class="action-link" to="/books">
            Browse Books
          </router-link>

          <router-link
            v-if="Number(user.role) === 1"
            class="action-link warning"
            to="/admin/books"
          >
            Manage Books
          </router-link>
        </aside>
      </section>
    </template>
  </div>
</template>

<script>
import api from "../../services/api";
import { getRoleName, getToken, getUser, logout } from "../../router/checkToken";

export default {
  data() {
    return {
      user: null,
      loading: false,
      message: "",
      isError: false,
    };
  },

  computed: {
    displayName() {
      return this.user?.name || "My Profile";
    },

    userInitials() {
      const name = this.user?.name || this.user?.email || "User";
      return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
    },
  },

  mounted() {
    const token = getToken();

    if (!token) {
      this.$router.push("/login");
      return;
    }

    this.user = getUser();
    this.loadProfile();
  },

  methods: {
    getRoleName,

    async loadProfile() {
      this.loading = !this.user;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.get("/auth/me");
        this.user = res.data.user;
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
          this.$router.push("/login");
          return;
        }

        this.isError = true;
        this.message = error.response?.data?.message || "Cannot load profile information";
      } finally {
        this.loading = false;
      }
    },

    formatDate(value) {
      if (!value) return "N/A";

      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style scoped>
.profile-page {
  animation: fadeIn 0.25s ease;
}

.profile-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  padding: 34px;
  margin-bottom: 24px;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(183, 28, 28, 0.92), rgba(31, 41, 55, 0.94)),
    url("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1400&auto=format&fit=crop");
  background-size: cover;
  background-position: center;
  color: white;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
}

.eyebrow {
  display: inline-block;
  padding: 7px 14px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-weight: 800;
  font-size: 13px;
}

.profile-hero h1 {
  margin-bottom: 8px;
  font-size: 44px;
  font-weight: 900;
  line-height: 1.08;
}

.profile-hero p {
  margin: 0;
  max-width: 560px;
  font-size: 17px;
  font-weight: 700;
  opacity: 0.9;
}

.profile-avatar {
  width: 112px;
  height: 112px;
  flex: 0 0 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(10px);
  font-size: 38px;
  font-weight: 900;
}

.profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 22px;
  align-items: start;
}

.profile-panel,
.quick-actions,
.loading-state {
  border-radius: 26px;
  background: white;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.profile-panel {
  padding: 26px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h2,
.quick-actions h3 {
  margin: 0;
  color: #111827;
  font-weight: 900;
}

.role-badge {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  background: #fbe9e7;
  color: #b71c1c;
  font-size: 13px;
  font-weight: 900;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.info-item {
  min-height: 104px;
  padding: 18px;
  border-radius: 20px;
  background: #f9fafb;
  border: 1px solid #eef2f7;
}

.info-item span {
  display: block;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-item strong {
  display: block;
  color: #111827;
  font-size: 18px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.quick-actions {
  padding: 24px;
}

.quick-actions h3 {
  margin-bottom: 18px;
  font-size: 20px;
}

.action-link {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  padding: 0 18px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  font-weight: 900;
  transition: 0.2s ease;
}

.action-link:hover {
  background: #e5e7eb;
  color: #111827;
  transform: translateY(-1px);
}

.action-link.primary {
  background: #b71c1c;
  color: white;
}

.action-link.primary:hover {
  background: #8f1414;
  color: white;
}

.action-link.warning {
  background: #f59e0b;
  color: #111827;
}

.action-link.warning:hover {
  background: #d97706;
  color: white;
}

.message-box {
  margin-bottom: 22px;
  padding: 15px 18px;
  border-radius: 18px;
  font-weight: 800;
}

.message-box.success {
  background: #dcfce7;
  color: #166534;
}

.message-box.error {
  background: #fee2e2;
  color: #991b1b;
}

.loading-state {
  min-height: 300px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #6b7280;
  text-align: center;
}

.spinner {
  width: 42px;
  height: 42px;
  border: 4px solid #fee2e2;
  border-top-color: #b71c1c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .profile-hero {
    align-items: flex-start;
  }

  .profile-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .profile-hero {
    flex-direction: column;
  }

  .profile-hero h1 {
    font-size: 34px;
  }

  .profile-avatar {
    width: 92px;
    height: 92px;
    flex-basis: 92px;
    font-size: 32px;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
