<template>
  <section class="chart-card" aria-labelledby="library-summary-chart-title">
    <div class="chart-card-header">
      <div>
        <h3 id="library-summary-chart-title">Library Summary</h3>
        <p>Users, titles, copies, and borrow records.</p>
      </div>
    </div>

    <div v-if="canRenderChart" class="chart-wrapper chart-wrapper-doughnut">
      <Doughnut
        :data="chartData"
        :options="chartOptions"
        aria-label="Library summary doughnut chart"
        role="img"
      />
      <p class="visually-hidden">
        Total Users: {{ totalUsersValue }}, Book Titles: {{ totalBooksValue }},
        Book Copies: {{ totalBookQuantityValue }}, Borrow Records:
        {{ totalBorrowRecordsValue }}.
      </p>
    </div>

    <p v-else class="chart-fallback">
      Library summary chart cannot be rendered with the current dashboard data.
    </p>
  </section>
</template>

<script>
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

export default {
  name: "LibrarySummaryDoughnutChart",

  components: {
    Doughnut,
  },

  props: {
    totalUsers: {
      type: Number,
      default: 0,
    },
    totalBooks: {
      type: Number,
      default: 0,
    },
    totalBookQuantity: {
      type: Number,
      default: 0,
    },
    totalBorrowRecords: {
      type: Number,
      default: 0,
    },
  },

  computed: {
    totalUsersValue() {
      return this.toNumber(this.totalUsers);
    },

    totalBooksValue() {
      return this.toNumber(this.totalBooks);
    },

    totalBookQuantityValue() {
      return this.toNumber(this.totalBookQuantity);
    },

    totalBorrowRecordsValue() {
      return this.toNumber(this.totalBorrowRecords);
    },

    canRenderChart() {
      return [
        this.totalUsersValue,
        this.totalBooksValue,
        this.totalBookQuantityValue,
        this.totalBorrowRecordsValue,
      ].every(Number.isFinite);
    },

    chartData() {
      return {
        labels: ["Total Users", "Book Titles", "Book Copies", "Borrow Records"],
        datasets: [
          {
            data: [
              this.totalUsersValue,
              this.totalBooksValue,
              this.totalBookQuantityValue,
              this.totalBorrowRecordsValue,
            ],
            backgroundColor: ["#0f766e", "#2563eb", "#f59e0b", "#7c3aed"],
            borderColor: "#ffffff",
            borderWidth: 3,
          },
        ],
      };
    },

    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              padding: 14,
            },
          },
          title: {
            display: false,
          },
        },
      };
    },
  },

  methods: {
    toNumber(value) {
      return Number(value || 0);
    },
  },
};
</script>

<style scoped>
.chart-card {
  min-height: 360px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.chart-card h3 {
  margin: 0 0 4px;
  color: #111827;
  font-size: 17px;
  font-weight: 900;
}

.chart-card p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.chart-wrapper {
  position: relative;
  height: 270px;
}

.chart-wrapper-doughnut {
  max-width: 460px;
  margin: 0 auto;
}

.chart-fallback {
  padding: 24px;
  border-radius: 8px;
  background: #f9fafb;
}
</style>
