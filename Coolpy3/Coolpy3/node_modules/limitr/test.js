var test = require('tape'),
    request = require('request'),
    express = require('express'),
    limitr = require('./index'),
    TimeDevice = require('./lib/time-device');

var app = express();
var config = {
  limit: 5,
  period: 2 /* seconds */,
  clientId: 'headers.token',
  ignore: ['ignore-me']
};

test('time-device test', function(t) {
  t.plan(9);

  var td = new TimeDevice({
    limit: config.limit,
    period: config.period
  });

  td.start();

  var loops = 5;
  for(var i = 0; i < loops; i++) {
    td.increment();
  }

  /* Test limit not exceeded */
  t.equal(td.requests, loops);
  t.equal(td.remainingRequests(), config.limit - loops);
  t.equal(td.limitExceeded, false);

  td.increment();

  /* Test limit exceeded */
  t.equal(td.requests, loops + 1);
  t.equal(td.remainingRequests(), 0);
  t.equal(td.limitExceeded, true);

  /* Test rate limit reset */
  setTimeout(function() {
    t.equal(td.requests, 0);
    t.equal(td.remainingRequests(), config.limit);
    t.equal(td.limitExceeded, false);
  }, 2000);
});

test('limitr test', function(t) {
  t.plan(1);

  var fn = limitr(config);

  t.equal(typeof fn, 'function');
});

test('rest test', function(t) {
  t.plan(15);

  var app = express();
  app.use('/', limitr(config));
  app.get('/ping', function(req, res) {
    res.send(200, 'Pong!');
  });

  app.listen(1990);

  var limitHeader     = 'x-ratelimit-limit';
  var remainingHeader = 'x-ratelimit-remaining';
  var resetHeader     = 'x-ratelimit-reset';

  /* Test ignore */
  var optsIgnore = {
    url: 'http://localhost:1990/ping',
    method: 'GET',
    headers: {
      token: 'ignore-me'
    }
  };

  request(optsIgnore, function(err, response, body) {
    t.equal(response.statusCode, 200);
    t.equal(body, 'Pong!');

    t.equal(response.headers[limitHeader], undefined);
    t.equal(response.headers[remainingHeader], undefined);
    t.equal(response.headers[resetHeader], undefined);
  });

  /* Test normal rate-limiting scenario */
  var opts = {
    url: 'http://localhost:1990/ping',
    method: 'GET',
    headers: {
      token: 'dont-ignore-me'
    }
  };

  request(opts, function(err, response, body) {
    t.equal(response.statusCode, 200);
    t.equal(body, 'Pong!');

    t.equal(parseInt(response.headers[limitHeader]), config.limit);
    t.equal(parseInt(response.headers[remainingHeader]), config.limit - 1);

    var resetTime = parseInt(response.headers[resetHeader]);
    t.equal(resetTime > Date.now(), true);
  });

  /* Test rate-limiting exceeded */
  var loops = 4;
  for(var i = 0; i < loops; i++) {
    request(opts);
  }

  request(opts, function(err, response, body) {
    t.equal(response.statusCode, 429);
    t.equal(JSON.parse(body).message, 'API rate limit exceeded.');

    t.equal(parseInt(response.headers[limitHeader]), config.limit);
    t.equal(parseInt(response.headers[remainingHeader]), 0);

    var resetTime = parseInt(response.headers[resetHeader]);
    t.equal(resetTime > Date.now(), true);
  });
});

test('end', function(t) {
  t.end();
  process.exit();
});
