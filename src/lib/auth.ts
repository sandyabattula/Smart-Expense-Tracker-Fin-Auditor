import { useEffect, useState, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

const USERS_KEY = "fa_users_v1";
const SESSION_KEY = "fa_session_v1";

async function hash(pw: string): Promise<string> {
  const buf = new TextEncoder().encode(pw + "::finaudit_salt");
  const out = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(out)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"); } catch { return []; }
}
function writeUsers(u: StoredUser[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setSession(u: User | null) {
  if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("auth:changed"));
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const users = readUsers();
  const e = email.trim().toLowerCase();
  if (users.some((u) => u.email === e)) throw new Error("An account with this email already exists");
  const user: StoredUser = { id: crypto.randomUUID(), name: name.trim(), email: e, passwordHash: await hash(password) };
  users.push(user);
  writeUsers(users);
  const { passwordHash, ...pub } = user;
  setSession(pub);
  return pub;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const users = readUsers();
  const e = email.trim().toLowerCase();
  const user = users.find((u) => u.email === e);
  if (!user) throw new Error("Invalid email or password");
  const h = await hash(password);
  if (h !== user.passwordHash) throw new Error("Invalid email or password");
  const { passwordHash, ...pub } = user;
  setSession(pub);
  return pub;
}

export function logoutUser() { setSession(null); }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(getCurrentUser());
    setReady(true);
    const onChange = () => setUser(getCurrentUser());
    window.addEventListener("auth:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("auth:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const logout = useCallback(() => logoutUser(), []);
  return { user, ready, logout };
}
