module.exports = function bodyToString(body) {
  try {
    return JSON.stringify(body, null, 2);
  }
  catch (err) {
    return body;
  }
};
