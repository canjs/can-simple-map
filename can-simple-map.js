var Construct = require("can-construct");
var canEvent = require("can-event");
var assign = require("can-util/js/assign/assign");
var types = require("can-util/js/types/types");
var Observation = require("can-observation");

// this is a very simple can-map like object
var SimpleMap = Construct.extend(
	/**
	 * @prototype
	 */
	{
		// ### setup
		// A setup function for the instantiation of a simple-map.
		setup: function(){
			this._data = {};
		},
		// ### init
		// Called when a new instance of a simple-map is created.
		init: function(initialData) {
			this.attr(initialData);
		},
		// ### attr
		// The main get/set interface simple-map.
		// Either sets or gets one or more properties depending on how it is called.
		attr: function(prop, value) {
			var self = this;

			if(arguments.length > 1) {
				var old = this._data[prop];
				this._data[prop] = value;
				canEvent.dispatch.call(this, prop, [value, old]);
			} else if(typeof prop === 'object') {
				Object.keys(prop).forEach(function(key) {
					self.attr(key, prop[key]);
				});
			} else {
				if(prop !== "constructor") {
					Observation.add(this, prop);
					return this._data[prop];
				}

				return this.constructor;
			}
		}
	});

assign(SimpleMap.prototype, canEvent);

var oldIsMapLike = types.isMapLike;
types.isMapLike = function(obj) {
	if(obj instanceof SimpleMap) {
		return true;
	}
	
	return oldIsMapLike.call(this, obj);
};

if(!types.DefaultMap) {
	types.DefaultMap = SimpleMap;
}

module.exports = SimpleMap;
