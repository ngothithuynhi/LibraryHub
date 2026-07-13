import { createRouter, createWebHistory } from "vue-router";

import Login from "../components/Auth/Login.vue";
import Register from "../components/Auth/Register.vue";
import BookList from "../components/Users/BookList.vue";
import BorrowHistory from "../components/Users/BorrowHistory.vue";
import AdminBook from "../components/Admin/AdminBook.vue";

const routes = [
  {
    path: "/",
    redirect: "/books",
  },
  {
    path: "/login",
    component: Login,
  },
  {
    path: "/register",
    component: Register,
  },
  {
    path: "/books",
    component: BookList,
  },
  {
    path: "/my-borrows",
    component: BorrowHistory,
  },
  {
    path: "/admin/books",
    component: AdminBook,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;