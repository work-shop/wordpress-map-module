module.exports = isObject;

// Returns true if the value is a plain object
function isObject ( value ) {
  return ( typeof value === 'object' ) &&
         ( ! Array.isArray( value ) ) &&
         ( value !== null )
}