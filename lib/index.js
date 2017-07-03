function greet(person) {
  const { firstName, lastName } = person;
  return `hello ${firstName}, ${lastName}`;
}

module.exports = greet;
