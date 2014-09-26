/**
 * Set keys and URL's
 */

var routeApiUri = process.env.ROUTING_API_URL;
var ntbApiUri = process.env.NTB_API_URL;
var ntbApiKey = process.env.NTB_API_KEY;

var dntApiKey = process.env.DNT_CONNECT_KEY;

var sessionSecret = process.env.SessionSecret || "0rdisObMCVXWawtji4B2iIGIKKqlsgAOPJhcHw4IREiCf7PGnAxY2isXfXd2Is7a";


/**
 * Module dependencies
 */

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var cookieSession = require('cookie-session');
var methodOverride = require('method-override');
var favicon = require('serve-favicon');
var DNT = require('dnt-api');
var raven = require('raven');

raven.patchGlobal(process.env.SENTRY_DNS, function(success, err) {
    console.error('Uncaught Exception');
    console.error('Logged to Sentry:', success);
    console.error(err);
});

// Start app
var app = module.exports = express();

// All environments
app.set('url', process.env.APP_URL);
app.set('port', process.env.PORT_WWW || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({extended: true}));
app.use(methodOverride());
app.use(cookieParser(sessionSecret));
app.use(cookieSession({name: 'turadmin:sess', secret: sessionSecret}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(raven.middleware.express(process.env.SENTRY_DNS));

/**
 * Configure environments
 */
if (app.get('env') === 'development') {
    // Development only
    app.set('view cache', false);
    app.set('url', process.env.APP_URL + ':' + app.get('port'));

} else if (app.get('env') === 'production') {
    // Production only
}

app.use(require('morgan')('dev'));
app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));

/**
 * Routes and middleware
 */

var userGroupsFetcher = require('./routes/userGroupsFetcher')(app, express, {api: new DNT('Turadmin/1.0', dntApiKey)});

require('./routes/auth')(app);

require('./routes/termsAndConditions')(app);

require('./routes/routes-index')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});

require('./routes/pois-index')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});

// var fileManager = require('./routes/pictureUpload')(app, express, { dirname: __dirname });
var pictureFileManager = require('./routes/pictureUpload')(app, express, { dirname: __dirname });
var gpxFileManager = require('./routes/gpxUpload')(app, express, { dirname: __dirname });

var restProxy = require('./routes/restProxy')(app, {ntbApiUri: ntbApiUri, ntbApiKey: ntbApiKey, pictureFileManager: pictureFileManager});

require('./routes/route')(app, restProxy, { routeApiUri: routeApiUri, dntApi: new DNT('Turadmin/1.0', dntApiKey), userGroupsFetcher: userGroupsFetcher });

require('./routes/poi')(app, restProxy, { routeApiUri: routeApiUri, dntApi: new DNT('Turadmin/1.0', dntApiKey), userGroupsFetcher: userGroupsFetcher });

require('./routes/ssrProxy')(app, {});

// NOTE: Only listen for port if the application is not included by another module. Eg. the test runner.
if (!module.parent) {
    app.listen(app.get('port'), function () {
        "use strict";
        console.log('Express server listening on port ' + app.get('port'));
    });
}

// Redirect requests to '/' to '/turer'
app.use('/', function(req, res, next){
  // res.redirect(301, '/turer');
});

// 404 handling
app.use(function(req, res, next){
    if (req.originalUrl === '/upload/picture') {
        //throw new Error('This route exists!');
        console.log('404 handling');
        console.log(req.jfum);
        return;
    }
    res.redirect(307, '/');
});

