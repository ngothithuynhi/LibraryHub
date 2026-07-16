<template>
  <div class="admin-dashboard-page">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h2 class="mb-1">Admin Dashboard</h2>
        <p class="text-muted mb-0">
          Review LibraryHub activity and overdue fine estimates.
        </p>
      </div>

      <div class="d-flex gap-2">
        <router-link class="btn btn-outline-warning" to="/admin/reminders">
          Overdue Reminders
        </router-link>

        <button class="btn btn-outline-primary" @click="loadStats" :disabled="loading">
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

      <div v-if="loading && !stats" class="text-center py-5">
        Loading dashboard statistics...
      </div>

      <div v-else-if="!stats" class="dashboard-empty-state">
        Dashboard statistics are unavailable. Please reload to try again.
      </div>

      <div v-else class="dashboard-content">
        <div class="stats-grid">
          <div v-for="item in statCards" :key="item.key" class="stat-card">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>

        <section class="charts-section" aria-label="Dashboard charts">
          <div class="charts-grid">
            <BorrowStatusBarChart
              :active-borrows="dashboardStats.activeBorrowRecords"
              :returned-borrows="dashboardStats.returnedBorrowRecords"
              :overdue-borrows="dashboardStats.overdueBorrowRecords"
            />

            <LibrarySummaryDoughnutChart
              :total-users="dashboardStats.totalUsers"
              :total-books="dashboardStats.totalBooks"
              :total-book-quantity="dashboardStats.totalBookQuantity"
              :total-borrow-records="dashboardStats.totalBorrowRecords"
            />
          </div>

          <FineOverviewBarChart
            :estimated-total-fine="dashboardStats.estimatedTotalFine"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";
import { getUser } from "../../router/checkToken";
import BorrowStatusBarChart from "../Charts/BorrowStatusBarChart.vue";
import FineOverviewBarChart from "../Charts/FineOverviewBarChart.vue";
import LibrarySummaryDoughnutChart from "../Charts/LibrarySummaryDoughnutChart.vue";

export default {
  components: {
    BorrowStatusBarChart,
    FineOverviewBarChart,
    LibrarySummaryDoughnutChart,
  },

  data() {
    return {
      stats: null,
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

    dashboardStats() {
      const stats = this.stats || {};

      return {
        totalUsers: this.toNumber(stats.totalUsers),
        totalBooks: this.toNumber(stats.totalBooks),
        totalBookQuantity: this.toNumber(stats.totalBookQuantity),
        totalBorrowRecords: this.toNumber(stats.totalBorrowRecords),
        activeBorrowRecords: this.toNumber(stats.activeBorrowRecords),
        returnedBorrowRecords: this.toNumber(stats.returnedBorrowRecords),
        overdueBorrowRecords: this.toNumber(stats.overdueBorrowRecords),
        estimatedTotalFine: this.toNumber(stats.estimatedTotalFine),
      };
    },

    statCards() {
      const stats = this.dashboardStats;

      return [
        { key: "totalUsers", label: "Total Users", value: stats.totalUsers },
        { key: "totalBooks", label: "Book Titles", value: stats.totalBooks },
        {
          key: "totalBookQuantity",
          label: "Book Copies",
          value: stats.totalBookQuantity,
        },
        {
          key: "totalBorrowRecords",
          label: "Borrow Records",
          value: stats.totalBorrowRecords,
        },
        {
          key: "activeBorrowRecords",
          label: "Active Borrows",
          value: stats.activeBorrowRecords,
        },
        {
          key: "returnedBorrowRecords",
          label: "Returned Borrows",
          value: stats.returnedBorrowRecords,
        },
        {
          key: "overdueBorrowRecords",
          label: "Overdue Borrows",
          value: stats.overdueBorrowRecords,
        },
        {
          key: "estimatedTotalFine",
          label: "Estimated Fine",
          value: this.formatFine(stats.estimatedTotalFine),
        },
      ];
    },
  },

  mounted() {
    this.user = getUser();

    if (this.adminPermission) {
      this.loadStats();
    }
  },

  methods: {
    async loadStats() {
      this.loading = true;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.get("/admin/dashboard/stats");
        this.stats = res.data.data || {};
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Cannot load dashboard statistics";
      } finally {
        this.loading = false;
      }
    },

    formatFine(value) {
      return `${Number(value || 0).toLocaleString("en-US")} VND`;
    },

    toNumber(value) {
      return Number(value || 0);
    },
  },
};
</script>

<style scoped>
.admin-dashboard-page {
  animation: fadeIn 0.25s ease;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  min-height: 92px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
}

.stat-card strong {
  display: block;
  color: #111827;
  font-size: 24px;
  font-weight: 900;
  line-height: 1.2;
}

.dashboard-content {
  display: grid;
  gap: 22px;
}

.dashboard-empty-state {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #6b7280;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}

.charts-section {
  display: grid;
  gap: 22px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
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

@media (max-width: 1050px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
