var http = require('http');
var request = require('request');
var helmet = require('helmet')
var express = require('express');
var app = express();

// Messina allows for GELF logging
var messina = require('messina');
var log = messina('myapp');

// app.use(log.middleware({ combinedOutput: true }));

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
  app.get('/healthcheck', function(req, res){
    res.send('healthcheck');
    console.log('Request to ' + req.protocol + ':://' + req.host + '/' + req.path + ' returned a ' + res.statusCode );
  });

  // Any other path or route takes us to this block
  app.get('*', function(req, res){
    var requestHost = req.headers.host.split(':')[0];
    var hostOptions = appOptions[requestHost];

    // We only want to allow http protocol
    if(req.protocol != 'http'){
      console.log(req.protocol + 'is not a valid protocol');
      res.send(req.protocol + ' is not a valid protocol for this app');
      res.end();
      return;
    }

    // We are only proxying or redirecting with GETs
    if(req.method != 'GET'){
      console.log(req.method + ' is not an acceptable method');
      res.end();
      return;
    }

    // If the host header does not have a corresponding entry in
    // the config.json file, bust out.
    if(!hostOptions){
      console.log(req.host + ' is not a valid host');
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end(req.host + ' is invalid');
      return;
    }

    // actionOptions dictates whether this is a proxy or redirect
    var actionOptions = hostOptions.function;

    // For requests that match a redirect host
    if(actionOptions === "redirect"){
      var url = hostOptions.host + req.url;

      // Set the status and redirect
      console.log('Redirecting ' + req.protocol + '://' + req.host + ' to ' + hostOptions.host + ' with a http status code of ' + hostOptions.code);
      res.statusCode = hostOptions.code || 302;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Location', url);
      res.end('Redirecting to '+url);
    }

    // For requests that match a proxy host
    if(actionOptions === "proxy") {
      var url = hostOptions.host + req.url;
      request.get(url, function(error, result) {
        if (error) {
          res.write("there was an error requesting " + req.protocol + '://' + hostOptions.host);
          res.write( JSON.stringify(error) );
          return console.error(error);
        }
      console.log('Pulling ' + url + ' to ' + requestHost);
      res.write( result.body );
      res.end();
      return;
      });
    }
  });
  app.listen(80) ;
}
