(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var isObject = require('../internals/is-object');

module.exports = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

},{"../internals/is-object":22}],2:[function(require,module,exports){
var toIndexedObject = require('../internals/to-indexed-object');
var toLength = require('../internals/to-length');
var toAbsoluteIndex = require('../internals/to-absolute-index');

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

},{"../internals/to-absolute-index":39,"../internals/to-indexed-object":40,"../internals/to-length":42}],3:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],4:[function(require,module,exports){
var has = require('../internals/has');
var ownKeys = require('../internals/own-keys');
var getOwnPropertyDescriptorModule = require('../internals/object-get-own-property-descriptor');
var definePropertyModule = require('../internals/object-define-property');

module.exports = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

},{"../internals/has":15,"../internals/object-define-property":25,"../internals/object-get-own-property-descriptor":26,"../internals/own-keys":31}],5:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var definePropertyModule = require('../internals/object-define-property');
var createPropertyDescriptor = require('../internals/create-property-descriptor');

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"../internals/create-property-descriptor":6,"../internals/descriptors":7,"../internals/object-define-property":25}],6:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],7:[function(require,module,exports){
var fails = require('../internals/fails');

// Thank's IE8 for his funny defineProperty
module.exports = !fails(function () {
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});

},{"../internals/fails":12}],8:[function(require,module,exports){
var global = require('../internals/global');
var isObject = require('../internals/is-object');

var document = global.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

},{"../internals/global":14,"../internals/is-object":22}],9:[function(require,module,exports){
var getBuiltIn = require('../internals/get-built-in');

module.exports = getBuiltIn('navigator', 'userAgent') || '';

},{"../internals/get-built-in":13}],10:[function(require,module,exports){
// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

},{}],11:[function(require,module,exports){
var global = require('../internals/global');
var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var redefine = require('../internals/redefine');
var setGlobal = require('../internals/set-global');
var copyConstructorProperties = require('../internals/copy-constructor-properties');
var isForced = require('../internals/is-forced');

/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global;
  } else if (STATIC) {
    target = global[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    // extend global
    redefine(target, key, sourceProperty, options);
  }
};

},{"../internals/copy-constructor-properties":4,"../internals/create-non-enumerable-property":5,"../internals/global":14,"../internals/is-forced":21,"../internals/object-get-own-property-descriptor":26,"../internals/redefine":33,"../internals/set-global":35}],12:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

},{}],13:[function(require,module,exports){
var path = require('../internals/path');
var global = require('../internals/global');

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global[namespace])
    : path[namespace] && path[namespace][method] || global[namespace] && global[namespace][method];
};

},{"../internals/global":14,"../internals/path":32}],14:[function(require,module,exports){
(function (global){(function (){
var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line no-undef
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  check(typeof self == 'object' && self) ||
  check(typeof global == 'object' && global) ||
  // eslint-disable-next-line no-new-func
  Function('return this')();

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],15:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;

module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],16:[function(require,module,exports){
module.exports = {};

},{}],17:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var fails = require('../internals/fails');
var createElement = require('../internals/document-create-element');

// Thank's IE8 for his funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

},{"../internals/descriptors":7,"../internals/document-create-element":8,"../internals/fails":12}],18:[function(require,module,exports){
var fails = require('../internals/fails');
var classof = require('../internals/classof-raw');

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

},{"../internals/classof-raw":3,"../internals/fails":12}],19:[function(require,module,exports){
var store = require('../internals/shared-store');

var functionToString = Function.toString;

// this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper
if (typeof store.inspectSource != 'function') {
  store.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

module.exports = store.inspectSource;

},{"../internals/shared-store":37}],20:[function(require,module,exports){
var NATIVE_WEAK_MAP = require('../internals/native-weak-map');
var global = require('../internals/global');
var isObject = require('../internals/is-object');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var objectHas = require('../internals/has');
var sharedKey = require('../internals/shared-key');
var hiddenKeys = require('../internals/hidden-keys');

var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP) {
  var store = new WeakMap();
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;
  set = function (it, metadata) {
    wmset.call(store, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store, it) || {};
  };
  has = function (it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return objectHas(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return objectHas(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

},{"../internals/create-non-enumerable-property":5,"../internals/global":14,"../internals/has":15,"../internals/hidden-keys":16,"../internals/is-object":22,"../internals/native-weak-map":24,"../internals/shared-key":36}],21:[function(require,module,exports){
var fails = require('../internals/fails');

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;

},{"../internals/fails":12}],22:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],23:[function(require,module,exports){
module.exports = false;

},{}],24:[function(require,module,exports){
var global = require('../internals/global');
var inspectSource = require('../internals/inspect-source');

var WeakMap = global.WeakMap;

module.exports = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

},{"../internals/global":14,"../internals/inspect-source":19}],25:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');
var anObject = require('../internals/an-object');
var toPrimitive = require('../internals/to-primitive');

var nativeDefineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return nativeDefineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"../internals/an-object":1,"../internals/descriptors":7,"../internals/ie8-dom-define":17,"../internals/to-primitive":43}],26:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');
var propertyIsEnumerableModule = require('../internals/object-property-is-enumerable');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var toIndexedObject = require('../internals/to-indexed-object');
var toPrimitive = require('../internals/to-primitive');
var has = require('../internals/has');
var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return nativeGetOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!propertyIsEnumerableModule.f.call(O, P), O[P]);
};

},{"../internals/create-property-descriptor":6,"../internals/descriptors":7,"../internals/has":15,"../internals/ie8-dom-define":17,"../internals/object-property-is-enumerable":30,"../internals/to-indexed-object":40,"../internals/to-primitive":43}],27:[function(require,module,exports){
var internalObjectKeys = require('../internals/object-keys-internal');
var enumBugKeys = require('../internals/enum-bug-keys');

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};

},{"../internals/enum-bug-keys":10,"../internals/object-keys-internal":29}],28:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],29:[function(require,module,exports){
var has = require('../internals/has');
var toIndexedObject = require('../internals/to-indexed-object');
var indexOf = require('../internals/array-includes').indexOf;
var hiddenKeys = require('../internals/hidden-keys');

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};

},{"../internals/array-includes":2,"../internals/has":15,"../internals/hidden-keys":16,"../internals/to-indexed-object":40}],30:[function(require,module,exports){
'use strict';
var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable;

},{}],31:[function(require,module,exports){
var getBuiltIn = require('../internals/get-built-in');
var getOwnPropertyNamesModule = require('../internals/object-get-own-property-names');
var getOwnPropertySymbolsModule = require('../internals/object-get-own-property-symbols');
var anObject = require('../internals/an-object');

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

},{"../internals/an-object":1,"../internals/get-built-in":13,"../internals/object-get-own-property-names":27,"../internals/object-get-own-property-symbols":28}],32:[function(require,module,exports){
var global = require('../internals/global');

module.exports = global;

},{"../internals/global":14}],33:[function(require,module,exports){
var global = require('../internals/global');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var has = require('../internals/has');
var setGlobal = require('../internals/set-global');
var inspectSource = require('../internals/inspect-source');
var InternalStateModule = require('../internals/internal-state');

var getInternalState = InternalStateModule.get;
var enforceInternalState = InternalStateModule.enforce;
var TEMPLATE = String(String).split('String');

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) createNonEnumerableProperty(value, 'name', key);
    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
  }
  if (O === global) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
});

},{"../internals/create-non-enumerable-property":5,"../internals/global":14,"../internals/has":15,"../internals/inspect-source":19,"../internals/internal-state":20,"../internals/set-global":35}],34:[function(require,module,exports){
// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

},{}],35:[function(require,module,exports){
var global = require('../internals/global');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');

module.exports = function (key, value) {
  try {
    createNonEnumerableProperty(global, key, value);
  } catch (error) {
    global[key] = value;
  } return value;
};

},{"../internals/create-non-enumerable-property":5,"../internals/global":14}],36:[function(require,module,exports){
var shared = require('../internals/shared');
var uid = require('../internals/uid');

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

},{"../internals/shared":38,"../internals/uid":44}],37:[function(require,module,exports){
var global = require('../internals/global');
var setGlobal = require('../internals/set-global');

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});

