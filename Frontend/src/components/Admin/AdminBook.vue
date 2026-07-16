<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1">Admin - Book Management</h2>
        <p class="text-muted mb-0">
          Add, update and delete books in LibraryHub.
        </p>
      </div>

      <div class="d-flex gap-2">
        <router-link class="btn btn-outline-secondary" to="/admin/users">
          Manage Users
        </router-link>

        <button class="btn btn-outline-primary" @click="loadBooks">
          Reload
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

      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="mb-3">
            {{ editingBookId ? "Update Book" : "Create New Book" }}
          </h5>

          <form @submit.prevent="submitBook">
            <div class="row">
              <div class="col-md-3 mb-3">
                <label class="form-label">Title</label>
                <input v-model="form.title" type="text" class="form-control" required />
              </div>

              <div class="col-md-3 mb-3">
                <label class="form-label">Author</label>
                <input v-model="form.author" type="text" class="form-control" required />
              </div>

              <div class="col-md-3 mb-3">
                <label class="form-label">Category</label>
                <input v-model="form.category" type="text" class="form-control" required />
              </div>

              <div class="col-md-3 mb-3">
                <label class="form-label">Quantity</label>
                <input
                  v-model.number="form.quantity"
                  type="number"
                  min="0"
                  class="form-control"
                  required
                />
              </div>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-success" type="submit" :disabled="saving">
                {{ saving ? "Saving..." : editingBookId ? "Update Book" : "Create Book" }}
              </button>

              <button
                v-if="editingBookId"
                class="btn btn-secondary"
                type="button"
                @click="resetForm"
              >
                Cancel Edit
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="mb-3">Book List</h5>

          <div v-if="loading" class="text-center py-4">
            Loading books...
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th class="text-center">Quantity</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="book in books" :key="book.id">
                  <td>{{ book.id }}</td>
                  <td>{{ book.title }}</td>
                  <td>{{ book.author }}</td>
                  <td>
                    <span class="badge bg-primary">{{ book.category }}</span>
                  </td>
                  <td class="text-center">{{ book.quantity }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-warning me-2" @click="editBook(book)">
                      Edit
                    </button>

                    <button class="btn btn-sm btn-danger" @click="deleteBook(book.id)">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="books.length === 0" class="text-center text-muted py-4">
              No books found.
            </div>
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
      books: [],
      form: {
        title: "",
        author: "",
        category: "",
        quantity: 1,
      },
      editingBookId: null,
      loading: false,
      saving: false,
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
      this.loadBooks();
    }
  },

  methods: {
    async loadBooks() {
      this.loading = true;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.get("/books");
        this.books = res.data.data || [];
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Cannot load books";
      } finally {
        this.loading = false;
      }
    },

    async submitBook() {
      this.saving = true;
      this.message = "";
      this.isError = false;

      try {
        if (this.editingBookId) {
          const res = await api.put(`/books/${this.editingBookId}`, this.form);
          this.message = res.data.message || "Update book successfully";
        } else {
          const res = await api.post("/books", this.form);
          this.message = res.data.message || "Create book successfully";
        }

        this.resetForm();
        await this.loadBooks();
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Save book failed";
      } finally {
        this.saving = false;
      }
    },

    editBook(book) {
      this.editingBookId = book.id;

      this.form = {
        title: book.title,
        author: book.author,
        category: book.category,
        quantity: book.quantity,
      };

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },

    async deleteBook(bookId) {
      const confirmed = confirm("Are you sure you want to delete this book?");

      if (!confirmed) return;

      this.loading = true;
      this.message = "";
      this.isError = false;

      try {
        const res = await api.delete(`/books/${bookId}`);
        this.message = res.data.message || "Delete book successfully";
        await this.loadBooks();
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.message || "Delete book failed";
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.editingBookId = null;

      this.form = {
        title: "",
        author: "",
        category: "",
        quantity: 1,
      };
    },
  },
};
</script>
