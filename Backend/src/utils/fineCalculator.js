const LOAN_DAYS = 14;
const FINE_PER_OVERDUE_DAY = 5000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const createDueDate = (borrowDate) => {
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + LOAN_DAYS);
  return dueDate;
};

const calculateOverdueDays = (dueDate, compareDate = new Date()) => {
  if (!dueDate) {
    return 0;
  }

  const dueTime = new Date(dueDate).getTime();
  const compareTime = new Date(compareDate).getTime();

  if (Number.isNaN(dueTime) || Number.isNaN(compareTime) || compareTime <= dueTime) {
    return 0;
  }

  return Math.ceil((compareTime - dueTime) / MILLISECONDS_PER_DAY);
};

const calculateFineAmount = (dueDate, compareDate = new Date()) => {
  return calculateOverdueDays(dueDate, compareDate) * FINE_PER_OVERDUE_DAY;
};

module.exports = {
  FINE_PER_OVERDUE_DAY,
  LOAN_DAYS,
  calculateFineAmount,
  calculateOverdueDays,
  createDueDate,
};
