<template>
  <div class="admin-reminders-page">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h2 class="mb-1">Overdue Reminders</h2>
        <p class="text-muted mb-0">
          Generate simulated reminder messages for overdue borrow records.
        </p>
      </div>

      <div class="d-flex gap-2">
        <router-link class="btn btn-outline-secondary" to="/admin/dashboard">
          Dashboard
        </router-link>

        <button class="btn btn-outline-primary" @click="loadReminders" :disabled="loading">
          {{ loading ? "Loading..." : "Generate List" }}
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

      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="mb-3">Simulated Email Content</h5>

          <div v-if="loading" class="text-center py-4">
            Loading overdue reminders...
          </div>

          <div v-else-if="reminders.length === 0" class="text-center text-muted py-4">
            No overdue reminders found.
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Book</th>
                  <th>Due Date</th>
                  <th>Overdue Days</th>
                  <th>Fine</th>
                  <th>Message</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(reminder, index) in reminders" :key="index">
                  <td>{{ reminder.userName }}</td>
                  <td>{{ reminder.userEmail || "N/A" }}</td>
                  <td>{{ reminder.bookTitle }}</td>
                  <td>{{ formatDate(reminder.dueDate) }}</td>
                  <td>{{ reminder.overdueDays || 0 }}</td>
                  <td>{{ formatFine(reminder.fineAmount) }}</td>
                  <td class="reminder-message">{{ reminder.message }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";
import { getUser } from "../../router/checkToken";

export default {
  data() {
    return {
      reminders: [],
      loading: false,
      message: "",
      isError: false,
      user: null,
    };
  },

  computed: {
    adminPermission() {
      return this.user && Number(this.user.role) === 1;
    },
  },

  mounted() {
    this.user = getUser();

    if (this.adminPermission) {
      this.loadReminders();
    }
  },

  methods: {
    async loadReminders() {
      this.loading = true;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.get("/admin/reminders/overdue");
        this.reminders = res.data.data || [];
        this.message = res.data.message;
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Cannot load overdue reminders";
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
      });
    },

    formatFine(value) {
      return `${Number(value || 0).toLocaleString("en-US")} VND`;
    },
  },
};
</script>

<style scoped>
.admin-reminders-page {
  animation: fadeIn 0.25s ease;
}

.reminder-message {
  min-width: 320px;
  color: #374151;
  font-weight: 600;
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
</style>
