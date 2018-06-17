var deafultTileStyle = require( './tile-style.json' )

module.exports = Map;

function Map ( options ) {
  if ( ! ( this instanceof Map ) ) return new Map( options )
  console.log( 'tile-style' )
  console.log( deafultTileStyle )
}
