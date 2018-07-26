/* globals google.maps */

var isArrayWithItems = require( './utils/is-array-with-items.js' )
var isPosition = require( './utils/is-position.js' )
var isObject = require( './utils/is-object.js' )

var classPrefix = 'ws-map-popup'
var eventPrefix = classPrefix;

module.exports = OverlayPopup;

/**
 * OverlayPopup creates a google.maps.OverlayView that can be
 * tied to a map marker.
 * 
 * @param {object} options  The options that describe the popup.
 * @param {string|DOMElement} options.content  A string of HTML or DOM element to use as
 *                                             the content of the popup. Required.
 *                                             
 * @param {?object} options.marker  A google.maps.Marker instance to attach
 *                                  the popup to.
 *                                  
 * @param {?object} options.map  A google.maps.Map instance to attach the popup to. If using
 *                               this option, a `position` must also be defined.
 *                               
 * @param {?object} options.position  An object with a `lat` & `lng` value that determine
 *                                   the popup's placement. If using this option, a `map`
 *                                   must also be defined.
 *                                   
 * @param {?object} options.on  An object of event handlers.
 * @param {?function} options.on.beforeOpen  The function to call before opening the popup.
 * @param {?function} options.on.open  The function to call when popup opens.
 * @param {?function} options.on.afterOpen  The function to call after the popup opens.
 * @param {?function} options.on.beforeClose  The function to call before closing the popup.
 * @param {?function} options.on.close  The function to call when popup closes.
 * @param {?function} options.on.afterClose  The function to call after the popup closes.
 * @param {?string} options.placement  Where the popup should render relative to its marker.
 *                                     'top' | 'bottom' | 'left' | 'right'.
 *
 * @param {?string} options.maxWidth  The CSS max-width value to use on the popup.
 *
 * @param {?boolean|string} options.pointer  The height of the pointer, or simply `true` to include one
 *                                           with default height.
 *
 * @param {?boolean} options.openOnMarkerClick  If true, open the popup when its marker is clicked.
 * @param {?boolean} options.toggleOnMarkerClick  If true, toggle the popup when its marker is clicked.
 * @param {?boolean} options.closeOnMapClick  If true, close the popup when the map is clicked.
 * @param {?boolean} options.showCloseButton  If true, display a button for closing the popup. If false,
 *                                            it is up to the marker options to handle opening and closing.
 *
 * @param {?boolean} options.panOnOpen  Pan the map if necessary in order to display the entire popup content.
 * @param {?boolean} options.openOnInitialization  If true, open the popup when it is first initialized.
 * @param {?boolean} options.closeWhenOthersOpen  If true, close any other currently open popups when opening
 *                                                a different one.
 *
 * @param {?object} options.edgeOffset  The pixel values that the popups should maintain from the border of the map.
 * @param {?string} options.edgeOffset.top  The pixel value that the popups should maintain from the top of the map.
 * @param {?string} options.edgeOffset.bottom  The pixel value that the popups should maintain from the bottom of the map.
 * @param {?string} options.edgeOffset.left  The pixel value that the popups should maintain from the left of the map.
 * @param {?string} options.edgeOffset.right  The pixel value that the popups should maintain from the right of the map.
 * @param {?object} options.offset  The pixel values that the popup margin should have.
 * @param {?string} options.offset.top  The pixel value that the popup top margin should have.
 * @param {?string} options.offset.left  The pixel value that the popup left margin should have.
 */
