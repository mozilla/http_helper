var http = require('http');
var request = require('request');
var helmet = require('helmet');
var express = require('express');
var app = express();
// Messina allows for GELF logging
var messina = require('messina');
var log = messina('myapp');

/* Simple string formatting
 *
 * > "Hello, {0}.".fmt('Mike');
 * Hello, Mike.
 */
function fmt(str, arr) {
  var args = Array.prototype.slice.call(arguments, 1);
  return str.replace(/\{[\w\d\._-]+\}/g, function (part) {
    var index;
    part = part.slice(1, -1);
    index = parseInt(part, 10);
    return args[index];
  });
}

module.exports = function (appOptions, port) {
  app.use(log.middleware({ combinedOutput: true }));

  // SECURITY SETTINGS
  // No xframe allowed
  app.use(helmet.xframe('deny'));
  // Hide that we're using Express
  app.use(helmet.hidePoweredBy());
  // Use XSS protection
  app.use(helmet.iexss());

  // A simple healthcheck endpoint for load balancers to watch
  app.get('/healthcheck', function(req, res) {
    res.send('healthcheck');
    console.log(
      fmt(
        'Request to {0}://{1}/{2} returned a {3}',
        req.protocol,
        req.host,
        req.path,
        res.statusCode
      )
    );
  });

  // Any other path or route takes us to this block
  app.get('*', function(req, res) {
    var requestHost = req.headers.host.split(':')[0];
    var hostOptions = appOptions[requestHost];

    // We only want to allow http protocol
    if (req.protocol !== 'http') {
      console.log(fmt('{0} is not a valid protocol', req.protocol));
      res.send(fmt('{0} is not a valid protocol for this app', req.protocol));
      res.end();
      return;
    }

    // We are only proxying or redirecting with GETs
    if (req.method !== 'GET') {
      console.log(fmt('{0} is not an acceptable method', req.method));
      res.end();
      return;
    }

    // If the host header does not have a corresponding entry in
    // the config.json file, bust out.
    if (!hostOptions) {
      console.log(fmt('{0} is not a valid host', req.host));
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end(fmt('{0} is invalid', req.host));
      return;
    }

    // actionOptions dictates whether this is a proxy or redirect
    var actionOptions = hostOptions.function;

    // target url for redirect and proxy requests
    var url = hostOptions.host + req.url;

    // For requests that match a redirect host
    if (actionOptions === "redirect") {
      // Set the status and redirect
      console.log(
        fmt(
          'Redirecting {0}://{1} to {2} with a http status code of {3}',
          req.protocol,
          req.host,
          hostOptions.host,
          hostOptions.code
        )
      );
      res.statusCode = hostOptions.code || 302;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Location', url);
      res.end('Redirecting to ' + url);
    }

    // For requests that match a proxy host
    if (actionOptions === "proxy") {
      request.get(url, function(error, result) {
        if (error) {
          res.write(
            fmt(
              "there was an error requesting {0}://{1}",
              req.protocol,
              hostOptions.host
            )
          );
          res.write( JSON.stringify(error) );
          return console.error(error);
        }
        console.log(fmt('Pulling {0} to {1}', url, requestHost));
        res.write( result.body );
        res.end();
      });
    }
  });

  app.listen(port || 80);
};
