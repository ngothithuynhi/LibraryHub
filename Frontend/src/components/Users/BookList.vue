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
              @click="borrowBook(book)"
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
      token: localStorage.getItem("token"),
    };
  },

  computed: {
    availableBooks() {
      return this.books.filter((book) => Number(book.quantity) > 0).length;
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

    async borrowBook(book) {
      this.borrowingBookId = book.id;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.post("/borrow", { bookId: book.id });

        this.message = res.data.message || "Borrow book successfully";

        const selectedBook = this.books.find((item) => item.id === book.id);

        if (selectedBook && selectedBook.quantity > 0) {
          selectedBook.quantity -= 1;
        }
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Borrow failed";
      } finally {
        this.borrowingBookId = null;
      }
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
}
</style>