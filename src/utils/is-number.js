module.exports = isNumber;

/**
 * Returns true if the value is a number.
 */
function isNumber ( value ) {
  if ( typeof value === 'string' ) return false;
  var n = Number( value );
  
  // NOTE: we cannot use isNaN here, since isNaN is nonstandard, and
  // is not supported by at least IE11. Instead, we can leverage the fact that
  // nan !== nan, while x === x for all other numbers x to check for nan.
  return n === n;

}
