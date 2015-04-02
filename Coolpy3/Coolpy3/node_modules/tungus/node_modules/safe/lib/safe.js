(function () {
	"use strict";

	var safe = {};

	var isArray = Array.isArray || function (arr) {
		return arr && typeof arr === 'object' && typeof arr.length === 'number' && Object.prototype.toString.call(arr) === '[object Array]';
	};

	var forEach = function (arr, iterator) {
		for (var i = 0, l = arr.length; i < l; i++) {
			if (iterator(arr[i], i, arr) === false)
				break;
		}
	}

	var toArray = Array.from || function (obj) {
		var arr = [];

		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				arr.push(obj[i]);
			}
		}

		return arr;
	}

	var keys = Object.keys || function (obj) {
		var arr = [];

		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				arr.push(i);
			}
		}

		return arr;
	}

	var later;

	if (typeof setImmediate === "undefined") {
		 if (typeof process === "undefined")
			later = function (cb) { setTimeout(cb, 0) };
		else
			later = process.nextTick;
	} else {
		if (typeof process === "undefined")
			later = function (cb) { setImmediate(cb) };
		else
			later = setImmediate;
	}

	var back = function (cb) {
		if (typeof cb !== "function")
			throw new Error("Exactly function are required");

		var args = new Array(arguments.length ? arguments.length - 1 : 0);
		for (var i = 1, l = arguments.length; i < l; i++)
			args[i-1] = arguments[i];

		later(function () {
			cb.apply(this, args);
		})
	}

	safe.back = back;

	safe.noop = function () {}

	safe.yield = later;

	var once = function (cb) {
		var called = 0;
		return function (err) {
			if (called) {
				if (err)
					return;

				throw new Error("Callback was already called.");
			} else {
				called = 1;
				cb.apply(null, arguments);
			}
		}
	}

	var controwFlow = function (flow, arr, callback) {
		callback = once(callback || function () {});

		var results = isArray(arr) ? new Array(arr.length) : {};

		safe[flow](keys(arr), function (key, cb) {
			safe.run(arr[key], safe.sure_result(cb, function () {
				if (arguments.length > 1) {
					results[key] = new Array(arguments.length);
					for (var i = 0, l = arguments.length; i < l; i++)
						results[key][i] = arguments[i];
				} else
					results[key] = arguments[0] || null; // behavior compatible with async
			}));
		}, safe.sure(callback, function () {
			callback(null, results);
		}));
	}

	var executeSeries = function (chain, callback) {
		callback = once(callback || function () {});

		if (typeof chain !== "object")
			throw new Error("Array or Object are required");

		if (!isArray(chain))
			chain = toArray(chain);

		var iter = 0;

		function execute(err) {
			if (err || chain.length === iter)
				return callback.apply(null, arguments);

			var args = new Array(arguments.length ? arguments.length - 1 : 0);
			for (var i = 1, l = arguments.length; i < l; i++)
				args[i - 1] = arguments[i];

			safe.run(function (cb) {
				args.push(cb);
				iter++;
				chain[iter - 1].apply(null, args);
			}, execute);
		}

		execute();
	}

	var reduce = function (arr, memo, fn, callback, direction) {
		callback = once(callback || function () {});

		if (!isArray(arr))
			throw new Error("Array are required");

		var iter = 0;

		function execute(err, memo) {
			if (err)
				return callback(err);

			if (arr.length === iter)
				return callback(null, memo);

			safe.run(function (cb) {
				iter++;

				if (direction)
					fn(memo, (arr[iter - 1]), cb);

				if (!direction)
					fn(memo, (arr[arr.length - iter]), cb);
			}, execute);
		}

		execute(null, memo);
	}

	safe.mapLimit = function (arr, limit, fn, callback) {
		callback = once(callback || function () {});

		var result = [],
			idx = 0;

		safe.eachLimit(arr, limit, function (item, cb) {
			var i = idx;
			idx++;

			fn(item, safe.sure_result(cb, function (res) {
				result[i] = res;
			}));
		}, safe.sure(callback, function () {
			callback(null, result);
		}));
	}

	safe.map = function (arr, fn, callback) {
		safe.mapLimit(arr, null, fn, callback);
	}

	safe.mapSeries = function (arr, fn, callback) {
		safe.mapLimit(arr, 1, fn, callback);
	}

	safe.result = function (callback, fn) {
		if (typeof fn !== "function" || typeof callback !== "function")
			throw new Error("Exactly two arguments are required")

		return function () {
			var result;
			try {
				result = fn.apply(this, arguments);
			} catch (err) {
				return back(callback, err);
			}

			if (result !== undefined)
				back(callback, null, result);
			else
				back(callback, null);
		}
	}

	safe.sure = safe.trap_sure = function (callback, fn) {
		if (fn == undefined || typeof callback !== "function")
			throw new Error("Exactly two arguments are required")

		return function (err) {
			if (err)
				return callback(err)

			if (typeof fn !== "function") {
				return callback(null, fn);
			}

			try {
				var args = new Array(arguments.length ? arguments.length - 1 : 0);
				for (var i = 1, l = arguments.length; i < l; i++)
					args[i - 1] = arguments[i];

				fn.apply(this, args);
			} catch (er) {
				back(callback, er);
			}
		}
	}

	safe.trap = function (callback, fn) {
		if (callback == undefined)
			throw new Error("Exactly two arguments are required")

		return function () {
			if (fn == undefined) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}
			try {
				fn.apply(this, arguments);
			} catch (err) {
				back(callback, err);
			}
		}
	}

	safe.wrap = function (fn, callback) {
		if (callback == undefined)
			throw new Error("Exactly two arguments are required")

		return function () {
			var args = new Array(arguments.length + 1);
			for (var i = 0, l = arguments.length; i < l; i++)
				args[i] = arguments[i];

			args[arguments.length] = callback;

			try {
				fn.apply(this, args);
			} catch (err) {
				back(callback, err);
			}
		}
	}

	safe.run = function (fn, cb) {
		try {
			fn.call(this, once(cb))
		} catch (err) {
			back(cb, err)
		}
	}

	safe.sure_result = safe.trap_sure_result = function (callback, fn) {
		if (typeof fn !== "function" || typeof callback !== "function")
			throw new Error("Exactly two arguments are required");

		return function (err) {
			if (err)
				return callback(err);

			var result;
			try {
				var args = new Array(arguments.length ? arguments.length - 1 : 0);
				for (var i = 1, l = arguments.length; i < l; i++)
					args[i-1] = arguments[i];

				result = fn.apply(this, args);
			} catch (err) {
				return callback(err);
			}

			if (result !== undefined)
				callback(null, result);
			else
				callback(null);
		}
	}

	safe.sure_spread = function (callback, fn) {
		return function (err) {
			if (fn == undefined) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}
			if (err)
				return callback(err)
			try {
				fn.apply(this, arguments[1]);
			} catch (err) {
				callback(err);
			}
		}
	}

	safe.async = function (self, fn) {
		var args = [];
		for (var i = 2, l = arguments.length; i < l; i++)
			args.push(arguments[i]);

		return function (cb) {
			try {
				args.push(cb);
				self[fn].apply(self, args);
			} catch (err) {
				cb(err);
			}
		}
	}

	safe.spread = function (fn) {
		return function (arr) {
			fn.apply(this, arr)
		}
	}

	safe.inherits = (function () {
		function noop() {}

		function ecma3(ctor, superCtor) {
			noop.prototype = superCtor.prototype;
			ctor.prototype = new noop;
			ctor.prototype.constructor = superCtor;
		}

		function ecma5(ctor, superCtor) {
			ctor.prototype = Object.create(superCtor.prototype, {
				constructor: {
					value: ctor,
					enumerable: false
				}
			});
		}

		return Object.create ? ecma5 : ecma3;
	}());

	var chains = function (fn) {
		var chain = [],
			self = this;

		if (typeof fn === "function")
			chain.push(fn);

		self.then = function (fn) {
			chain.push(fn);
			return self;
		}

		self.done = function (callback) {
			executeSeries(chain, callback);
		}

		return self;
	}

	safe.chain = function (fn) {
		return new chains(fn);
	}

	safe.eachLimit = safe.forEachLimit = function (arr, limit, fn, callback) {
		callback = once(callback || function () {});

		if (!isArray(arr))
			throw new Error("Array are required");

		limit = parseInt(limit) || arr.length;

		var qnt = arr.length,
			running = 0,
			iter = 0,
			stop = false;

		function iterator(err) {
			if (stop)
				return;

			if (err || qnt === 0) {
				stop = true;
				return callback.apply(null, arguments);
			}

			if (running >= limit || arr.length <= iter)
				return;

			running++;

			safe.run(function (cb) {
				iter++;
				fn(arr[iter - 1], cb);
				later(iterator);
			}, safe.sure_result(iterator, function () {
				qnt--;
				running--;
			}));
		}

		iterator();
	}

	safe.each = safe.forEach = function (arr, fn, callback) {
		safe.eachLimit(arr, null, fn, callback)
	}

	safe.eachSeries = safe.forEachSeries = function (arr, fn, callback) {
		safe.eachLimit(arr, 1, fn, callback)
	}

	safe.waterfall = function (arr, callback) {
		executeSeries(arr, callback);
	}

	safe.series = function (arr, callback) {
		controwFlow("eachSeries", arr, callback);
	}

	safe.parallel = function (arr, callback) {
		controwFlow("each", arr, callback);
	}

	safe.auto = function (obj, callback) {
		callback = once(callback || function () {});

		var results = {},
			tasks = keys(obj),
			qnt = tasks.length,
			starter = {},
			iserror = 0;

		var iterator = function (err) {
			if (iserror)
				return;

			if (err) {
				iserror = 1;
				return callback(err);
			}

			if (qnt === 0)
				return callback(null, results);

			safe.each(tasks, function (k, cb) {
				if (iserror || starter[k] || qnt === 0)
					return cb();

				var res;

				if (isArray(obj[k])) {
					var arr = Array.prototype.slice.call(obj[k], 0, obj[k].length - 1);
					res = {};

					forEach(arr, function (i) {
						if (typeof results[i] === "undefined")
							return false;

						res[i] = results[i];
					});

					if (keys(res).length !== arr.length)
						return cb();
				}

				var task = isArray(obj[k]) ? obj[k][obj[k].length - 1] : obj[k];
				starter[k] = 1;

				safe.run(function (cb) {
					task(cb, res);
				}, safe.sure_result(iterator, function () {
					qnt--;

					if (arguments.length > 1) {
						results[k] = new Array(arguments.length);
						for (var i = 0, l = arguments.length; i < l; i++)
							results[k][i] = arguments[i];
					} else
						results[k] = arguments[0] || null; // behavior compatible with async
				}));
			});
		}

		iterator();
	}

	var swhile = function (test, fn, callback, dir) {
		function execute() {
			safe.run(fn, safe.sure(callback, function () {
				if (dir != test())
					callback(null);
				else
					execute();
			}));
		}

		execute();
	}

	safe.whilst = function (test, fn, callback) {
		swhile(test, fn, callback, true);
	}

	safe.doWhilst = function (fn, test, callback) {
		safe.run(fn, safe.sure(callback, function () {
			swhile(test, fn, callback, true);
		}));
	}

	safe.until = function (test, fn, callback) {
		swhile(test, fn, callback, false);
	}

	safe.doUntil = function (fn, test, callback) {
		safe.run(fn, safe.sure(callback, function () {
			swhile(test, fn, callback, false);
		}));
	}

	safe.reduce = function (arr, memo, fn, callback) {
		reduce(arr, memo, fn, callback, 1);
	}

	safe.reduceRight = function (arr, memo, fn, callback) {
		reduce(arr, memo, fn, callback, 0);
	}

	safe.apply = function (fn) {
		var args = new Array(arguments.length ? arguments.length - 1 : 0);
		for (var i = 1, l = arguments.length; i < l; i++)
			args[i-1] = arguments[i];

		return function () {
			for (var i = 0, l = arguments.length; i < l; i++)
				args.push(arguments[i]);

			fn.apply(null, args);
		};
	}

	safe.queue = function (worker, threads) {
		return new queue(worker, threads);
	}

	safe.retry = function (times, fn, callback) {
		var error, done;

		if (typeof times === 'function') {
			callback = fn;
			fn = times;
			times = 5;
		} else
			times = parseInt(times, 10) || 5;

		function task(wcb, results) {
			safe.eachSeries(new Array(times), function (item, cb) {
				fn(function (err, res) {
					error = err;
					done = res;
					cb(!err);
				}, results);
			}, function () {
				(wcb || callback || function () {})(error || null, done);
			});
		}

		return callback ? task() : task;
	}

	var queue = function (worker, threads) {
		threads = parseInt(threads) || 1;

		var workers = 0,
			tasks = [],
			self = this;

		function execute() {
			if (!self.paused && workers < threads && tasks.length) {
				var task = tasks.shift();
				if (tasks.length === 0 && self.empty)
					self.empty();

				workers++;

				var cb = once(function () {
					workers--;
					task.callback.apply(task, arguments);

					if (tasks.length + workers === 0 && self.drain)
						self.drain();

					execute();
				});

				safe.run(function (cb) {
					worker.call(task, task.data, cb);
				}, cb);
			}
		}

		function insert(data, pos, callback) {
			self.started = true;

			if (!isArray(data))
				data = [data];

			if (data.length == 0)
				return later(function () {
					if (self.drain)
						self.drain();
				});

			forEach(data, function (task) {
				var item = {
					data: task,
					callback: once(typeof callback === 'function' ? callback : function () {})
				};

				if (pos)
					tasks.unshift(item);
				else
					tasks.push(item);

				if (self.saturated && tasks.length === threads)
					self.saturated();

				later(execute);
			});
		}

		self.saturated = null;
		self.empty = null;
		self.drain = null;
		self.started = false;
		self.paused = false;

		self.push = function (data, callback) {
			insert(data, false, callback);
		}

		self.unshift = function (data, callback) {
			insert(data, true, callback);
		}

		self.kill = function () {
			self.drain = null;
			tasks = [];
		}

		self.length = function () {
			return tasks.length;
		}

		self.running = function () {
			return workers;
		}

		self.length.valueOf = self.length;
		self.running.valueOf = self.running;

		self.idle = function () {
			return tasks.length + workers === 0;
		}

		self.pause = function () {
			self.paused = true;
		}

		self.resume = function () {
			if (self.paused === false)
				return;

			self.paused = false;

			for (var w = 1; w <= threads; w++)
				later(execute);
		}

		return self;
	}

	if (typeof module === "object" && typeof module.exports === "object")
	// commonjs module
		module.exports = safe;
	else if (typeof define === "function" && define.amd)
	// AMD module
		define([], function () {
		return safe;
	})
	else
	// finally old school
		this.safe = safe;
}.call(this));