var $ = require( 'jquery' )
var map = require( '../src/index.js' )

$( window ).on('load', function () {
  map( {
    container: document.querySelector( '.map' )
  } ).render()
} )
