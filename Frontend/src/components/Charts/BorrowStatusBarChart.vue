<template>
  <section class="chart-card" aria-labelledby="borrow-status-chart-title">
    <div class="chart-card-header">
      <div>
        <h3 id="borrow-status-chart-title">Borrow Status</h3>
        <p>Active, returned, and overdue borrow records.</p>
      </div>
    </div>

    <div v-if="canRenderChart" class="chart-wrapper">
      <Bar
        :data="chartData"
        :options="chartOptions"
        aria-label="Borrow status distribution chart"
        role="img"
      />
      <p class="visually-hidden">
        Active Borrows: {{ activeValue }}, Returned Borrows: {{ returnedValue }},
        Overdue Borrows: {{ overdueValue }}.
      </p>
    </div>

    <p v-else class="chart-fallback">
      Borrow status chart cannot be rendered with the current dashboard data.
    </p>
  </section>
</template>

<script>
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
  name: "BorrowStatusBarChart",

  components: {
    Bar,
  },

  props: {
    activeBorrows: {
      type: Number,
      default: 0,
    },
    returnedBorrows: {
      type: Number,
      default: 0,
    },
    overdueBorrows: {
      type: Number,
      default: 0,
    },
  },

  computed: {
    activeValue() {
      return this.toNumber(this.activeBorrows);
    },

    returnedValue() {
      return this.toNumber(this.returnedBorrows);
    },

    overdueValue() {
      return this.toNumber(this.overdueBorrows);
    },

    canRenderChart() {
      return [this.activeValue, this.returnedValue, this.overdueValue].every(Number.isFinite);
    },

    chartData() {
      return {
        labels: ["Active Borrows", "Returned Borrows", "Overdue Borrows"],
        datasets: [
          {
            label: "Borrow Records",
            data: [this.activeValue, this.returnedValue, this.overdueValue],
            backgroundColor: ["#2563eb", "#16a34a", "#dc2626"],
            borderColor: ["#1d4ed8", "#15803d", "#b91c1c"],
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      };
    },

    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
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

.chart-fallback {
  padding: 24px;
  border-radius: 8px;
  background: #f9fafb;
}
</style>
