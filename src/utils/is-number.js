module.exports = isNumber;

/**
 * Returns true if the value is a number.
 */
function isNumber ( value ) {
  if ( typeof value === 'string' ) return false;
  return ! ( Number.isNaN( value ) )
}
