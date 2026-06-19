function calculatePaymentStatus(amount, paidAmount, dueDate) {
  const invoice = Number(amount || 0);
  const paid = Number(paidAmount || 0);
  const balance = Math.max(invoice - paid, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = dueDate ? new Date(dueDate) : null;
  if (due) due.setHours(0, 0, 0, 0);

  let status = "Pending";

  if (balance <= 0) {
    status = "Paid";
  } else if (due && due < today) {
    status = "Overdue";
  } else if (paid > 0 && balance > 0) {
    status = "Partial";
  } else {
    status = "Pending";
  }

  return {
    balanceAmount: balance,
    paymentStatus: status,
    paidAt: status === "Paid" ? new Date() : null
  };
}

module.exports = {
  calculatePaymentStatus
};
