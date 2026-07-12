<template>
  <div class="borrow-page">
    <section class="borrow-hero">
      <div>
        <span class="eyebrow">Borrow History</span>
        <h1>My Borrowed Books</h1>
        <p>Track your borrowed books and return them when you are done reading.</p>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <strong>{{ records.length }}</strong>
          <span>Total Records</span>
        </div>

        <div class="stat-card">
          <strong>{{ activeBorrows }}</strong>
          <span>Currently Borrowed</span>
        </div>
      </div>
    </section>

    <section class="toolbar-card">
      <div>
        <h5>Borrow Records</h5>
        <p>Review your borrowing activity and return active books.</p>
      </div>

      <button class="reload-btn" @click="loadBorrowHistory({ silent: true })" :disabled="refreshing">
        {{ refreshing ? "Refreshing..." : "Reload" }}
      </button>
    </section>

    <div v-if="message" class="message-box" :class="isError ? 'error' : 'success'">
      {{ message }}
    </div>

    <div v-if="initialLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading borrow history...</p>
    </div>

    <template v-else>
      <div v-if="records.length === 0" class="empty-state">
        <div class="empty-icon">📖</div>
        <h3>No borrow records yet</h3>
        <p>You have not borrowed any books. Go to the book list and borrow your first one.</p>
        <router-link class="go-books-btn" to="/books">
          Browse Books
        </router-link>
      </div>

      <div v-else class="records-card">
        <div class="table-responsive">
          <table class="borrow-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Book</th>
                <th>Author</th>
                <th>Status</th>
                <th>Borrow Date</th>
                <th class="text-end">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="record in records" :key="record.id">
                <td>
                  <span class="record-id">#{{ record.id }}</span>
                </td>

                <td>
                  <div class="book-info">
                    <div class="book-avatar">
                      {{ getBookInitial(getBookTitle(record)) }}
                    </div>

                    <div>
                      <strong>{{ getBookTitle(record) }}</strong>
                      <small>Book ID: {{ record.bookId }}</small>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="author-name">{{ getBookAuthor(record) }}</span>
                </td>

                <td>
                  <span
                    class="status-badge"
                    :class="isReturned(record) ? 'returned' : 'borrowed'"
                  >
                    {{ isReturned(record) ? "Returned" : "Borrowed" }}
                  </span>
                </td>

                <td>
                  <span class="date-text">{{ formatDate(record.createdAt) }}</span>
                </td>

                <td class="text-end">
                  <button
                    class="return-btn"
                    :disabled="isReturned(record) || returningId === record.id"
                    @click="returnBook(record)"
                  >
                    <span v-if="returningId === record.id">Returning...</span>
                    <span v-else-if="isReturned(record)">Done</span>
                    <span v-else>Return</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import api from "../../services/api";

export default {
  data() {
    return {
      records: [],
      initialLoading: false,
      refreshing: false,
      returningId: null,
      message: "",
      isError: false,
    };
  },

  computed: {
    activeBorrows() {
      return this.records.filter((record) => !this.isReturned(record)).length;
    },
  },

  mounted() {
    this.loadBorrowHistory();
  },

  methods: {
    async loadBorrowHistory(options = {}) {
      const silent = options.silent || false;

      if (silent) {
        this.refreshing = true;
      } else {
        this.initialLoading = this.records.length === 0;
      }

      this.message = "";
      this.isError = false;

      try {
        const res = await api.get("/borrow/history");
        this.records = res.data.data || [];
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Cannot load borrow history";
      } finally {
        this.initialLoading = false;
        this.refreshing = false;
      }
    },

    async returnBook(record) {
      this.returningId = record.id;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.post("/borrow/return", {
          borrowRecordId: record.id,
          recordId: record.id,
        });

        this.message = res.data.message || "Return book successfully";

        const selectedRecord = this.records.find((item) => item.id === record.id);

        if (selectedRecord) {
          selectedRecord.status = "returned";
          selectedRecord.returnDate = new Date().toISOString();
        }
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Return failed";
      } finally {
        this.returningId = null;
      }
    },

    getBookTitle(record) {
      return record.Book?.title || record.book?.title || `Book ID: ${record.bookId}`;
    },

    getBookAuthor(record) {
      return record.Book?.author || record.book?.author || "N/A";
    },

    getStatus(record) {
      return record.status || record.tinh_trang || "borrowed";
    },

    isReturned(record) {
      const status = this.getStatus(record).toLowerCase();
      return status === "returned" || status === "đã trả";
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

    getBookInitial(title) {
      if (!title) return "B";
      return title.trim().charAt(0).toUpperCase();
    },
  },
};
</script>

