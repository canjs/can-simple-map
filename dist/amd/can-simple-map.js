/*can-simple-map@3.2.0-pre.5#can-simple-map*/
define(function (require, exports, module) {
    var Construct = require('can-construct');
    var canEvent = require('can-event');
    var canBatch = require('can-event/batch');
    var assign = require('can-util/js/assign');
    var each = require('can-util/js/each');
    var types = require('can-types');
    var Observation = require('can-observation');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var singleReference = require('can-util/js/single-reference');
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