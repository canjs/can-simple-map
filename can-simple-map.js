var Construct = require("can-construct");
var eventQueue = require("can-event-queue");
var queues = require("can-queues");
var each = require("can-util/js/each/each");
var types = require("can-types");
var ObservationRecorder = require("can-observation-recorder");
var canReflect = require("can-reflect");
var CIDMap = require("can-cid/map/map");

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
			if(initialData && typeof initialData === "object") {
				this.attr(initialData);
			}
		},
		// ### attr
		// The main get/set interface simple-map.
		// Either sets or gets one or more properties depending on how it is called.
		attr: function(prop, value) {
			var self = this;

			if(arguments.length === 0 ) {
				ObservationRecorder.add(this,"__keys");
				var data = {};
				each(this._data, function(value, prop){
					ObservationRecorder.add(this, prop);
					data[prop] = value;
				}, this);
				return data;
			}
			else if(arguments.length > 1) {
				var had = this._data.hasOwnProperty(prop);
				var old = this._data[prop];
				this._data[prop] = value;
				queues.batch.start();
				if(!had) {
					this.dispatch("__keys", []);
				}
				this.dispatch(prop, [value, old]);
				queues.batch.stop();
			}
			// 1 argument
			else if(typeof prop === 'object') {
				queues.batch.start();
				canReflect.eachKey(prop, function(value, key) {
					self.attr(key, value);
				});
				queues.batch.stop();
			}
			else {
				if(prop !== "constructor") {
					ObservationRecorder.add(this, prop);
					return this._data[prop];
				}

				return this.constructor;
			}
		},
		serialize: function(){
			return canReflect.serialize(this, CIDMap);
		},
		get: function(){
			return this.attr.apply(this, arguments);
		},
		set: function(){
			return this.attr.apply(this, arguments);
		}
	});

eventQueue(SimpleMap.prototype);

if(!types.DefaultMap) {
	types.DefaultMap = SimpleMap;
}


canReflect.assignSymbols(SimpleMap.prototype,{
	// -type-
	"can.isMapLike": true,
	"can.isListLike": false,
	"can.isValueLike": false,

	// -get/set-
	"can.getKeyValue": SimpleMap.prototype.get,
	"can.setKeyValue": SimpleMap.prototype.set,
	"can.deleteKeyValue": function(prop) {
		return this.attr(prop, undefined);
	},


	// -shape
	"can.getOwnEnumerableKeys": function(){
		ObservationRecorder.add(this, '__keys');
		return Object.keys(this._data);
	},

	// -shape get/set-
	"can.assignDeep": function(source){
		queues.batch.start();
		// TODO: we should probably just throw an error instead of cleaning
		canReflect.assignMap(this, source);
		queues.batch.stop();
	},
	"can.updateDeep": function(source){
		queues.batch.start();
		// TODO: we should probably just throw an error instead of cleaning
		canReflect.updateMap(this, source);
		queues.batch.stop();
	},
	"can.keyHasDependencies": function(key) {
		return false;
	},
	"can.getKeyDependencies": function(key) {
		return undefined;
	}
});

// Setup other symbols


module.exports = SimpleMap;
