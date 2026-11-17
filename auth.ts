import type { AdminUser, User } from "@/types/chatterra";

const USERS_KEY = "chatterra.users";
const SESSION_KEY = "chatterra.session";
const ADMIN_KEY = "chatterra.admin";

export const ADMIN_PASSWORD = "access000";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-blue-700",
  "bg-teal-500",
];

type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  avatarColor: string;
  avatarUrl?: string;
  blocked: boolean;
  createdAt: number;
  lastSeen: number;
};

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl,
  };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function passwordStrength(password: string): {
  score: number;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score] };
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  avatarUrl?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();
  if (users.some((u) => u.email === cleanEmail)) {
    throw new Error("An account with this email already exists.");
  }
  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  const now = Date.now();
  const stored: StoredUser = {
    id: `user-${randomHex(8)}`,
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    salt,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    avatarUrl,
    blocked: false,
    createdAt: now,
    lastSeen: now,
  };
  saveUsers([...users, stored]);
  const user = toPublicUser(stored);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const index = users.findIndex((u) => u.email === cleanEmail);
  if (index === -1) {
    throw new Error("No account found with that email.");
  }
  const found = users[index];
  const passwordHash = await hashPassword(password, found.salt);
  if (passwordHash !== found.passwordHash) {
    throw new Error("Incorrect password. Please try again.");
  }
  if (found.blocked) {
    throw new Error(
      "This account has been blocked by the administrator. Contact support."
    );
  }
  const updated: StoredUser = { ...found, lastSeen: Date.now() };
  const next = [...users];
  next[index] = updated;
  saveUsers(next);
  const user = toPublicUser(updated);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as User;
    const stored = loadUsers().find((u) => u.id === session.id);
    if (!stored || stored.blocked) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return toPublicUser(stored);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateProfile(
  userId: string,
  updates: { name?: string; avatarUrl?: string }
): User | null {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;
  const updated: StoredUser = {
    ...users[index],
    name: updates.name?.trim() ? updates.name.trim() : users[index].name,
    avatarUrl:
      updates.avatarUrl !== undefined
        ? updates.avatarUrl
        : users[index].avatarUrl,
  };
  const next = [...users];
  next[index] = updated;
  saveUsers(next);
  const user = toPublicUser(updated);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    setAdminSession();
    return true;
  }
  return false;
}

export function setAdminSession() {
  localStorage.setItem(ADMIN_KEY, "true");
}

export function getAdminSession(): boolean {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_KEY);
}

export function listAllUsers(): AdminUser[] {
  return loadUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl,
    blocked: u.blocked,
    createdAt: u.createdAt,
    lastSeen: u.lastSeen,
  }));
}

export function setUserBlocked(userId: string, blocked: boolean) {
  const users = loadUsers();
  const next = users.map((u) => (u.id === userId ? { ...u, blocked } : u));
  saveUsers(next);
  const session = getSession();
  if (session && session.id === userId && blocked) {
    clearSession();
  }
}

export function deleteUser(userId: string) {
  const users = loadUsers();
  saveUsers(users.filter((u) => u.id !== userId));
  const session = getSession();
  if (session && session.id === userId) {
    clearSession();
  }
}