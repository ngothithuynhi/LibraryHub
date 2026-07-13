<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <router-link class="navbar-brand fw-bold" to="/books">
        LibraryHub
      </router-link>

      <div class="ms-auto d-flex gap-2 align-items-center">
        <router-link class="btn btn-outline-light btn-sm" to="/books">
          Books
        </router-link>

        <router-link v-if="user" class="btn btn-outline-light btn-sm" to="/my-borrows">
          My Borrows
        </router-link>

        <router-link
          v-if="user && Number(user.role) === 1"
          class="btn btn-warning btn-sm"
          to="/admin/books"
        >
          Admin
        </router-link>

        <router-link v-if="!user" class="btn btn-outline-light btn-sm" to="/login">
          Login
        </router-link>

        <router-link v-if="!user" class="btn btn-success btn-sm" to="/register">
          Register
        </router-link>

        <span v-if="user" class="text-white small ms-2">
          {{ user.name }} ({{ getRoleName(user.role) }})
        </span>

        <button v-if="user" class="btn btn-danger btn-sm" @click="handleLogout">
          Logout
        </button>
      </div>
    </nav>

    <main class="container py-4">
      <router-view />
    </main>
  </div>
</template>

<script>
import { getRoleName } from "./router/checkToken";

export default {
  data() {
    return {
      user: null,
    };
  },

  mounted() {
    this.loadUser();
  },

  methods: {
    getRoleName,

    loadUser() {
      const storedUser = localStorage.getItem("user");
      this.user = storedUser ? JSON.parse(storedUser) : null;
    },

    handleLogout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.user = null;
      this.$router.push("/login");
      window.location.reload();
    },
  },
};
</script>