const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

module.exports = formatDate;
