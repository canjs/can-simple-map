var canReflect = require('can-reflect/reflections/get-set/get-set');
var CID = require("can-cid");

// TODO this is copied from can-compute/single-reference.js on the can-reflect branch,
//  which needs to be merged into can-util when reflection is deployed across the CanJS
//  ecosystem.  At that time it will be possible to delete this file and change the
//  reference to it in can-simple-map.js to use the one in can-util


var singleReference;

	singleReference = {
		// obj is a function ... we need to place `value` on it so we can retreive it
		// we can't use a global map
		set: function(obj, key, value, extraKey){
			// check if it has a single reference map
			canReflect.set(obj, extraKey ? CID(key) + ":" + extraKey : CID(key), value);
		},
		getAndDelete: function(obj, key, extraKey){
			var cid = extraKey ? CID(key) + ":" + extraKey : CID(key);
			var value = canReflect.get(obj, cid);
			canReflect.delete(obj, cid);
			return value;
		}
	};
/*}*/

module.exports = singleReference;
