export const TRANSACTIONS_CHANGED_EVENT = "transactions:changed";

export function dispatchTransactionsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
}
