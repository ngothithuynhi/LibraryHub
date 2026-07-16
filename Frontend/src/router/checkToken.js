export const ROLE_ADMIN = 1;
export const ROLE_USER = 2;

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(user);

    return {
      ...parsedUser,
      role: Number(parsedUser.role),
    };
  } catch (error) {
    logout();
    return null;
  }
}

export function isAdmin() {
  const user = getUser();
  return user && Number(user.role) === ROLE_ADMIN;
}

export function isUser() {
  const user = getUser();
  return user && Number(user.role) === ROLE_USER;
}

export function getRoleName(role) {
  const roleId = Number(role);

  if (roleId === ROLE_ADMIN) {
    return "ADMIN";
  }

  if (roleId === ROLE_USER) {
    return "USER";
  }

  return "UNKNOWN";
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
