var Construct = require("can-construct");
var canEvent = require("can-event");
var canBatch = require("can-event/batch/batch");
var assign = require("can-util/js/assign/assign");
var each = require("can-util/js/each/each");
var types = require("can-types");
var Observation = require("can-observation");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var singleReference = require("can-util/js/single-reference/single-reference");

// this is a very simple can-map like object
var SimpleMap = Construct.extend(
	/**
	 * @prototype
	 */
	{
		// ### setup
		// A setup function for the instantiation of a simple-map.
		setup: function(initialData){
			this._data = {};
			this.attr(initialData);
		},
		// ### attr
		// The main get/set interface simple-map.
		// Either sets or gets one or more properties depending on how it is called.
		attr: function(prop, value) {
			var self = this;

			if(arguments.length === 0 ) {
				Observation.add(this,"__keys");
				var data = {};
				each(this._data, function(value, prop){
					Observation.add(this, prop);
					data[prop] = value;
				}, this);
				return data;
			}
			else if(arguments.length > 1) {
				var had = this._data.hasOwnProperty(prop);
				var old = this._data[prop];
				this._data[prop] = value;
				canBatch.start();
				if(!had) {
					canEvent.dispatch.call(this, "__keys", []);
				}
				canEvent.dispatch.call(this, prop, [value, old]);
				canBatch.stop();
			}
			// 1 argument
			else if(typeof prop === 'object') {
				canReflect.eachKey(prop, function(value, key) {
					self.attr(key, value);
				});
			}
			else {
				if(prop !== "constructor") {
					Observation.add(this, prop);
					return this._data[prop];
				}

				return this.constructor;
			}
		},
		serialize: function(){
			var serialized = {};
			Observation.add(this,"__keys");
			each(this._data, function(data, prop){
				Observation.add(this, prop);
				serialized[prop] = data && (typeof data.serialize === "function") ?
					data.serialize() : data;
			}, this);
			return serialized;
		},
		get: function(){
			return this.attr.apply(this, arguments);
		},
		set: function(){
			return this.attr.apply(this, arguments);
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

// Set up translations between can-event and can-reflect bindings.
SimpleMap.prototype[canSymbol.for("can.onKeyValue")] = function(key, handler){
	var translationHandler = function(ev, newValue, oldValue){
		handler.call(this, newValue, oldValue);
	};
	singleReference.set(handler, this, translationHandler, key);

	this.addEventListener(key, translationHandler);
};

SimpleMap.prototype[canSymbol.for("can.offKeyValue")] = function(key, handler){
	this.removeEventListener(key, singleReference.getAndDelete(handler, this, key) );
};

// Setup other symbols
SimpleMap.prototype[canSymbol.for("can.isMapLike")] = true;
SimpleMap.prototype[canSymbol.for("can.isListLike")] = false;
SimpleMap.prototype[canSymbol.for("can.isValueLike")] = false;
SimpleMap.prototype[canSymbol.for("can.getKeyValue")] = SimpleMap.prototype.get;
SimpleMap.prototype[canSymbol.for("can.setKeyValue")] = SimpleMap.prototype.set;
SimpleMap.prototype[canSymbol.for("can.getValue")] = SimpleMap.prototype.get;
SimpleMap.prototype[canSymbol.for("can.setValue")] = SimpleMap.prototype.set;
SimpleMap.prototype[canSymbol.for("can.deleteKeyValue")] = function(prop) {
	return this.attr(prop, undefined);
};
// SimpleMaps don't do dependent keys, so this is always false
SimpleMap.prototype[canSymbol.for("can.keyHasDependencies")] = function(key) {
	return false;
};
// ...and this is always empty
SimpleMap.prototype[canSymbol.for("can.getKeyDependencies")] = function(key) {
	return undefined;
};

module.exports = SimpleMap;