function OverlayPopup ( options ) {
  if ( ! validateOptions( options ) ) {
    var errorMessage = 'Could not initialize OverlayPopup.' +
      '\nOverlayPopup requires the following keys in its options:' +
      '\n\t- `content`:  The content to place into the marker.' +
      '\n\t              Either a string or DOM element. Required.'
      '\n\t- `marker`:   A google.maps.Marker instance. Optional.' +
      '\n\t- `map`:      A google.maps.Map instance. Optional.' +
      '\n\t- `           If using this option, a `position` must' +
      '\n\t              also be defined.' +
      '\n\t- `position`: An object with `lat` & `lng` numbers. Optional.' +
      '\n\t- `           If using this option, a `map` must' +
      '\n\t              also be defined.';
  }

  var overlayOptions = Object.assign( {}, defaultOptions( options ), options )

  var self = this;

  this._html;
  this._marker = overlayOptions.marker;
  this._map = overlayOptions.map;
  this._position = overlayOptions.position
  this._eventHandlers = overlayOptions.on || {}
  this._eventListeners = []
  this._isOpen = false;
  this._options = overlayOptions;
  // Setup
  if ( this._marker && overlayOptions.openOnMarkerClick ) {
    var markerClickHandler = clickToOpen;
    if ( overlayOptions.toggleOnMarkerClick ) markerClickHandler = clickToToggle;
    this.trackListener( google.maps.event.addListener( self._marker, 'click', markerClickHandler ), true )
  }
  if ( this._marker && overlayOptions.openOnInitialization ) {
    if ( ! this.getMap() ) this.open()
  }

  // Interaction handler options
  function clickToOpen () {
    if ( ! self.getMap() ) self.open()
  }

  function clickToToggle () {
    if ( self.getMap() ) self.close()
    else self.open()
  }
}

OverlayPopup.prototype = Object.create( google.maps.OverlayView.prototype )
OverlayPopup.prototype.constructor = OverlayPopup;

OverlayPopup.prototype.callEventHandler = callEventHandler;
OverlayPopup.prototype.trackListener = trackListener;
OverlayPopup.prototype.clearEventListeners = clearEventListeners;
OverlayPopup.prototype.isOpen = isOpen;
OverlayPopup.prototype.open = open;
OverlayPopup.prototype.draw = draw;
OverlayPopup.prototype.close = close;
OverlayPopup.prototype.remove = remove;
OverlayPopup.prototype.setContent = setContent;
OverlayPopup.prototype.setPosition = setPosition;
OverlayPopup.prototype.setWrapperClass = setWrapperClass;
OverlayPopup.prototype.getWrapper = getWrapper;
OverlayPopup.prototype.onAdd = onAdd;
OverlayPopup.prototype.onRemove = onRemove;
OverlayPopup.prototype.getMapInnerBounds = getMapInnerBounds;
OverlayPopup.prototype.reposition = reposition;
OverlayPopup.prototype.resize = resize;

// --- Overlay Prototype Functions : start ---

function callEventHandler( event ) {
  var fn = this._eventHandlers[ event ]
  if ( typeof fn !== 'function' ) return;
  return fn.apply( this )
}

function trackListener( listener, persistent ) {
  this._eventListeners.push( { listener: listener, persistent: persistent } )
}

function clearEventListeners ( clearPersistent ) {
  if ( isArrayWithItems( this._eventListeners ) ) {
    this._eventListeners.forEach( function ( eventListener ) {
      if ( clearPersistent || ! eventListener.persistent ) {
        google.maps.event.removeListener( eventListener.listener )
        eventListener.listener = null;
      }
    } )
    this._eventListeners = this._eventListeners.filter( function ( eventListener ) {
      return eventListener.listener !== null;
    } )
  }
}

function isOpen () {
  return self._isOpen()
}

function open () {
  var beforeOpenResult = this.callEventHandler( 'beforeOpen' )
  if ( beforeOpenResult !== undefined && ! beforeOpenResult ) {
    return
  }
  if ( this._marker ) {
    this.setMap( this._marker.getMap() )
  }
  else if( this._map && this._position ) {
    this.setMap( this._map )
  }
}

function close () {
  var beforeCloseResult = this.callEventHandler( 'beforeClose' )
  if ( beforeCloseResult !== undefined && ! beforeCloseResult ) {
    return
  }

  this.clearEventListeners()
  this.setMap( null )
}

function remove () {
  if ( this.getMap() ) this.setMap( null )
  this.clearEventListeners( true )
}

function setContent ( content ) {
  this._options.content = content;
  if ( this._html && this._html.content ) {
    setHTML( this._html.content, content )
  }
}

function setPosition ( latLng ) {
  if ( this._isOpen && this._position ) {
    this.draw()
    this.resize()
    this.reposition()
  }
}

