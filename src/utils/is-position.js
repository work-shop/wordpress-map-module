var isNumber = require( './is-number.js' )
var isObject = require( './is-object.js' )

module.exports = validatePosition;

/**
 * Given a `position` value, ensure that it is an object
 * with a key of `lat` that is a number, and a key of `lng`
 * that is also a number.
 * 
 * @param  {object} position
 * @param  {number} position.lat
 * @param  {number} position.lng
 * @return {boolean} isValid
 */
function validatePosition ( position ) {
  if ( ! isObject( position ) ) return false;

  var hasLat = isNumber( position.lat )
  var hasLng = isNumber( position.lng )

  var isValid = hasLat && hasLng;

  return isValid;
}
