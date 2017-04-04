/**
 * Generates a random string
 * @name generateRandomString
 * @param  {Integer} length
 * @returns {String} A random string of specified length
 */
module.exports = function generateRandomString(length) {
  const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;

  let text = ``;
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return text;
};