function setWrapperClass ( wrapperClass ) {
  if ( this._html && this._html.wrapper ) {
    this._html.wrapper.className = classPrefix + '-wrapper-'+ this._options.placement;
    if ( this._options.border ) {
      this._html.wrapper.className += ( ' ' + classPrefix + '-has-border' )
    }
    if ( wrapperClass ) {
      this._html.wrapper.className += ( ' ' + wrapperClass )
    }
  }
  this._options.wrapperClass = wrapperClass;
}

function getWrapper () {
  if ( this._html ) {
    return this._html.wrapper;
  }
  return null;
}

function draw () {
  if ( ! this.getMap() || ! this._html ) {
    return;
  }
  if ( ! this._marker && ! this._position ) {
    return;
  }
  var offset = this._options.offset;
  if ( offset ) {
    if ( offset.left ) {
      this._html.wrapper.style.marginLeft = offset.left;
    }
    if ( offset.top ) {
      this._html.wrapper.style.marginTop = offset.top;
    }
  }

  var backgroundColor = this._options.backgroundColor;
  if ( backgroundColor ) {
    this._html.contentWrapper.style.backgroundColor = backgroundColor;
    if ( this._options.pointer ) {
      var borderClass = 'border' + capitalize( this._options.placement ) + 'Color'
      this._html.pointerBackground.style[ borderClass ] = backgroundColor;
    }
  }

  if ( this._options.padding ) {
    this._html.contentWrapper.style.padding = this._options.padding;
    if ( this._options.shadow ) {
      this._html.shadowFrame.style.padding = this._options.padding;
    }
  }

  if ( this._options.borderRadius ) {
    this._html.contentWrapper.style.borderRadius = this._options.borderRadius;
    if ( this._options.shadow ) {
      this._html.shadowFrame.style.borderRadius = this._options.borderRadius;
    }
  }

  if ( this._options.fontSize ) {
    this._html.wrapper.style.fontSize = this._options.fontSize;
  }

  if ( this._options.fontColor ) {
    this._html.contentWrapper.style.color = this._options.fontColor;
  }

  if ( this._options.pointer && this._options.pointer !== true ) {
    if ( this._options.shadow ) {
      this._html.shadowPointer.style.width = this._options.pointer;
      this._html.shadowPointer.style.height = this._options.pointer;
    }
    if ( this._html.pointerBorder ) {
      this._html.pointerBorder.style.borderWidth = this._options.pointer;
    }
    this._html.pointerBackground.style.borderWidth = this._options.pointer;
  }

  if ( this._options.border ) {
    var borderWidth = 0;
    if ( this._options.border.width ) {
      borderWidth = parseAttribute( this._options.border.width, '0px' )
      this._html.contentWrapper.style.borderWidth = borderWidth.value + borderWidth.units;
    }
    var totalBorderWidth = this._html.contentWrapper.offsetWidth - this._html.contentWrapper.clientWidth
    var singleBorderWidth = parseAttribute( Math.round( totalBorderWidth / 2.0 ) + 'px', '0px' )

    if ( this._options.pointer ) {
      var pointerLength = Math.min( this._html.pointerBorder.offsetHeight,
                                    this._html.pointerBorder.offsetWidth )
      var pointerLengthAttribute = parseAttribute( pointerLength + 'px', '0px' )

      var root2 = 1.41421356237;
      var triangleHeight = Math.round( singleBorderWidth.value * ( root2 - 1 ) )
      var triangleDifference = Math.min( triangleHeight, singleBorderWidth.value )

      var pointerBorderWidth = pointerLengthAttribute.value - triangleDifference;
      this._html.pointerBackground.style.borderWidth = ( pointerBorderWidth + 1 ) + pointerLengthAttribute.units

      var oppositePlacementValue = oppositePlacement( this._options.placement )
      var oppositePlacementClass = 'margin' + capitalize( oppositePlacementValue )
      this._html.pointerBackground.style[ oppositePlacementClass ] = triangleDifference + singleBorderWidth.units;
      this._html.pointerBackground.style[ this._options.placement ] = -( singleBorderWidth.value + 1 ) + singleBorderWidth.units;
    }

    var borderColor = this._options.border.color;
    if ( borderColor ) {
      this._html.contentWrapper.style.borderColor = borderColor;
      if ( this._html.pointerBorder ) {
        var pointerBorderClass = 'border' + capitalize( this._options.placement ) + 'Color'
        this._html.pointerBorder.style[ pointerBorderClass ] = borderColor;
      }
    }
  }


  var shadow = this._options.shadow;
  if ( shadow ) {
    var keyInShadow = keyIsSetInObject( shadow )
    if ( keyInShadow( 'h' ) || keyInShadow( 'v' ) || keyInShadow( 'blur' ) ||
         keyInShadow( 'spread' ) || keyInShadow( 'color' ) ) {

      var horizontalOffset = parseAttribute( shadow.h, defaultShadow().h )
      var verticalOffset = parseAttribute( shadow.v, defaultShadow().v )
      var blur = parseAttribute( shadow.blur, defaultShadow().blur )
      var spread = parseAttribute( shadow.spread, defaultShadow().spread )
      var color = shadow.color || defaultShadow().color;

      var formatShadowBox = function ( h, v ) {
        return [ h, v, blur.original, spread.original, color ].join( ' ' )
      }

      var boxShadow = formatShadowBox( horizontalOffset.original, verticalOffset.original )
      this._html.shadowFrame.style.boxShadow = boxShadow;

      if ( this._html.shadowPointerInner ) {
        // rotate the box shadow
        var inverseRoot2 = 0.7071067811865474;
        var horizontalRotated = ( inverseRoot2 * ( horizontalOffset.value - verticalOffset.value ) ) + horizontalOffset.units;
        var verticalRotated = ( inverseRoot2 * ( horizontalOffset.value + verticalOffset.value ) ) + verticalOffset.units;
        this._html.shadowPointerInner.style.boxShadow = formatShadowBox( horizontalRotated, verticalRotated )
      }
    }

    if ( this._options.shadow.opacity ) {
      this._html.shadowWrapper.style.opacity = this._options.shadow.opacity;
    }
  }

  var divPixel = this.getProjection().fromLatLngToDivPixel( this._position || this._marker.position )
  if ( divPixel ) {
    this._html.floatWrapper.style.top = Math.floor( divPixel.y ) + 'px'
    this._html.floatWrapper.style.left = Math.floor( divPixel.x ) + 'px'
  }
  if ( ! this._isOpen ) {
    this._isOpen = true;
    this.resize()
    this.reposition()
    this.callEventHandler( 'afterOpen' )
    google.maps.event.trigger( this.getMap(), eventPrefix + '-opened', this )
  }

}

