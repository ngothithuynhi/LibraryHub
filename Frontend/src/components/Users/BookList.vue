<template>
  <div class="books-page">
    <section class="books-hero">
      <div>
        <span class="eyebrow">LibraryHub Collection</span>
        <h1>Find your next book</h1>
        <p>Search, explore and borrow books from the LibraryHub collection.</p>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <strong>{{ books.length }}</strong>
          <span>Total Books</span>
        </div>

        <div class="stat-card">
          <strong>{{ availableBooks }}</strong>
          <span>Available</span>
        </div>
      </div>
    </section>

    <section class="search-card">
      <div class="search-box">
        <input
          v-model="keyword"
          type="text"
          placeholder="Search by title, author or category..."
          @keyup.enter="searchBooks"
        />

        <button class="search-btn" @click="searchBooks" :disabled="searching">
          {{ searching ? "Searching..." : "Search" }}
        </button>

        <button class="reset-btn" @click="resetSearch" :disabled="searching">
          Reset
        </button>
      </div>

      <button class="reload-btn" @click="loadBooks({ silent: true })" :disabled="refreshing">
        {{ refreshing ? "Refreshing..." : "Reload" }}
      </button>
    </section>

    <div v-if="message" class="message-box" :class="isError ? 'error' : 'success'">
      {{ message }}
    </div>

    <div v-if="initialLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading books...</p>
    </div>

    <template v-else>
      <div v-if="books.length > 0" class="book-grid">
        <article v-for="book in books" :key="book.id" class="book-card">
          <div class="book-cover">
            <span>{{ getBookInitial(book.title) }}</span>
          </div>

          <div class="book-content">
            <div class="book-top">
              <span class="category-badge">{{ book.category }}</span>
              <span
                class="quantity-badge"
                :class="book.quantity > 0 ? 'available' : 'unavailable'"
              >
                {{ book.quantity > 0 ? `${book.quantity} available` : "Unavailable" }}
              </span>
            </div>

            <h3>{{ book.title }}</h3>

            <p class="author">
              by {{ book.author }}
            </p>

            <div class="book-meta">
              <span>Book ID: #{{ book.id }}</span>
              <span>{{ book.category }}</span>
            </div>

            <button
              class="borrow-btn"
              :disabled="book.quantity <= 0 || !token || borrowingBookId === book.id"
              @click="openBorrowConfirmation(book)"
            >
              <span v-if="borrowingBookId === book.id">Borrowing...</span>
              <span v-else-if="!token">Login to Borrow</span>
              <span v-else-if="book.quantity <= 0">Out of Stock</span>
              <span v-else>Borrow Book</span>
            </button>

            <small v-if="!token" class="login-note">
              Please login before borrowing books.
            </small>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No books found</h3>
        <p>Please check seed data or try another search keyword.</p>
        <button class="reload-btn" @click="resetSearch">
          Load All Books
        </button>
      </div>
    </template>

    <div
      v-if="selectedBorrowBook"
      class="borrow-modal-backdrop"
      role="presentation"
      @click.self="closeBorrowConfirmation"
    >
      <section
        class="borrow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="borrow-confirm-title"
      >
        <div class="borrow-modal-header">
          <div>
            <span class="modal-eyebrow">Borrow Confirmation</span>
            <h2 id="borrow-confirm-title">Confirm your borrow</h2>
          </div>

          <button
            class="modal-close-btn"
            type="button"
            aria-label="Close borrow confirmation"
            :disabled="borrowingBookId === selectedBorrowBook.id"
            @click="closeBorrowConfirmation"
          >
            x
          </button>
        </div>

        <div class="borrow-summary">
          <div class="summary-row">
            <span>Book title</span>
            <strong>{{ selectedBorrowBook.title }}</strong>
          </div>

          <div class="summary-row">
            <span>Borrow date</span>
            <strong>{{ borrowDatePreview }}</strong>
          </div>

          <div class="summary-row">
            <span>Expected return date / Due date</span>
            <div>
              <input
                v-model="selectedDueDate"
                class="due-date-input"
                type="date"
                :min="minDueDate"
                :max="maxDueDate"
                @input="validateSelectedDueDate"
              />
              <small class="due-date-help">
                Choose a date from {{ formatDateOnly(minDueDate) }} to
                {{ formatDateOnly(maxDueDate) }}.
              </small>
            </div>
          </div>
        </div>

        <p v-if="dueDateValidationMessage" class="borrow-validation-message">
          {{ dueDateValidationMessage }}
        </p>

        <p class="borrow-note">
          Please return this book before the due date to avoid overdue fine.
        </p>

        <div class="borrow-modal-actions">
          <button
            class="cancel-borrow-btn"
            type="button"
            :disabled="borrowingBookId === selectedBorrowBook.id"
            @click="closeBorrowConfirmation"
          >
            Cancel
          </button>

          <button
            class="confirm-borrow-btn"
            type="button"
            :disabled="borrowingBookId === selectedBorrowBook.id"
            @click="confirmBorrow"
          >
            {{ borrowingBookId === selectedBorrowBook.id ? "Borrowing..." : "Confirm Borrow" }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";

export default {
  data() {
    return {
      books: [],
      keyword: "",
      message: "",
      isError: false,
      initialLoading: false,
      refreshing: false,
      searching: false,
      borrowingBookId: null,
      selectedBorrowBook: null,
      selectedDueDate: "",
      dueDateValidationMessage: "",
      token: localStorage.getItem("token"),
    };
  },

  computed: {
    availableBooks() {
      return this.books.filter((book) => Number(book.quantity) > 0).length;
    },

    borrowDatePreview() {
      return this.formatDateOnly(new Date());
    },

    minDueDate() {
      return this.formatDateInput(this.addDays(new Date(), 1));
    },

    maxDueDate() {
      return this.formatDateInput(this.addDays(new Date(), 14));
    },
  },

  mounted() {
    this.loadBooks();
  },

  methods: {
    async loadBooks(options = {}) {
      const silent = options.silent || false;

      if (silent) {
        this.refreshing = true;
      } else {
        this.initialLoading = this.books.length === 0;
      }

      this.message = "";
      this.isError = false;

      try {
        const res = await api.get("/books");
        this.books = res.data.data || [];
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Cannot load books";
      } finally {
        this.initialLoading = false;
        this.refreshing = false;
      }
    },

    async searchBooks() {
      const keyword = this.keyword.trim();

      if (!keyword) {
        await this.loadBooks({ silent: true });
        return;
      }

      this.searching = true;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.get(`/books/search?keyword=${encodeURIComponent(keyword)}`);
        this.books = res.data.data || [];
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Search failed";
      } finally {
        this.searching = false;
      }
    },

    async resetSearch() {
      this.keyword = "";
      await this.loadBooks({ silent: true });
    },

    openBorrowConfirmation(book) {
      if (!this.token || Number(book.quantity) <= 0 || this.borrowingBookId) {
        return;
      }

      this.message = "";
      this.isError = false;
      this.selectedDueDate = this.maxDueDate;
      this.dueDateValidationMessage = "";
      this.selectedBorrowBook = book;
    },

    closeBorrowConfirmation() {
      if (this.borrowingBookId) {
        return;
      }

      this.selectedBorrowBook = null;
      this.selectedDueDate = "";
      this.dueDateValidationMessage = "";
    },

    async confirmBorrow() {
      if (!this.selectedBorrowBook) {
        return;
      }

      if (!this.validateSelectedDueDate()) {
        return;
      }

      await this.borrowBook(this.selectedBorrowBook);
    },

    async borrowBook(book) {
      this.borrowingBookId = book.id;
      this.message = "";
      this.isError = false;

      try {
        const selectedDueDate = this.selectedDueDate;
        const res = await api.post("/borrow", {
          bookId: book.id,
          dueDate: selectedDueDate,
        });
        const dueDate = selectedDueDate || this.getBorrowDueDateFromResponse(res.data);
        const successMessage = res.data.message || "Borrow book successfully";

        this.message = dueDate
          ? `${successMessage}. Due date: ${this.formatDateOnly(dueDate)}.`
          : successMessage;

        const selectedBook = this.books.find((item) => item.id === book.id);

        if (selectedBook && selectedBook.quantity > 0) {
          selectedBook.quantity -= 1;
        }

        this.selectedBorrowBook = null;
        this.selectedDueDate = "";
        this.dueDateValidationMessage = "";
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Borrow failed";
        if (this.message.toLowerCase().includes("invalid due date")) {
          this.dueDateValidationMessage = this.message;
        } else {
          this.selectedBorrowBook = null;
          this.selectedDueDate = "";
        }
      } finally {
        this.borrowingBookId = null;
      }
    },

    validateSelectedDueDate() {
      const selected = this.dateFromInput(this.selectedDueDate);
      const min = this.dateFromInput(this.minDueDate);
      const max = this.dateFromInput(this.maxDueDate);

      if (!selected || selected < min || selected > max) {
        this.dueDateValidationMessage =
          "Invalid due date. Please choose a date between tomorrow and 14 days from today.";
        return false;
      }

      this.dueDateValidationMessage = "";
      return true;
    },

    getBorrowDueDateFromResponse(payload) {
      return payload?.dueDate || payload?.borrowRecord?.dueDate || payload?.data?.dueDate;
    },

    addDays(date, days) {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    },

    dateFromInput(value) {
      if (!value) return null;

      const [year, month, day] = String(value).split("-").map(Number);

      if (!year || !month || !day) {
        return null;
      }

      return new Date(year, month - 1, day);
    },

    formatDateInput(value) {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    },

    formatDateOnly(value) {
      if (!value) return "N/A";

      const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? this.dateFromInput(value)
        : new Date(value);

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
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
.books-page {
  animation: fadeIn 0.25s ease;
}

.books-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: stretch;
  padding: 34px;
  margin-bottom: 24px;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(183, 28, 28, 0.92), rgba(31, 41, 55, 0.94)),
    url("https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1400&auto=format&fit=crop");
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

.books-hero h1 {
  font-size: 44px;
  font-weight: 900;
  margin-bottom: 8px;
  letter-spacing: -1px;
}

.books-hero p {
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
  min-width: 125px;
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

.search-card {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 22px;
  padding: 18px;
  border-radius: 24px;
  background: white;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.search-box {
  flex: 1;
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  background: #f9fafb;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  padding: 14px 20px;
  background: transparent;
  font-weight: 600;
}

.search-btn,
.reset-btn,
.reload-btn,
.borrow-btn {
  border: none;
  font-weight: 900;
  transition: 0.2s ease;
}

.search-btn {
  padding: 0 22px;
  background: #b71c1c;
  color: white;
}

.search-btn:hover {
  background: #8f1414;
}

.reset-btn {
  padding: 0 20px;
  background: #f3f4f6;
  color: #374151;
}

.reset-btn:hover {
  background: #e5e7eb;
}

.reload-btn {
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  background: #fbe9e7;
  color: #b71c1c;
}

.reload-btn:hover {
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
  min-height: 280px;
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

.book-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.book-card {
  display: grid;
  grid-template-columns: 96px 1fr;
  min-height: 245px;
  overflow: hidden;
  border-radius: 26px;
  background: white;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.09);
  transition: 0.22s ease;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.15);
}

.book-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, #b71c1c, #7f1d1d);
  color: white;
}

.book-cover span {
  width: 58px;
  height: 58px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 30px;
  font-weight: 900;
}

.book-content {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.book-top {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-badge,
.quantity-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.category-badge {
  background: #fbe9e7;
  color: #b71c1c;
}

.quantity-badge.available {
  background: #dcfce7;
  color: #166534;
}

.quantity-badge.unavailable {
  background: #fee2e2;
  color: #991b1b;
}

.book-content h3 {
  margin-bottom: 6px;
  font-size: 20px;
  font-weight: 900;
  color: #111827;
  line-height: 1.25;
}

.author {
  margin-bottom: 14px;
  color: #6b7280;
  font-weight: 700;
}

.book-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.book-meta span {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
}

.borrow-btn {
  width: 100%;
  min-height: 44px;
  margin-top: auto;
  border-radius: 999px;
  background: #b71c1c;
  color: white;
}

.borrow-btn:hover:not(:disabled) {
  background: #8f1414;
  transform: translateY(-1px);
}

.borrow-btn:disabled {
  background: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
}

.login-note {
  display: block;
  margin-top: 10px;
  color: #6b7280;
  font-weight: 700;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.empty-state h3 {
  font-weight: 900;
  color: #111827;
}

.borrow-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(17, 24, 39, 0.58);
}

.borrow-modal {
  width: min(100%, 500px);
  padding: 24px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.32);
}

.borrow-modal-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.modal-eyebrow {
  display: inline-block;
  margin-bottom: 8px;
  color: #b71c1c;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.borrow-modal h2 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  font-weight: 900;
}

.modal-close-btn {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border: none;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 18px;
  font-weight: 900;
}

.modal-close-btn:hover:not(:disabled) {
  background: #fee2e2;
  color: #b71c1c;
}

.borrow-summary {
  overflow: hidden;
  border: 1px solid #fee2e2;
  border-radius: 18px;
  background: #fff7f6;
}

.summary-row {
  display: grid;
  grid-template-columns: 170px 1fr;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid #fee2e2;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row span {
  color: #6b7280;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.summary-row strong {
  color: #111827;
  font-weight: 900;
}

.due-date-input {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #ffffff;
  color: #111827;
  font-weight: 800;
}

.due-date-input:focus {
  border-color: #b71c1c;
  outline: none;
  box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.14);
}

.due-date-help {
  display: block;
  margin-top: 6px;
  color: #6b7280;
  font-weight: 700;
}

.borrow-validation-message {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fee2e2;
  color: #991b1b;
  font-weight: 800;
}

.borrow-note {
  margin: 16px 0 0;
  color: #7f1d1d;
  font-weight: 800;
}

.borrow-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}

.cancel-borrow-btn,
.confirm-borrow-btn {
  min-height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 999px;
  font-weight: 900;
  transition: 0.2s ease;
}

.cancel-borrow-btn {
  background: #f3f4f6;
  color: #374151;
}

.cancel-borrow-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.confirm-borrow-btn {
  background: #b71c1c;
  color: #ffffff;
}

.confirm-borrow-btn:hover:not(:disabled) {
  background: #8f1414;
  transform: translateY(-1px);
}

.cancel-borrow-btn:disabled,
.confirm-borrow-btn:disabled,
.modal-close-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
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

@media (max-width: 1050px) {
  .book-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .books-hero {
    flex-direction: column;
  }

  .hero-stats {
    align-items: stretch;
  }
}

@media (max-width: 720px) {
  .books-hero h1 {
    font-size: 34px;
  }

  .search-card {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    flex-direction: column;
    border-radius: 22px;
  }

  .search-btn,
  .reset-btn {
    min-height: 44px;
  }

  .book-grid {
    grid-template-columns: 1fr;
  }

  .book-card {
    grid-template-columns: 1fr;
  }

  .book-cover {
    min-height: 110px;
  }

  .summary-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .borrow-modal-actions {
    flex-direction: column;
  }
}
</style>