module.exports = store;

},{"../internals/global":14,"../internals/set-global":35}],38:[function(require,module,exports){
var IS_PURE = require('../internals/is-pure');
var store = require('../internals/shared-store');

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.6.5',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2020 Denis Pushkarev (zloirock.ru)'
});

},{"../internals/is-pure":23,"../internals/shared-store":37}],39:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
module.exports = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};

},{"../internals/to-integer":41}],40:[function(require,module,exports){
// toObject with fallback for non-array-like ES3 strings
var IndexedObject = require('../internals/indexed-object');
var requireObjectCoercible = require('../internals/require-object-coercible');

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};

},{"../internals/indexed-object":18,"../internals/require-object-coercible":34}],41:[function(require,module,exports){
var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger
module.exports = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

},{}],42:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength
module.exports = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

},{"../internals/to-integer":41}],43:[function(require,module,exports){
var isObject = require('../internals/is-object');

// `ToPrimitive` abstract operation
// https://tc39.github.io/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"../internals/is-object":22}],44:[function(require,module,exports){
var id = 0;
var postfix = Math.random();

module.exports = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

},{}],45:[function(require,module,exports){
var $ = require('../internals/export');
var global = require('../internals/global');
var userAgent = require('../internals/engine-user-agent');

var slice = [].slice;
var MSIE = /MSIE .\./.test(userAgent); // <- dirty ie9- check

var wrap = function (scheduler) {
  return function (handler, timeout /* , ...arguments */) {
    var boundArgs = arguments.length > 2;
    var args = boundArgs ? slice.call(arguments, 2) : undefined;
    return scheduler(boundArgs ? function () {
      // eslint-disable-next-line no-new-func
      (typeof handler == 'function' ? handler : Function(handler)).apply(this, args);
    } : handler, timeout);
  };
};

// ie9- setTimeout & setInterval additional parameters fix
// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
$({ global: true, bind: true, forced: MSIE }, {
  // `setTimeout` method
  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
  setTimeout: wrap(global.setTimeout),
  // `setInterval` method
  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
  setInterval: wrap(global.setInterval)
});

},{"../internals/engine-user-agent":9,"../internals/export":11,"../internals/global":14}],46:[function(require,module,exports){
"use strict";

require("core-js/modules/web.timers");

// ON DOCUMENT READY
$(document).ready(function () {
  /*-------------------------------------------------*/

  /* =  Inview
  /*-------------------------------------------------*/
  var windowHeight = $(window).height();
  $('.inview').on('inview', function (event, isInView) {
    if (isInView) {
      $(this).addClass("active");
    }
  });
  /*-------------------------------------------------*/

  /* =  PARTNERS SLIDER
  /*-------------------------------------------------*/

  $('#partners-slider').owlCarousel({
    loop: true,
    nav: false,
    margin: 30,
    autoplay: true,
    slideTransition: 'linear',
    autoplaySpeed: 6000,
    // smartSpeed: 6000,
    responsive: {
      0: {
        items: 7,
        margin: 14
      },
      768: {
        items: 7,
        margin: 10
      },
      1000: {
        items: 7
      }
    }
  });
  /*-------------------------------------------------*/

  /* =  TEAM SLIDER
  /*-------------------------------------------------*/

  var $homeSlider = $("#team-slider");
  $(window).resize(function () {
    showHomeSlider();
  });

  function showHomeSlider() {
    if ($homeSlider.data("owlCarousel") !== "undefined") {
      if (window.matchMedia('(min-width: 610px)').matches) {
        initialHomeSlider();
      } else {
        destroyHomeSlider();
      }
    }
  }

  showHomeSlider();

  function initialHomeSlider() {
    $homeSlider.addClass("owl-carousel").owlCarousel({
      loop: false,
      nav: true,
      navText: ["<img src='assets/images/caret.svg'>", "<img src='assets/images/caret.svg'>"],
      margin: 30,
      responsive: {
        0: {
          items: 7,
          margin: 14
        },
        610: {
          items: 3,
          margin: 30
        },
        1000: {
          items: 3
        }
      }
    });
  }

  function destroyHomeSlider() {
    $homeSlider.trigger("destroy.owl.carousel").removeClass("owl-carousel");
  }
  /*-------------------------------------------------*/

  /* =  HEADER ON SCROLL
  /*-------------------------------------------------*/


  var headerMain = $('.header-main');
  var lastScrollTop = 0;
  $(window).on("scroll", function () {
    var st = $(this).scrollTop();

    if (st > lastScrollTop) {
      if ($(window).scrollTop() > windowHeight / 3) {
        headerMain.addClass('slideBottom');
        headerMain.removeClass('slideTop');
      }
    } else {
      if ($(window).scrollTop() > windowHeight / 3) {
        headerMain.addClass('toFixed');
        headerMain.addClass('slideTop');
        headerMain.removeClass('slideBottom');
      }
    }

    lastScrollTop = st;

    if ($(window).scrollTop() < 45) {
      headerMain.removeClass('slideTop');
      headerMain.removeClass('toFixed');
    }
  });
  $(".main-nav__link-mob").on("click", function () {
    $(".main-nav__link-mob").toggleClass("is-active");
    $(".main-nav__dropdown").toggleClass("is-active");
    $(".header__wrapper").toggleClass("is-active");
    $(".header-main").toggleClass("is-active");
    $(".dropdown-box").toggleClass("is-active");
  });
  $(".dropdown-box").on("click", function () {
    $(".main-nav__link-mob").removeClass("is-active");
    $(".main-nav__dropdown").removeClass("is-active");
    $(".header__wrapper").removeClass("is-active");
    $(".header-main").removeClass("is-active");
    $(".dropdown-box").removeClass("is-active");
  });
  /*-------------------------------------------------*/

  /* =  Header responsive
  /*-------------------------------------------------*/

  var headerBars = $('.bars');
  var headerNav = $('.header-main nav');
  var headerNavLink = $('.main-nav__dropdown a');
  headerBars.on("click", function () {
    $(this).toggleClass("active");
    headerNav.toggleClass('active');
    $(".header__wrapper").toggleClass('active');
    $("html").toggleClass('active');
    $(".bar-box").toggleClass('active');
  });
  headerNavLink.on("click", function () {
    headerNav.removeClass('active');
    headerBars.removeClass("active");
    $(".header__wrapper").removeClass("active");
    $("html").removeClass("active");
    $(".bar-box").removeClass('active');
  });
  /*-------------------------------------------------*/

  /* =  Tabs
  /*-------------------------------------------------*/

  var step = 1;
  var tabTrigger = $('.tab-trigger');
  var tabContentArticle = $(".tab-content");
  var interval = null;
  var paused = false;
  var counter = 0;
  tabTrigger.on("click", function () {
    var dataTrigger = $(this).data("tab");
    step = dataTrigger;
    tabContentArticle.removeClass("is-active");
    $("#tab" + dataTrigger).addClass("is-active");
    tabTrigger.removeClass("is-active");
    $("[data-tab='" + dataTrigger + "']").addClass("is-active");
  });

  var changeTabs = function changeTabs(step) {
    tabContentArticle.removeClass("is-active");
    $("#tab" + step).addClass("is-active");
    tabTrigger.removeClass("is-active");
    $("[data-tab='" + step + "']").addClass("is-active");
  };

  var autoChange = function autoChange() {
    clearInterval(interval);
    interval = setInterval(function () {
      // console.log(paused)
      if (!paused) {
        counter++; // console.log(counter)

        if (counter === 40) {
          step++;

          if (step === 5) {
            step = 1;
          }

          changeTabs(step);
          counter = 0;
        }
      }
    }, 100);
  };

  autoChange();
  $('.tab-wrapper').mouseenter(function () {
    // clearInterval(interval);
    // autoChange() 
    paused = true;
  }).mouseleave(function () {
    // autoChange(true)
    paused = false;
  }); // var isRunning = true;
  // var interval = setInterval(function() {
  //     if (!isRunning) {
  //         // not running, do nothing
  //         console.log("ne radi")
  //     } else {
  //         // it is running, do stuff.
  //         console.log("radi")
  //     }
  // }, 1000);
  // $('.tab-wrapper').mouseenter (function() {
  //     isRunning = false;
  // }).mouseleave(function() {      
  //     isRunning = true;
  // });

  /*-------------------------------------------------*/

  /* =  Animations
  /*-------------------------------------------------*/

  var timer = null;

  if (timer) {
    clearTimeout(timer); //cancel the previous timer.

    timer = null;
  }

  $(".cloud-element4 .icon-wrapper").on({
    mouseenter: function mouseenter() {
      console.log("nesto");
      $(this).parent().addClass('cloud-element4-active');
      $(".animation-container").addClass('is-active1');
    },
    mouseleave: function mouseleave() {
      timer = setTimeout(function () {
        console.log("izasao");
        $(".cloud-element").removeClass('cloud-element4-active');
        $(".animation-container").removeClass('is-active1');
      }, 4200);
    }
  }); // $(".cloud-element3 .icon-wrapper").on({
  //     mouseenter: function () {
  //     	console.log("nesto")
  //         $(this).parent().addClass('cloud-element3-active');
  //     	$(".animation-container").addClass('is-active2');
  //     },
  //     mouseleave: function () {
  //     	timer = setTimeout(function(){
  //     		console.log("izasao")
  //         	$(".cloud-element").removeClass('cloud-element3-active');
  //         	$(".animation-container").removeClass('is-active2');
  //     	}, 6000);
  //     }
  // });

  /*-------------------------------------------------*/

  /* =  Accordion
  /*-------------------------------------------------*/

  var readMore = $(".read-more");
  readMore.on('click', function () {
    $(this).siblings(".accordion__content").slideToggle();
    $(this).toggleClass("active"); // console.log(this)

    if ($(this).hasClass('active')) {
      $(this).text('Read Less');
    } else {
      $(this).text('Read More');
    }
  });
  /*-------------------------------------------------*/

  /* =  LOGIN POPUP
  /*-------------------------------------------------*/

  $(".popup-aside .overlay").on('click', function () {
    $(this).parent().removeClass("is-active");
    $('html').removeClass("active");
  });
  var popupTrigger = $('.sign-in-trigger');
  var popupContentArticle = $(".popup-aside");
  popupTrigger.on("click", function () {
    var dataTrigger = $(this).data("popup");
    popupContentArticle.removeClass("is-active");
    $('html').addClass("active");
    $("#" + dataTrigger).addClass("is-active");
    popupTrigger.removeClass("is-active");
    $("[data-popup='" + dataTrigger + "']").addClass("is-active");
  });
});

},{"core-js/modules/web.timers":45}]},{},[46])

//# sourceMappingURL=app.js.map