<style scoped>
.borrow-page {
  animation: fadeIn 0.25s ease;
}

.borrow-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: stretch;
  padding: 34px;
  margin-bottom: 24px;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(31, 41, 55, 0.96), rgba(183, 28, 28, 0.88)),
    url("https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=1400&auto=format&fit=crop");
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

.borrow-hero h1 {
  font-size: 44px;
  font-weight: 900;
  margin-bottom: 8px;
  letter-spacing: -1px;
}

.borrow-hero p {
  margin: 0;
  max-width: 560px;
  font-size: 17px;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  gap: 14px;
  align-items: flex-end;
}

.stat-card {
  min-width: 140px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  text-align: center;
}

.stat-card strong {
  display: block;
  font-size: 30px;
  font-weight: 900;
}

.stat-card span {
  font-size: 13px;
  font-weight: 700;
  opacity: 0.9;
}

.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;
  padding: 22px 24px;
  border-radius: 24px;
  background: white;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.toolbar-card h5 {
  margin: 0 0 4px;
  color: #111827;
  font-weight: 900;
}

.toolbar-card p {
  margin: 0;
  color: #6b7280;
  font-weight: 600;
}

.reload-btn,
.go-books-btn,
.return-btn {
  border: none;
  text-decoration: none;
  font-weight: 900;
  transition: 0.2s ease;
}

.reload-btn,
.go-books-btn {
  min-height: 46px;
  padding: 0 22px;
  border-radius: 999px;
  background: #fbe9e7;
  color: #b71c1c;
}

.reload-btn:hover,
.go-books-btn:hover {
  background: #b71c1c;
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

.loading-state,
.empty-state {
  min-height: 300px;
  padding: 40px;
  border-radius: 26px;
  background: white;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #6b7280;
  text-align: center;
}

.empty-icon {
  font-size: 52px;
  margin-bottom: 10px;
}

.empty-state h3 {
  color: #111827;
  font-weight: 900;
}

.empty-state p {
  max-width: 420px;
  margin-bottom: 18px;
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

.records-card {
  overflow: hidden;
  border-radius: 26px;
  background: white;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.09);
}

.borrow-table {
  width: 100%;
  border-collapse: collapse;
}

.borrow-table thead {
  background: #f9fafb;
}

.borrow-table th {
  padding: 18px 22px;
  color: #6b7280;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 900;
  border-bottom: 1px solid #e5e7eb;
}

.borrow-table td {
  padding: 18px 22px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.borrow-table tbody tr {
  transition: 0.18s ease;
}

.borrow-table tbody tr:hover {
  background: #fff7f6;
}

.record-id {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-weight: 900;
  font-size: 13px;
}

.book-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.book-avatar {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(180deg, #b71c1c, #7f1d1d);
  color: white;
  font-size: 22px;
  font-weight: 900;
}

.book-info strong {
  display: block;
  color: #111827;
  font-weight: 900;
}

.book-info small {
  display: block;
  color: #6b7280;
  font-weight: 700;
}

.author-name,
.date-text {
  color: #4b5563;
  font-weight: 700;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status-badge.borrowed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.returned {
  background: #e5e7eb;
  color: #374151;
}

.return-btn {
  min-height: 38px;
  padding: 0 18px;
  border-radius: 999px;
  background: #f59e0b;
  color: #111827;
}

.return-btn:hover:not(:disabled) {
  background: #d97706;
  color: white;
  transform: translateY(-1px);
}

.return-btn:disabled {
  background: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
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
  .borrow-hero,
  .toolbar-card {
    flex-direction: column;
    align-items: stretch;
  }

  .borrow-hero h1 {
    font-size: 34px;
  }

  .hero-stats {
    align-items: stretch;
  }

  .borrow-table th,
  .borrow-table td {
    padding: 14px;
  }
}
</style>