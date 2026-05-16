"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TRANSACTIONS_CHANGED_EVENT } from "@/lib/transaction-events";

export default function TransactionsQuerySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleChanged = () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary-series"] });
      queryClient.invalidateQueries({ queryKey: ["expenseByCategory"] });
    };

    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleChanged);
  }, [queryClient]);

  return null;
}
