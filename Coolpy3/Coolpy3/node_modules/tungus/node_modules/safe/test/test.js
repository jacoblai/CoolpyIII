var assert = require('assert');
var safe = require('../lib/safe.js');

describe("safe",function () {
	describe("sure", function () {
		it("should rise up exceptions", function () {
			safe.sure(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should return value on success instead of function execute", function () {
			safe.sure(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, "value"
			)(null);
		})
		it("should not return value if error happens", function () {
			safe.sure(function (err,v) {
				assert(err!=null)
				}, "value"
			)(new Error());
		})
	})
	describe("trap", function () {
		it("should rise up exceptions to explicetly provided callback", function () {
			safe.trap(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should rise up exceptions to indirectly provided callback", function () {
			safe.trap(function () {
				throw new Error();
			})(null,function (err) {
				assert(err!=null)
			});
		})
	})
	describe("result", function () {
		it("should rise up exceptions", function () {
			safe.result(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should convert return to callback", function () {
			safe.result(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, function () {
					return "value"
			})(null);
		})
	})
	describe("sure_result", function () {
		it("should rise up exceptions", function () {
			safe.sure_result(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure_result(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should convert return to callback", function () {
			safe.sure_result(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, function () {
					return "value"
			})(null);
		})
	})
	describe("wrap", function () {
		it("should rise up exceptions", function () {
			safe.wrap(function () {
				throw new Error();
			},function (err) {
				assert(err!=null)
			})(null);
		})
		it("should append callback to inner function", function () {
			safe.wrap(function (cb) {
				cb(new Error())
			},function (err) {
				assert(err!=null)
			})(null);
		})
	})
	describe("run", function () {
		it("should rise up exceptions", function () {
			safe.run(function () {
				throw new Error();
			},function (err) {
				assert(err!=null)
			});
		})
	})
	describe("spread", function () {
		it("should convert array to variadic arguments", function () {
			safe.spread(function (a1,a2,a3) {
				assert.equal(a1,"apple");
				assert.equal(a2,"samsung");
				assert.equal(a3,"nokia");
			})(["apple","samsung","nokia"])
		})
	})
	describe("sure_spread", function () {
		it("should rise up exceptions", function () {
			safe.sure_spread(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure_spread(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should convert array to variadic arguments", function () {
			safe.sure_spread(safe.noop,function (a1,a2,a3) {
				assert.equal(a1,"apple");
				assert.equal(a2,"samsung");
				assert.equal(a3,"nokia");
			})(null,["apple","samsung","nokia"])
		})
	})
	describe("async", function () {
		var obj = {
			doStuff:function (a,b,cb) {
				cb(null, a+b);
			},
			doBad:function (a,b,cb) {
				throw new Error();
			}
		}
		it("should rise up exceptions", function () {
			safe.async(obj,"doBad")(function (err,v) {
				assert(err!=null)
			})
		})
		it("should bind to object function and rise up callback value", function () {
			safe.async(obj,"doStuff",2,3)(function (err,v) {
				assert(err==null);
				assert.equal(v,5)
			})
		})
	})
	describe("back", function () {
		it("should return value in next iteration", function (done) {
			var a = 0;
			safe.back(function (err) { done((err!=null && a==1)?null:new Error("Wrong behavior")) }, new Error())
			a++
		})
	})
	describe("yield", function () {
		it("should execute function in next iteration", function (done) {
			var a = 0;
			safe.yield(function () { done(a==1?null:new Error("Wrong behavior")) })
			a++
		})
	})
	describe("inherits", function () {
		var parent = function () {
		}
		parent.prototype.parent_function = function () {
		}
		var child = function () {
		}
		safe.inherits(child,parent)
		child.prototype.child_function = function () {
		}
		it("should make magic that gives child instance methods of parents", function () {
			var obj = new child();
			obj.child_function();
			obj.parent_function();
		})
	})
	describe("chain", function () {
		it("should execute step by step asynchronous functions in chain", function (done) {
			var a = 0;
			safe.chain(function (cb) {
					safe.yield(function () {
						cb(null, 'test');
					});
					a++;
				})
				.then(function (test, cb) {
					if (test !== 'test')
						return cb(new Error("Wrong behavior"));

					safe.yield(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), a);
					});
					a++;
				})
				.then(function (a, cb) {
					safe.yield(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"))
					});
					a++;
				})
				.done(done);
		})
	})
	describe("control flow", function () {
		it("should execute step by step asynchronous functions in waterfall", function (done) {
			var a = 0;
			safe.waterfall([
				function (cb) {
					setTimeout(function () {
						cb(null, "test");
					}, Math.random*10);

					a++;
				},
				function (test, cb) {
					if (test !== 'test')
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), a);
					}, Math.random*10);

					a++;
				},
				function (a, cb) {
					setTimeout(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"), "final")
					}, Math.random*10);

					a++;
				}
			], function (err, result) {
				done((err || result !== "final") ? (err || new Error("Wrong behavior")) : null);
			});
		})
		it("should execute step by step asynchronous functions in series", function (done) {
			var a = 0;
			safe.series([
				function (cb) {
					setTimeout(function () {
						cb(null, 'first');
					}, Math.random*10);

					a++;
				},
				function (cb) {
					setTimeout(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), "middle");
					}, Math.random*10);

					a++;
				},
				function (cb) {
					setTimeout(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"), "last");
					}, Math.random*10);

					a++;
				}
			], function (err, result) {
				done((err || result[0] !== "first" || result[1] !== "middle" || result[2] !== "last") ? (err || new Error("Wrong behavior")) : null);
			});
		})
		it("should execute asynchronous functions in parallel", function (done) {
			safe.parallel({
				"2": function (cb) {
					setTimeout(function () {
						cb(null, "last");
					}, Math.random*10);
				},
				"1": function (cb) {
					setTimeout(function () {
						cb(null, "middle");
					}, Math.random*10);
				},
				"0": function (cb) {
					setTimeout(function () {
						cb(null, 'first');
					}, Math.random*10);
				}
			}, function (err, result) {
				done((err || result["0"] !== "first" || result["1"] !== "middle" || result["2"] !== "last") ? (err || new Error("Wrong behavior")) : null);
			});
		})
		it("should automatically resolve dependencies execute asynchronous functions", function (done) {
			safe.auto({
				"4": ["0", "2", function (cb, result) {
					if (result["0"] !== "Tinker" || result["2"] !== "Soldier")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Spy");
					}, Math.random*10);
				}],
				"3": ["1", "2", "4", function (cb, result) {
					if (result["1"] !== "Tailor" || result["4"] !== "Spy" || result["2"] !== "Soldier")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Done");
					}, Math.random*10);
				}],
				"2": ["0", function (cb, result) {
					if (result["0"] !== "Tinker")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Soldier");
					}, Math.random*10);
				}],
				"1": ["0", function (cb, result) {
					if (result["0"] !== "Tinker")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Tailor");
					}, Math.random*10);
				}],
				"0": function (cb) {
					safe.yield(function () {
						cb(null, "Tinker");
					});
				}
			}, function (err, result) {
				if (result["0"] !== "Tinker" || result["1"] !== "Tailor" || result["2"] !== "Soldier" || result["4"] !== "Spy" || result["3"] !== "Done")
					done(new Error("Wrong behavior"));

				done(err);
			});
		})
		it("queue", function (done) {
			var queue = safe.queue(function(task, cb){
				task.cmd(function (err, res) {
					cb((err || res != "test") ? (err || new Error("Wrong behavior")) : null);
				});
			}, 1);

			queue.drain = function () {
				done();
			}

			queue.push({
				cmd: function(cb){
					safe.yield(function () {
						cb(null, "test");
					});
				}
			}, function (err) { if (err) throw err; });
		})
	})
	describe("for each", function () {
		it("should execute asynchronous each (array)", function (done) {
			var a = 5;
			safe.each([1,2,3,4,5], function (i, cb) {
				setTimeout(function () {
					a--;
					cb();
				}, Math.random*10);
			}, function (err) {
				done(err || (a === 0 ? null : new Error("Wrong behavior")));
			});
		})

		it("should execute asynchronous each series (array)", function (done) {
			var a = 0;
			safe.eachSeries([1,2,3,4,5], function (i, cb) {
				setTimeout(function () {
					cb(i === a ? null : new Error("Wrong behavior"));
				}, Math.random*10);

				a++;
			}, done);
		})
	})
	describe("map", function () {
		it("should execute asynchronous map (array)", function (done) {
			safe.map([1,2,3,4,5], function (i, cb) {
				setTimeout(function () {
					cb(null, i*2);
				}, Math.random*10);
			}, function (err, res) {
				done(err || (res[0] === 2 && res[1] === 4 && res[2] === 6 && res[3] === 8 && res[4] === 10 ? null : new Error("Wrong behavior")));
			});
		})

		it("should execute asynchronous map series (array)", function (done) {
			var execute = 0;

			safe.mapSeries([1,2,3,4,5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, i*2);
				}, Math.random*10);
			}, function (err, res) {
				done(err || (res[0] === 2 && res[1] === 4 && res[2] === 6 && res[3] === 8 && res[4] === 10 ? null : new Error("Wrong behavior")));
			});
		})
	})
	describe("retry", function () {
		it("should few times retry to execute function", function (done) {
			var i = 0;

			safe.retry(function (cb) {
				setTimeout(function () {
					i++;

					if (i !== 5) {
						cb(new Error("need more retry"));
					} else
						cb(null, "done");

				}, Math.random*10);
			}, function (err, result) {
				done(err || (result === "done" ? null : new Error("Wrong behavior")));
			});
		})
	})
	describe("do-while", function () {
		it("should execute while a condition is true", function (done) {
			var a = 0;
			var flag = false;

			safe.whilst(
				function () {
					flag = false;
					return a < 5;
				},
				function (cb) {
					if (flag)
						cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb();
					}, Math.random*10);

					a++;
				}, function (err) {
					done(err || (a === 5 ? null : new Error("Wrong behavior")));
				});
		})
		it("should execute while a condition is true (post check)", function (done) {
			var a = 0;
			var flag = true;

			safe.doWhilst(
				function (cb) {
					flag = false;
					setTimeout(function () {
						cb();
					}, Math.random*10);

					a++;
				},
				function () {
					if (flag)
						throw new Error("Wrong behavior");

					return a < 5;
				}, function (err) {
					done(err || (a === 5 ? null : new Error("Wrong behavior")));
				});
		})
	})
	describe("do-until", function () {
		it("should execute until a condition is false", function (done) {
			var a = 0;
			var flag = false;

			safe.until(
				function () {
					flag = false;
					return a === 5;
				},
				function (cb) {
					if (flag)
						cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb();
					}, Math.random*10);

					a++;
				}, function (err) {
					done(err || (a === 5 ? null : new Error("Wrong behavior")));
				});
		})
		it("should execute until a condition is false (post check)", function (done) {
			var a = 0;
			var flag = true;

			safe.doUntil(
				function (cb) {
					flag = false;
					setTimeout(function () {
						cb();
					}, Math.random*10);

					a++;
				},
				function () {
					if (flag)
						throw new Error("Wrong behavior");

					return a === 5;
				}, function (err) {
					done(err || (a === 5 ? null : new Error("Wrong behavior")));
				});
		})
	})
	describe("reduce", function () {
		it("should reduce array an asynchronous iterator", function (done) {
			safe.reduce([1,2,3,4,5], 0, function (memo, item , cb) {
				setTimeout(function () {
					cb(null, memo + item);
				}, Math.random*10);
			}, function (err, result) {
				done((err || result !== 15) ? (err || new Error("Wrong behavior")) : null);
			});
		})
		it("should reduce array an asynchronous iterator in reverse order", function (done) {
			safe.reduceRight([1,2,3,4,5], 15, function (memo, item , cb) {
				setTimeout(function () {
					cb(null, memo - item);
				}, Math.random*10);
			}, function (err, result) {
				done((err || result !== 0) ? (err || new Error("Wrong behavior")) : null);
			});
		})
	})
	describe("apply", function () {
		it("should execute function with some arguments applied", function (done) {
			function foo (text, cb) {
				setTimeout(function () {
					cb(text === "test" ? null : new Error("Wrong behavior"));
				}, Math.random*10);
			}

			safe.parallel([
				safe.apply(foo, "test"),
				safe.apply(foo, "test")
			], done);
		});
	})
})