function onAdd () {
  if ( this._html ) return;
  var self = this;

  this._html = {}

  // Create the wrapper
  this._html.wrapper = newElement()
  this.setWrapperClass( this._options.wrapperClass )

  // Create the shadow
  if ( this._options.shadow ) {
    this._html.shadowWrapper = newElement( 'shadow-wrapper-' + this._options.placement )
    this._html.shadowFrame = newElement( 'frame', 'shadow-frame' )
    this._html.shadowWrapper.appendChild( this._html.shadowFrame )

    if ( this._options.pointer ) {
      this._html.shadowPointer = newElement( 'shadow-pointer-' + this._options.placement )
      this._html.shadowPointerInner = newElement( 'shadow-inner-pointer-' + this._options.placement )
      this._html.shadowPointer.appendChild( this._html.shadowPointerInner )
      this._html.shadowWrapper.appendChild( this._html.shadowPointer )
    }

    this._html.wrapper.appendChild( this._html.shadowWrapper )
  }

  // Create the content
  this._html.contentWrapper = newElement( 'frame', 'content-wrapper' )
  this._html.content = newElement( 'content' )
  if ( this._options.content ) {
    setHTML( this._html.content, this._options.content )
  }

  // Create the close button
  if ( this._options.showCloseButton ) {
    // TODO: check to see if `content` includes `.close-button`. if so, hook into that for closing
    if ( this._options.closeButtonMarkup ) {
      var closeButtonElement = newElement()
      setHTML( closeButtonElement, this._options.closeButtonMarkup )
      this._html.closeButton = closeButtonElement.firstChild;
    }
    else {
      this._html.closeButton = document.createElement( 'button' )
      this._html.closeButton.setAttribute( 'type', 'button' )
      this._html.closeButton.innerHTML = 'X'
      applyCSS( this._html.closeButton, [ 'close-button' ] )
    }
    this._html.contentWrapper.appendChild( this._html.closeButton )
  }
  this._html.contentWrapper.appendChild( this._html.content )
  this._html.wrapper.appendChild( this._html.contentWrapper )

  // Create the pointer, the connection between marker & popup
  if ( this._options.pointer ) {
    if ( this._options.border ) {
      this._html.pointerBorder = newElement(
        'pointer-' + this._options.placement,
        'pointer-border-' + this._options.placement,
      )
      this._html.wrapper.appendChild( this._html.pointerBorder )
    }
    this._html.pointerBackground = newElement(
      'pointer-' + this._options.placement,
      'pointer-background-' + this._options.placement,
    )
    this._html.wrapper.appendChild( this._html.pointerBackground )
  }

  // Create an outer wrapper
  this._html.floatWrapper = newElement( 'float-wrapper' )
  this._html.floatWrapper.appendChild( this._html.wrapper )

  // Add wrapper to Google Maps float pane
  this.getPanes().floatPane.appendChild( this._html.floatWrapper )

  // Add the event listeners
  var map = this.getMap()
  this.clearEventListeners()
  if ( this._options.closeOnMapClick ) {
    this.trackListener( google.maps.event.addListener( map, 'click', function () {
      self.close()
    } ) )
  }
  if ( this._options.closeWhenOthersOpen ) {
    this.trackListener( google.maps.event.addListener( map, eventPrefix + '-opened', function ( other ) {
      if ( self !== other ) self.close();
    } ) )
  }

  // Clear previous map bounds
  this._previousWidth = null;
  this._previousHeight = null;
  this.trackListener( google.maps.event.addListener( map, 'bounds_changed', function () {
    var mapDiv = map.getDiv()
    var offsetWidth = mapDiv.offsetWidth;
    var offsetHeight = mapDiv.offsetHeight;
    var previousWidth = self._previousWidth;
    var previousHeight = self._previousHeight;
    if ( previousWidth === null || previousHeight === null ||
         previousWidth !== offsetWidth || previousHeight !== offsetHeight ) {

      self._previousWidth = offsetWidth;
      self._previousHeight = offsetHeight;
      self.resize()
    }
  } ) )

  // Update marker position if it is moved
  if ( this._marker ) {
    this.trackListener( google.maps.event.addListener( this._marker, 'position_changed', function () {
      self.draw()
    } ) )
  }

  // Close button
  if ( this._options.showCloseButton && ! this._options.closeButtonMarkup ) {
    this.trackListener( google.maps.event.addDomListener( this._html.closeButton, 'click', function ( event ) {
      event.cancelBubble = true;
      if ( event.stopPropagation ) event.stopPropagation()
      self.close()
    } ) )
  }

  // Stop mouse event propogation while interacting with the popup
  var mouseEvents = [
    'click',
    'dblclick',
    'rightclick',
    'contextmenu',
    'drag',
    'dragend',
    'dragstart',
    'mousedown',
    'mouseout',
    'mouseover',
    'mouseup',
    'touchstart',
    'touchend',
    'touchmove',
    'wheel',
    'mousewheele',
    'DOMMouseScroll',
    'MozMousePixelScroll'
  ]
  mouseEvents.forEach( function ( mouseEvent ) {
    self.trackListener( google.maps.event.addDomListener( self._html.wrapper, mouseEvent, function ( event ) {
      event.cancelBubble = true;
      if ( event.stopPropagation ) event.stopPropagation()
    } ) )
  } )

  this.callEventHandler( 'open' )

  // End of `onAdd`
  
  // `onAdd` helpers

  function applyCSS ( element, classList ) {
    if ( element && classList ) {
      for (var i = 0; i < classList.length; i++) {
        var className = classList[ i ]
        if ( className ) {
          if ( element.className ) {
            element.className += ' ';
          }
          element.className += classPrefix + '-' + className
        }
      }
    }
  }

  function newElement () {
    // arguments is a list of classes
    var element = document.createElement( 'div' )
    applyCSS.call( null, element, arguments )
    return element;
  }
}

