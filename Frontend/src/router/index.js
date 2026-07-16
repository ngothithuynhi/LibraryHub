import { createRouter, createWebHistory } from "vue-router";

import Login from "../components/Auth/Login.vue";
import Register from "../components/Auth/Register.vue";
import BookList from "../components/Users/BookList.vue";
import BorrowHistory from "../components/Users/BorrowHistory.vue";
import Profile from "../components/Users/Profile.vue";
import AdminBook from "../components/Admin/AdminBook.vue";
import AdminUser from "../components/Admin/AdminUser.vue";

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
    path: "/profile",
    component: Profile,
  },
  {
    path: "/admin/books",
    component: AdminBook,
  },
  {
    path: "/admin/users",
    component: AdminUser,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
