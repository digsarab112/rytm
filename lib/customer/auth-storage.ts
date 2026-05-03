import type { CustomerAccount, CustomerSession } from "@/types/customer";
import { loginAdminFromCustomerLogin } from "@/lib/admin/actions";
import {
  loginCustomerAccount,
  registerCustomerAccount,
} from "@/lib/customer/customer-actions";
import {
  CUSTOMER_ACCOUNTS_STORAGE_KEY,
  CUSTOMER_SESSION_STORAGE_KEY,
} from "@/lib/customer/storage";

type CustomerRegisterInput = {
  name: string;
  email: string;
  password: string;
};

type CustomerLoginInput = {
  email: string;
  password: string;
};

type CustomerAuthResult =
  | { ok: true; session: CustomerSession }
  | { ok: true; admin: true }
  | { ok: false; error: "exists" | "missing" | "invalid" | "weak" };

export function readCustomerAccounts() {
  return readJson<CustomerAccount[]>(CUSTOMER_ACCOUNTS_STORAGE_KEY) ?? [];
}

export function getCustomerSession() {
  return readJson<CustomerSession>(CUSTOMER_SESSION_STORAGE_KEY) ?? null;
}

export function clearCustomerSession() {
  window.localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
}

function canUseBrowserAuthFallback() {
  return process.env.NODE_ENV !== "production";
}

export async function registerCustomer({
  name,
  email,
  password,
}: CustomerRegisterInput): Promise<CustomerAuthResult> {
  const normalizedEmail = normalizeEmail(email);

  if (password.length < 6) {
    return { ok: false, error: "weak" };
  }

  const databaseResult = await registerCustomerAccount({
    name,
    email: normalizedEmail,
    password,
  });

  if (databaseResult.ok) {
    saveCustomerSession(databaseResult.session);
    return databaseResult;
  }

  if (databaseResult.error === "exists") {
    return { ok: false, error: "exists" };
  }

  if (!canUseBrowserAuthFallback()) {
    return { ok: false, error: "invalid" };
  }

  const accounts = readCustomerAccounts();

  if (accounts.some((account) => account.email === normalizedEmail)) {
    return { ok: false, error: "exists" };
  }

  const now = new Date().toISOString();
  const account: CustomerAccount = {
    id: createCustomerId(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashCustomerPassword(password),
    createdAt: now,
    updatedAt: now,
  };
  const session = createCustomerSession(account);

  saveCustomerAccounts([account, ...accounts]);
  saveCustomerSession(session);

  return { ok: true, session };
}

export async function loginCustomer({
  email,
  password,
}: CustomerLoginInput): Promise<CustomerAuthResult> {
  const normalizedEmail = normalizeEmail(email);
  const adminResult = await loginAdminFromCustomerLogin({
    email: normalizedEmail,
    password,
  });

  if (adminResult.ok) {
    return { ok: true, admin: true };
  }

  const databaseResult = await loginCustomerAccount({
    email: normalizedEmail,
    password,
  });

  if (databaseResult.ok) {
    saveCustomerSession(databaseResult.session);
    return databaseResult;
  }

  if (databaseResult.error === "invalid") {
    return { ok: false, error: "invalid" };
  }

  if (!canUseBrowserAuthFallback()) {
    return { ok: false, error: "missing" };
  }

  const accounts = readCustomerAccounts();
  const account = accounts.find((candidate) => candidate.email === normalizedEmail);

  if (!account) {
    return { ok: false, error: "missing" };
  }

  if (account.passwordHash !== (await hashCustomerPassword(password))) {
    return { ok: false, error: "invalid" };
  }

  const session = createCustomerSession(account);
  saveCustomerSession(session);

  return { ok: true, session };
}

function saveCustomerAccounts(accounts: CustomerAccount[]) {
  window.localStorage.setItem(
    CUSTOMER_ACCOUNTS_STORAGE_KEY,
    JSON.stringify(accounts),
  );
}

function saveCustomerSession(session: CustomerSession) {
  window.localStorage.setItem(
    CUSTOMER_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
}

function createCustomerSession(account: CustomerAccount): CustomerSession {
  return {
    customerId: account.id,
    name: account.name,
    email: account.email,
    createdAt: new Date().toISOString(),
  };
}

function createCustomerId() {
  return `customer-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashCustomerPassword(password: string) {
  const value = `rytm-customer-dev:${password}`;

  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return window.btoa(encodeURIComponent(value));
}

function readJson<T>(key: string): T | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const value = window.localStorage.getItem(key);

    return value ? (JSON.parse(value) as T) : undefined;
  } catch {
    return undefined;
  }
}