function onRemove () {
  this.callEventHandler( 'close' )
  if ( this._html ) {
    var parentElement = this._html.floatWrapper.parentElement;
    if ( parentElement ) {
      parentElement.removeChild( this._html.floatWrapper )
    }
    this._html = null;
  }
  this._isOpen = false;
  this.callEventHandler( 'afterClose' )
}

function getMapInnerBounds () {
  var mapBounds = this.getMap().getDiv().getBoundingClientRect()
  var mapInnerBounds = {
    top: mapBounds.top + this._options.edgeOffset.top,
    right: mapBounds.right - this._options.edgeOffset.right,
    bottom: mapBounds.bottom - this._options.edgeOffset.bottom,
    left: mapBounds.left + this._options.edgeOffset.left,
  }
  mapInnerBounds.width = mapInnerBounds.right - mapInnerBounds.left;
  mapInnerBounds.height = mapInnerBounds.bottom - mapInnerBounds.top;
  return mapInnerBounds;
}

function reposition () {
  if ( ! this._options.panOnOpen || ! this._html ) return;
  var self = this;

  var mapInnerBounds = this.getMapInnerBounds()
  var wrapperBounds = this._html.wrapper.getBoundingClientRect()
  
  // pan map to include popup bounds.
  var dx = 0;
  var dy = 0;

  if ( mapInnerBounds.left >= wrapperBounds.left ) {
    dx = wrapperBounds.left - mapInnerBounds.left;
  }
  else if ( mapInnerBounds.right <= wrapperBounds.right ) {
    dx = wrapperBounds.left - ( mapInnerBounds.right - wrapperBounds.width )
  }
  if ( mapInnerBounds.top >= wrapperBounds.top ) {
    dy = wrapperBounds.top - mapInnerBounds.top;
  }
  else if ( mapInnerBounds.bottom <= wrapperBounds.bottom ) {
    dy = wrapperBounds.top - ( mapInnerBounds.bottom - wrapperBounds.height )
  }

  if ( dx !== 0 || dy !== 0 ) {
    var afterPanListener = google.maps.event.addListener( this.getMap(), 'idle', function () {
      google.maps.event.removeListener( afterPanListener )
      afterPanListener = null;
      scrollWindowForPopup()
    } )
    this.getMap().panBy( dx, dy )
  }
  else {
    scrollWindowForPopup()
  }

  function scrollWindowForPopup () {
    // scroll window to include popup bounds.
    var wrapperBounds = self._html.wrapper.getBoundingClientRect()
    if ( wrapperBounds.top < 0 ) {
      if ( typeof window.scrollBy === 'function' )  {
        window.scrollBy( 0, wrapperBounds.top )
      }
    }

  }
}

