<template>
  <div class="admin-users-page">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h2 class="mb-1">Admin - User Management</h2>
        <p class="text-muted mb-0">
          View accounts and update editable user roles.
        </p>
      </div>

      <div class="d-flex gap-2">
        <router-link class="btn btn-outline-secondary" to="/admin/books">
          Manage Books
        </router-link>

        <button class="btn btn-outline-primary" @click="loadUsers" :disabled="loading">
          {{ loading ? "Loading..." : "Reload" }}
        </button>
      </div>
    </div>

    <div v-if="!adminPermission" class="alert alert-danger">
      You do not have permission to access this page.
    </div>

    <div v-else>
      <div v-if="message" class="alert" :class="isError ? 'alert-danger' : 'alert-success'">
        {{ message }}
      </div>

      <div class="user-stats mb-4">
        <div class="stat-card">
          <span>Total Users</span>
          <strong>{{ users.length }}</strong>
        </div>

        <div class="stat-card">
          <span>Protected Accounts</span>
          <strong>{{ adminCount }}</strong>
        </div>

        <div class="stat-card">
          <span>Editable Accounts</span>
          <strong>{{ editableCount }}</strong>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="mb-3">User List</h5>

          <div v-if="loading" class="text-center py-4">
            Loading users...
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="account in users" :key="account.id">
                  <td>
                    <span class="user-id">#{{ account.id }}</span>
                  </td>

                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">
                        {{ getInitials(account) }}
                      </div>

                      <strong>{{ account.name || "N/A" }}</strong>
                    </div>
                  </td>

                  <td>{{ account.email || "N/A" }}</td>

                  <td>
                    <span v-if="isAdminAccount(account)" class="protected-badge">
                      Protected account
                    </span>

                    <select
                      v-else
                      v-model.number="draftRoles[account.id]"
                      class="form-select role-select"
                    >
                      <option
                        v-for="role in editableRoles"
                        :key="role.value"
                        :value="role.value"
                      >
                        {{ role.label }}
                      </option>
                    </select>
                  </td>

                  <td>{{ formatDate(account.createdAt) }}</td>

                  <td class="text-end">
                    <span v-if="isAdminAccount(account)" class="text-muted fw-bold">
                      Role locked
                    </span>

                    <button
                      v-else
                      class="btn btn-sm btn-success"
                      :disabled="savingUserId === account.id || !hasRoleChanged(account)"
                      @click="updateRole(account)"
                    >
                      {{ savingUserId === account.id ? "Saving..." : "Save Role" }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="users.length === 0" class="text-center text-muted py-4">
              No users found.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";
import { getRoleName, getUser } from "../../router/checkToken";

const ROLE_ADMIN = 1;
const ROLE_USER = 2;

export default {
  data() {
    return {
      users: [],
      draftRoles: {},
      loading: false,
      savingUserId: null,
      message: "",
      isError: false,
      user: null,
    };
  },

  computed: {
    adminPermission() {
      return this.user && Number(this.user.role) === ROLE_ADMIN;
    },

    adminCount() {
      return this.users.filter((account) => this.isAdminAccount(account)).length;
    },

    editableCount() {
      return this.users.filter((account) => !this.isAdminAccount(account)).length;
    },

    editableRoles() {
      const roles = new Set([ROLE_USER]);

      this.users.forEach((account) => {
        const role = Number(account.role);

        if (Number.isInteger(role) && role > 0 && role !== ROLE_ADMIN) {
          roles.add(role);
        }
      });

      return Array.from(roles)
        .sort((firstRole, secondRole) => firstRole - secondRole)
        .map((role) => ({
          value: role,
          label: this.getEditableRoleLabel(role),
        }));
    },
  },

  mounted() {
    this.user = getUser();

    if (this.adminPermission) {
      this.loadUsers();
    }
  },

  methods: {
    async loadUsers() {
      this.loading = true;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.get("/admin/users");
        this.users = res.data.data || [];
        this.draftRoles = this.users.reduce((drafts, account) => {
          drafts[account.id] = Number(account.role);
          return drafts;
        }, {});
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Cannot load users";
      } finally {
        this.loading = false;
      }
    },

    async updateRole(account) {
      if (this.isAdminAccount(account)) {
        return;
      }

      this.savingUserId = account.id;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.patch(`/admin/users/${account.id}/role`, {
          role: this.draftRoles[account.id],
        });

        this.message = res.data.message || "Update user role successfully";

        const selectedUser = this.users.find((item) => item.id === account.id);

        if (selectedUser) {
          selectedUser.role = Number(res.data.data.role);
          this.draftRoles[account.id] = Number(res.data.data.role);
        }
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Update user role failed";
      } finally {
        this.savingUserId = null;
      }
    },

    isAdminAccount(account) {
      return Number(account.role) === ROLE_ADMIN;
    },

    hasRoleChanged(account) {
      return Number(this.draftRoles[account.id]) !== Number(account.role);
    },

    getEditableRoleLabel(role) {
      const roleName = getRoleName(role);
      return roleName === "UNKNOWN" ? `ROLE ${role}` : roleName;
    },

    formatDate(value) {
      if (!value) return "N/A";

      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    },

    getInitials(account) {
      const name = account.name || account.email || "User";
      return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
    },
  },
};
</script>

<style scoped>
.admin-users-page {
  animation: fadeIn 0.25s ease;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.stat-card {
  min-height: 112px;
  padding: 22px;
  border-radius: 22px;
  background: white;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}

.stat-card span {
  display: block;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-card strong {
  display: block;
  color: #111827;
  font-size: 34px;
  font-weight: 900;
}

.user-id {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  font-weight: 900;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(180deg, #b71c1c, #7f1d1d);
  color: white;
  font-weight: 900;
}

.protected-badge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 7px 13px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  font-weight: 900;
}

.role-select {
  width: 160px;
  border-radius: 999px;
  font-weight: 800;
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

@media (max-width: 800px) {
  .user-stats {
    grid-template-columns: 1fr;
  }
}
</style>
