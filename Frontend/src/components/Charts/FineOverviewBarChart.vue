<template>
  <section class="chart-card" aria-labelledby="fine-overview-chart-title">
    <div class="chart-card-header">
      <div>
        <h3 id="fine-overview-chart-title">Fine Overview</h3>
        <p>Estimated overdue fine total.</p>
      </div>
    </div>

    <div v-if="canRenderChart" class="chart-wrapper">
      <Bar
        :data="chartData"
        :options="chartOptions"
        aria-label="Estimated total fine overview chart"
        role="img"
      />
      <p v-if="fineValue === 0" class="fine-empty-text">
        No overdue fine currently.
      </p>
      <p class="visually-hidden">
        Estimated Total Fine: {{ formattedFine }}.
      </p>
    </div>

    <p v-else class="chart-fallback">
      Fine overview chart cannot be rendered with the current dashboard data.
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
  name: "FineOverviewBarChart",

  components: {
    Bar,
  },

  props: {
    estimatedTotalFine: {
      type: Number,
      default: 0,
    },
  },

  computed: {
    fineValue() {
      return Number(this.estimatedTotalFine || 0);
    },

    formattedFine() {
      return `${this.fineValue.toLocaleString("en-US")} VND`;
    },

    canRenderChart() {
      return Number.isFinite(this.fineValue);
    },

    chartData() {
      return {
        labels: ["Estimated Total Fine"],
        datasets: [
          {
            label: "Fine (VND)",
            data: [this.fineValue],
            backgroundColor: ["#d97706"],
            borderColor: ["#b45309"],
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
              label: (context) =>
                `${context.dataset.label}: ${Number(context.parsed.y || 0).toLocaleString("en-US")} VND`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: this.fineValue === 0 ? 1 : undefined,
            ticks: {
              callback: (value) => `${Number(value).toLocaleString("en-US")} VND`,
            },
          },
        },
      };
    },
  },
};
</script>

<style scoped>
.chart-card {
  min-height: 340px;
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
  height: 250px;
}

.fine-empty-text {
  margin-top: 12px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.chart-fallback {
  padding: 24px;
  border-radius: 8px;
  background: #f9fafb;
}
</style>