// Resize the popup to fit within the map bounds & edge offset
function resize () {
  if ( ! this._html ) return;
  var mapInnerBounds = this.getMapInnerBounds()

  // Respect max width
  maxWidth = mapInnerBounds.width;
  if ( this._options.maxWidth !== undefined ) {
    maxWidth = Math.min( maxWidth, this._options.maxWidth )
  }
  maxWidth -= ( this._html.wrapper.offsetWidth - this._html.content.offsetWidth )
  this._html.content.style.maxWidth = maxWidth + 'px'
}

// --- Overlay Prototype Functions : end ---

// --- Defaults ---

function defaultShadow () {
  return { 
    h: '0px',
    v: '3px',
    blur: '6px',
    spread: '0px',
    color: '#000',
  }
}

function defaultOptions ( constructorOptions ) {
  var defaults = {
    placement: 'top',
    maxWidth: '360px',
    pointer: true,
    openOnMarkerClick: true,
    toggleOnMarkerClick: true,
    closeOnMapClick: true,
    showCloseButton: true,
    panOnOpen: true,
    openOnInitialization: false,
    closeWhenOthersOpen: true,
    edgeOffset: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    }
  }

  if ( constructorOptions.position && ! constructorOptions.offset ) {
    defaults.offset = {
      top: '0px',
      left: '0px',
    }
  }

  return defaults;
}

// --- Utilities ---

