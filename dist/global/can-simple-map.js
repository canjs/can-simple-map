/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val){
		var parts = name.split("."),
			cur = global,
			i, part, next;
		for(i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if(!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod){
		if(!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, "default": true };
		for(var p in mod) {
			if(!esProps[p]) return false;
		}
		return true;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if(globalExport && !get(globalExport)) {
			if(useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*can-simple-map@3.2.0-pre.3#single-reference*/
define('can-simple-map/single-reference', function (require, exports, module) {
    (function (global) {
        var canReflect = require('can-reflect/reflections/get-set/get-set');
        var CID = require('can-cid');
        var singleReference;
        singleReference = {
            set: function (obj, key, value, extraKey) {
                canReflect.set(obj, extraKey ? CID(key) + ':' + extraKey : CID(key), value);
            },
            getAndDelete: function (obj, key, extraKey) {
                var cid = extraKey ? CID(key) + ':' + extraKey : CID(key);
                var value = canReflect.get(obj, cid);
                canReflect.delete(obj, cid);
                return value;
            }
        };
        module.exports = singleReference;
    }(function () {
        return this;
    }()));
});
/*can-simple-map@3.2.0-pre.3#can-simple-map*/
define('can-simple-map', function (require, exports, module) {
    var Construct = require('can-construct');
    var canEvent = require('can-event');
    var canBatch = require('can-event/batch/batch');
    var assign = require('can-util/js/assign/assign');
    var each = require('can-util/js/each/each');
    var types = require('can-types');
    var Observation = require('can-observation');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var singleReference = require('can-simple-map/single-reference');
    var SimpleMap = Construct.extend({
        setup: function (initialData) {
            this._data = {};
            this.attr(initialData);
        },
        attr: function (prop, value) {
            var self = this;
            if (arguments.length === 0) {
                Observation.add(this, '__keys');
                var data = {};
                each(this._data, function (value, prop) {
                    Observation.add(this, prop);
                    data[prop] = value;
                }, this);
                return data;
            } else if (arguments.length > 1) {
                var had = this._data.hasOwnProperty(prop);
                var old = this._data[prop];
                this._data[prop] = value;
                canBatch.start();
                if (!had) {
                    canEvent.dispatch.call(this, '__keys', []);
                }
                canEvent.dispatch.call(this, prop, [
                    value,
                    old
                ]);
                canBatch.stop();
            } else if (typeof prop === 'object') {
                canReflect.eachKey(prop, function (value, key) {
                    self.attr(key, value);
                });
            } else {
                if (prop !== 'constructor') {
                    Observation.add(this, prop);
                    return this._data[prop];
                }
                return this.constructor;
            }
        },
        serialize: function () {
            var serialized = {};
            Observation.add(this, '__keys');
            each(this._data, function (data, prop) {
                Observation.add(this, prop);
                serialized[prop] = data && typeof data.serialize === 'function' ? data.serialize() : data;
            }, this);
            return serialized;
        },
        get: function () {
            return this.attr.apply(this, arguments);
        },
        set: function () {
            return this.attr.apply(this, arguments);
        }
    });
    assign(SimpleMap.prototype, canEvent);
    var oldIsMapLike = types.isMapLike;
    types.isMapLike = function (obj) {
        if (obj instanceof SimpleMap) {
            return true;
        }
        return oldIsMapLike.call(this, obj);
    };
    if (!types.DefaultMap) {
        types.DefaultMap = SimpleMap;
    }
    SimpleMap.prototype[canSymbol.for('can.onKeyValue')] = function (key, handler) {
        var translationHandler = function (ev, newValue, oldValue) {
            handler.call(this, newValue, oldValue);
        };
        singleReference.set(handler, this, translationHandler, key);
        this.addEventListener(key, translationHandler);
    };
    SimpleMap.prototype[canSymbol.for('can.offKeyValue')] = function (key, handler) {
        this.removeEventListener(key, singleReference.getAndDelete(handler, this, key));
    };
    SimpleMap.prototype[canSymbol.for('can.isMapLike')] = true;
    SimpleMap.prototype[canSymbol.for('can.isListLike')] = false;
    SimpleMap.prototype[canSymbol.for('can.isValueLike')] = false;
    SimpleMap.prototype[canSymbol.for('can.getKeyValue')] = SimpleMap.prototype.get;
    SimpleMap.prototype[canSymbol.for('can.setKeyValue')] = SimpleMap.prototype.set;
    SimpleMap.prototype[canSymbol.for('can.getValue')] = SimpleMap.prototype.get;
    SimpleMap.prototype[canSymbol.for('can.setValue')] = SimpleMap.prototype.set;
    SimpleMap.prototype[canSymbol.for('can.deleteKeyValue')] = function (prop) {
        return this.attr(prop, undefined);
    };
    SimpleMap.prototype[canSymbol.for('can.keyHasDependencies')] = function (key) {
        return false;
    };
    SimpleMap.prototype[canSymbol.for('can.getKeyDependencies')] = function (key) {
        return undefined;
    };
    module.exports = SimpleMap;
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();