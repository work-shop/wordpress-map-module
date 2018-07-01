module.exports = isArrayWithItems;

// Returns true if the value is an array with items
function isArrayWithItems ( value ) {
  return value && Array.isArray( value ) && value.length > 0;
}