/**
 * Validate options expects an object that contains keys that
 * will define an OverlayPopup. Must include two keys:
 *
 * - `content`: A string or DOM element.
 *
 * And either one of the following:
 * 
 * - `marker`:     A google.maps.Marker instance.
 *
 * Or
 * 
 * - `map`:     A google.maps.Marker instance.
 * - `position`:   An object with `lat` & `lng` numbers
 * 
 * @param  {object} options
 * @param  {object} options.marker
 * @param  {object|string} options.content
 * @return {boolean} isValid    Are the options valid.
 */
function validateOptions ( options ) {
  if ( ! isObject( options ) ) return false;

  var hasContent = options.hasOwnProperty( 'content' ) &&
                   options.content;

  var hasMarker =  options.hasOwnProperty( 'marker' ) &&
                   options.marker instanceof google.maps.Marker;

  var hasMapPosition = options.hasOwnProperty( 'map' ) &&
                       options.map instanceof google.maps.Map &&
                       options.hasOwnProperty( 'position' ) &&
                       isPosition( options.position )

  if ( options.placement ) {
    if ( options.placement !== 'top' &&
         options.placement !== 'bottom' &&
         options.placement !== 'left' &&
         options.placement !== 'right' ) {
      var placementErrorMessage = 'Could not initialize OverlayPopup.' +
        '\nThe `placement` key in the options should be one of the following:' +
        '\n\t- top' +
        '\n\t- bottom' +
        '\n\t- left' +
        '\n\t- right'
      throw new Error( placementErrorMessage )
    }
  }

  return hasContent && ( hasMarker || hasMapPosition );
}

function capitalize ( str ) {
  return str.charAt( 0 ).toUpperCase() + str.slice( 1 )
}

/**
 * Given a CSS attribute value string, and a default value
 * return an object that includes has keys for the
 * `value`, `units` & original attribute value.
 * 
 * @param  {string} attribute    The attribute string to parse.
 * @param  {string} defaultValue The default value if the `attribute` is falsey.
 * @return {object} parsed       The parsed attribute object.
 */
function parseAttribute ( attribute, defaultValue ) {
  // splits the number & unit into two groups.
  // ie '1em' => [ '1em', '1', undefined, 'em' ]
  var numberUnitRegex = /^(-{0,1}\.{0,1}\d+(\.\d+)?)[\s|\.]*(\w*)$/;
  if ( attribute && numberUnitRegex.test( attribute ) ) {
    var numberUnitResult = numberUnitRegex.exec( attribute )
    var number = numberUnitResult[ 1 ]
    var units = numberUnitResult[ 3 ] || 'px';
    return {
      value: +number,
      units: units,
      original: attribute,
    }
  }
  if ( defaultValue ) {
    return parseAttribute( defaultValue )
  }
  throw new Error( 'Could not parse:', attribute )
}

/**
 * Set the HTML of the container.
 * Supports both text & a single DOM Element
 * @param {object}        container DOM element whose HTML will be set.
 * @param {string|object} content   String of HTML or DOM element to set
 *                                  as the content of `container`
 * @return {boolean}      wasSet    Was the container element set?
 */
function setHTML ( container, content ) {
  var wasSet = false;
  if ( container ) {
    // Remove existing content first
    while( container.firstChild ) {
      container.remove( container.firstChild )
    }
    if ( content ) {
      if ( typeof content === 'string' ) {
        container.innerHTML = content;
      }
      else {
        container.appendChild( content )
      }
      wasSet = true;
    }
  }
  return wasSet;
}

/**
 * Given a marker placement ( top, bottom, left, right )
 * return the opposite placement.
 * 
 * @param  {string} placement The current placement
 * @return {string} opposite  The opposite placement.
 */
function oppositePlacement ( placement ) {
  if ( placement === 'top' ) return 'bottom';
  if ( placement === 'bottom' ) return 'top';
  if ( placement === 'left' ) return 'right';
  if ( placement === 'right' ) return 'left';
  throw new Error( 'Could not find placement for invalid placement: ', placement )
}

/**
 * Given an object, `obj`, return a function that will
 * return true if the `key` passed into the function
 * is defined within the `obj`.
 * 
 * @param  {object} obj         The object to inspect
 * @return {function} keyIsSet  Call with a key to see if it in `obj`
 */
function keyIsSetInObject ( obj ) {
  return function keyIsSet ( key ) {
    var value = obj[ key ]
    return value !== undefined && value !== null;
  }
}
