const sendSms = async ({ phone, message }) => {
  console.log(`[SMS SIMULATION] To ${phone}: ${message}`);
  return { simulated: true };
};

module.exports = {
  sendSms,
};
