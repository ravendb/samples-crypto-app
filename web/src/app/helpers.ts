export const formatCurrency = Intl?.NumberFormat
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
      .format
  : (amount: number) => `$${amount.toFixed(6)}`;
