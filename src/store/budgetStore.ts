import { useSyncExternalStore } from "react";
import type { Category } from "@/types/category";
import type { UserProfile } from "@/types/profile";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";
import { dispatchTransactionsChanged } from "@/lib/transaction-events";

export interface BudgetState {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  profile: UserProfile;
  loading: boolean;
  isAuthenticated: boolean;
}

const initialState: BudgetState = {
  transactions: [],
  categories: [],
  wallets: [],
  profile: {
    name: "",
    email: "",
    theme: "dark",
  },
  loading: false,
  isAuthenticated: false,
};

const DASHBOARD_TRANSACTION_LIMIT = 100;

let state: BudgetState = initialState;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(updater: (current: BudgetState) => BudgetState) {
  state = updater(state);
  emitChange();
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const budgetActions = {
  async loadFromApi() {
    setState((c) => ({ ...c, loading: true }));

    try {
      const walletsPromise = apiFetch<Wallet[]>("/api/wallets", { cache: "no-store" }).catch((walletError) => {
        console.warn("Wallet data is not available yet:", walletError);
        return [] as Wallet[];
      });

      const [transactionsPage, categories, profile] = await Promise.all([
        apiFetch<{ items: Transaction[] }>("/api/transactions?limit=" + DASHBOARD_TRANSACTION_LIMIT),
        apiFetch<Category[]>("/api/categories"),
        apiFetch<UserProfile>("/api/profiles"),
      ]);

      const wallets = await walletsPromise;

      setState((c) => ({
        ...c,
        transactions: transactionsPage.items ?? [],
        categories,
        wallets,
        profile,
        loading: false,
      }));
    } catch (err) {
      console.error("Failed to load data from API:", err);
      setState((c) => ({ ...c, loading: false }));
    }
  },

  setAuthState(isAuthenticated: boolean) {
    setState((current) =>
      isAuthenticated
        ? { ...current, isAuthenticated: true }
        : {
            ...current,
            isAuthenticated: false,
            transactions: [],
            categories: [],
            wallets: [],
            profile: { ...initialState.profile },
          },
    );
  },

  async loadSystemWallets() {
    try {
      const wallets = await apiFetch<Wallet[]>("/api/wallets/system", { cache: "no-store" });
      setState((c) => ({ ...c, wallets }));
    } catch (err) {
      console.warn("Gagal memuat dompet sistem:", err);
    }
  },

  async addTransaction(payload: Omit<Transaction, "id">) {
    const created = await apiFetch<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const delta = created.type === "expense" ? -created.amount : created.amount;
    setState((c) => ({
      ...c,
      transactions: [created, ...c.transactions].slice(0, DASHBOARD_TRANSACTION_LIMIT),
      wallets: c.wallets.map((wallet) =>
        wallet.id === created.walletId
          ? { ...wallet, balance: Number(wallet.balance ?? 0) + delta }
          : wallet,
      ),
    }));

    dispatchTransactionsChanged();
    return created;
  },

  async updateTransaction(id: string, payload: Omit<Transaction, "id">) {
    const updated = await apiFetch<Transaction>(`/api/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setState((c) => {
      const previous = c.transactions.find((item) => item.id === id);
      let wallets = c.wallets;
      if (previous) {
        const prevDelta = previous.type === "expense" ? -previous.amount : previous.amount;
        wallets = wallets.map((wallet) =>
          wallet.id === previous.walletId
            ? { ...wallet, balance: Number(wallet.balance ?? 0) - prevDelta }
            : wallet,
        );
      }
      const nextDelta = updated.type === "expense" ? -updated.amount : updated.amount;
      wallets = wallets.map((wallet) =>
        wallet.id === updated.walletId
          ? { ...wallet, balance: Number(wallet.balance ?? 0) + nextDelta }
          : wallet,
      );

      return {
        ...c,
        transactions: c.transactions.map((item) => (item.id === id ? updated : item)),
        wallets,
      };
    });

    dispatchTransactionsChanged();
    return updated;
  },

  async deleteTransaction(id: string) {
    await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });

    setState((c) => {
      const previous = c.transactions.find((item) => item.id === id);
      let wallets = c.wallets;
      if (previous) {
        const prevDelta = previous.type === "expense" ? -previous.amount : previous.amount;
        wallets = wallets.map((wallet) =>
          wallet.id === previous.walletId
            ? { ...wallet, balance: Number(wallet.balance ?? 0) - prevDelta }
            : wallet,
        );
      }

      return {
        ...c,
        transactions: c.transactions.filter((item) => item.id !== id),
        wallets,
      };
    });

    dispatchTransactionsChanged();
  },

  async addCategory(payload: Omit<Category, "id" | "isDefault">) {
    const created = await apiFetch<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      categories: [...c.categories, created],
    }));
  },

  async addWallet(payload: Omit<Wallet, "id" | "isDefault">) {
    const normalizedPayload = {
      ...payload,
      category: payload.category ?? "Umum",
      location: payload.location ?? "Lokal",
    };

    const created = await apiFetch<Wallet>("/api/wallets", {
      method: "POST",
      body: JSON.stringify(normalizedPayload),
    });

    setState((c) => ({
      ...c,
      wallets: [...c.wallets, created],
    }));

    return created;
  },

  async updateWallet(id: string, payload: Pick<Wallet, "name"> & Partial<Pick<Wallet, "category" | "location">>) {
    const updated = await apiFetch<Wallet>(`/api/wallets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      wallets: c.wallets.map((item) => (item.id === id ? updated : item)),
    }));
  },

  async deleteWallet(id: string) {
    await apiFetch(`/api/wallets/${id}`, { method: "DELETE" });

    setState((c) => ({
      ...c,
      wallets: c.wallets.filter((item) => item.id !== id),
    }));
  },

  async updateProfile(payload: Partial<Omit<UserProfile, "theme">>) {
    const updated = await apiFetch<UserProfile>("/api/profiles", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      profile: updated,
    }));
  },

  async setTheme(theme: UserProfile["theme"]) {
    const updated = await apiFetch<UserProfile>("/api/profiles", {
      method: "PATCH",
      body: JSON.stringify({ theme }),
    });

    setState((c) => ({
      ...c,
      profile: updated,
    }));
  },
};

export function useBudgetStore<T>(selector: (current: BudgetState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

export function getBudgetState() {
  return state;
}
