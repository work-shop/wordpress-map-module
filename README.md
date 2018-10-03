# work-shop wordpress map module

This module was designed to streamline the development process of maps that get placed on Wordpress sites produced by Work-Shop.


### Installation

Install via npm. `npm install @work-shop/map-module`.


### Usage

The basic module usage looks like this:

```HTML
<head>
  <!-- Basic map styles -->
  <link rel="stylesheet" href="map-style.css">

  <!-- Project specific map styles -->
  <link rel="stylesheet" href="map-usage.css">
</head>
<body>
  <!-- Options for the map -->
  <script>var mapOptions = { data: mapData };</script>

  <!-- Where should the map load? -->
  <div class="map-div" data-options="mapOptions"></div>

  <!-- Google Maps API -->
  <script src="https://maps.googleapis.com/maps/api/js?v=3&key=AIzaSyDTkjwJK80N7YCWoKjhKz8c3J1tNEbJpRg" async defer></script>

  <!-- Bundle that includes map module & initialization calls. -->
  <script src="browserify'd-bundle.js"></script>
</body>
```

```JavaScript
// browserify'd-bundle.js
var mapModule = require( '@work-shop/map-module' )
var maps = mapModule( { selector: '.map-div' } )
```

See the [development](development) directory for more usage examples. 

- [`development/public/index.html`][dev-index-html] includes a series of examples. Markup that is required to make the map module work is prefixed with `Required:`. 
- [`development/index.js`][dev-index-js] includes various initialization methods & options.
- [`development/public/map-usage.css`](development/public/map-usage.css) includes sample styles for using the map module.


### Development

To develop the module: `npm run dev`. This will start a local development server, using files within the [development](development) directory as a place to initialize examples within. The source for the module itself lives in [src](src).

- [`src/initializer.js`](src/initializer.js) is an initialization layer that can be used to create any number of map instances using the `{ selector }` option.
- [`src/index.js`](src/index.js) is the map class that can be used to initialize a single map instance.
- [`src/map-style.css`](src/map-style.css) is the style sheet that establishes basic necessary styles for the map.


### Publish

To publish, the npm user must be part of the same team as the owner of the package. Then run:

`npm publish --access public`


### HTML API

The HTML API entrypoint is [`src/initializer.js`](src/initializer.js).

`selector`: The map DOM element should have a `class` or `id` that can be used to select it for initializing a map instance.

```
<!-- Basic example -->
<div class="map-div"></div>
```

`data-options`: Optionally, use this attribute to define the name of a global variable that carries options for initializing the map. Including map options, data to load, and render options. 

```
<!-- Example with options. -->
<script>var mapOptions = { data: mapData };</script>
<div class="map-div" data-options="mapOptions"></div>
```


### JS API

**[`src/initializer.js`](src/initializer.js)** ( default entry point )

`Initializer( options ) => [ Maps ]` returns an array of Map objects. Each Map object is initialized with the `options` passed into the function, and extended by any local options defined by the HTML API.


**[`src/index.js`](src/initializer.js)**

`Map( options )` returns a Map object and is initialized with the `options` passed into the function. The Map object that can be used to set the data on the Map, render the data as features on the Map, and remove the features that have been previously rendered to the Map.

`map.data( mapData? )` returns the current map data object when no arugments are passed in. Otherwise the `mapData` argument passed in is set as the maps current data. `mapData` is expected to be a single object with a `marker` key that defines options for rendering a Marker. Otherwise, it can be an array of objects with the same shape. When more map features are supported at this higher level, the `mapData` object can be expected to take on different shapes to support those other types of features.

`map.render( renderOptions? )` returns the current map API object and will render the current `mapData`.

`map.removeFeatures()` returns nothing and does the opposite of the `render` function. It removes all features from the map.


**[`src/marker.js`](src/marker.js)**

`Marker( options )` returns a Marker object and is initialized with the `options` passed into the function. The Marker object can be used to render or remove the Marker from its map.

`marker.render()` returns the current marker API object and will render the marker on its map.

`marker.remove()` returns the current marker API object and will remove the marker from its map.

Marker `options` that include a `popup` key will have an OverlayPopup object created for the Marker.


**[`src/overlay-popup.js`](src/overlay-popup.js)**

`OverlayPopup( options )` returns an OverlayPopup object and is initialized with the options passed into the function. This object extends the [`google.maps.OverlayView.prototype`](https://developers.google.com/maps/documentation/javascript/customoverlays#add).


### Styling Tiles

**[`src/tile-style.json`](src/tile-style.json)** is a default set of tile styles in the form of a JSON object, which is how Google Maps allows for customizing tile styles. These can be overriden using the `styles` key of the `options` object that is passed into the Map.

To create tile style JSON objects, use one of the following services that allow you to import and export these JSON tile style representations.

- [Styles with Google](https://mapstyle.withgoogle.com)
- [Snazzy Maps Editor](https://snazzymaps.com/editor)

[dev-index-js]:development/index.js
[dev-index-html]:development/public/index.html
