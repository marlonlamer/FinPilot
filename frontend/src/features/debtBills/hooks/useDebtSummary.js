import { useMemo } from "react";
import {
  normalizeDebtItems,
  normalizeBillItems,
  getDebtSummary,
  getBillSummary,
} from "../utils/debtBillsUtils";

export default function useDebtSummary(rawDebtItems, rawBillItems) {
  return useMemo(() => {
    const normalizedDebtItems = normalizeDebtItems(rawDebtItems);
    const normalizedBillItems = normalizeBillItems(rawBillItems);

    return {
      normalizedDebtItems,
      normalizedBillItems,
      debtSummary: getDebtSummary(normalizedDebtItems),
      billSummary: getBillSummary(normalizedBillItems),
    };
  }, [rawDebtItems, rawBillItems]);
}
