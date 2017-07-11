var QUnit = require('steal-qunit');
var SimpleMap = require('./can-simple-map');
var compute = require('can-compute');
var clone = require('steal-clone');
var canSymbol = require('can-symbol');
var canReflect = require('can-reflect');

QUnit.module('can-simple-map');

QUnit.test("adds defaultMap type", function() {
	stop();
	var c = clone();

	// ensure types.DefaultMap is not impacted by
	// other map types that may have been loaded
	c.import('can-types').then(function(types) {
		c.import('./can-simple-map').then(function(SimpleMap) {
			var map = new types.DefaultMap();
			QUnit.ok(map instanceof SimpleMap);
			start();
		});
	});
});

QUnit.test("instantiates and gets events", 2, function() {
	var map = new SimpleMap({ age: 29 });

	map.on('age', function(ev, newVal, oldVal) {
		QUnit.equal(oldVal, 29);
		QUnit.equal(newVal, 30);
	});

	map.attr('age', 30);
});

QUnit.test("trying to read constructor from refs scope is ok", function(){
	var map = new SimpleMap();
	var construct = compute(function(){
		return map.attr("constructor");
	});
	construct.bind("change", function(){});
	equal(construct(), SimpleMap);
});

QUnit.test("get set and serialize", function(){
	var map = new SimpleMap();
	map.set("foo","bar");
	QUnit.equal(map.get("foo"), "bar");
	QUnit.deepEqual(map.get(), {foo: "bar"});

	map.set({zed: "ted"});

	QUnit.deepEqual(map.get(), {foo: "bar", zed: "ted"});

	QUnit.deepEqual(map.serialize(), {foo: "bar", zed: "ted"});

	var deepMap = new SimpleMap({a: "b"});

	map.set("deep", deepMap);


	QUnit.deepEqual(map.serialize(), {foo: "bar", zed: "ted", deep: {a: "b"}});
});

QUnit.test("serialize and get are observable",2, function(){

	var map = new SimpleMap();
	var c1 = compute(function(){
		return map.serialize();
	});
	var c2 = compute(function(){
		return map.get();
	});

	c1.on("change", function(ev, newValue){
		QUnit.deepEqual(newValue, {foo:"bar"}, "updated serialize");
	});

	c2.on("change", function(ev, newValue){
		QUnit.deepEqual(newValue, {foo:"bar"}, "updated get");
	});

	map.set("foo","bar");

});

test("works with can-reflect", 8, function(){
	var b = new SimpleMap({ "foo": "bar" });
	// var c = new (SimpleMap.extend({
	// 	"baz": canCompute(function(){
	// 		return b.attr("foo");
	// 	})
	// }))({ "foo": "bar", thud: "baz" });

	QUnit.equal( canReflect.getKeyValue(b, "foo"), "bar", "get value");

	var handler = function(newValue){
		QUnit.equal(newValue, "quux", "observed new value");

		// Turn off the "foo" handler but "thud" should still be bound.
		canReflect.offKeyValue(b, "foo", handler);
	};
	QUnit.ok(!canReflect.isValueLike(b), "isValueLike is false");
	QUnit.ok(canReflect.isMapLike(b), "isMapLike is true");
	QUnit.ok(!canReflect.isListLike(b), "isListLike is false");

	QUnit.ok( !canReflect.keyHasDependencies(b, "foo"), "keyHasDependencies -- false");

	canReflect.onKeyValue(b, "foo", handler);
	// Do a second binding to check that you can unbind correctly.
	canReflect.onKeyValue(b, "baz", handler);

	b.attr("foo", "quux");

	QUnit.equal( canReflect.getKeyValue(b, "foo"), "quux", "bound value");
	// sanity checks to ensure that handler doesn't get called again.
	b.attr("foo", "thud");
	b.attr("baz", "quux");

});

QUnit.test("can-reflect setKeyValue", function(){
	var a = new SimpleMap({ "a": "b" });

	canReflect.setKeyValue(a, "a", "c");
	QUnit.equal(a.attr("a"), "c", "setKeyValue");
});

QUnit.test("can-reflect getKeyDependencies", function() { 
	var a = new SimpleMap({ "a": "a" });

	ok(!canReflect.getKeyDependencies(a, "a"), "No dependencies before binding");

});

QUnit.test("registered symbols", function() { 
	var a = new SimpleMap({ "a": "a" });

	ok(a[canSymbol.for("can.isMapLike")], "can.isMapLike");
	equal(a[canSymbol.for("can.getKeyValue")]("a"), "a", "can.getKeyValue");
	a[canSymbol.for("can.setKeyValue")]("a", "b");
	equal(a.attr("a"), "b", "can.setKeyValue");

	function handler(val) {
		equal(this, a);
		equal(val, "c", "can.onKeyValue");
	}

	a[canSymbol.for("can.onKeyValue")]("a", handler);
	a.attr("a", "c");

	a[canSymbol.for("can.offKeyValue")]("a", handler);
	a.attr("a", "d"); // doesn't trigger handler
});
