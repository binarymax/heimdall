/**
 *
 * Heimdall Todo Application Example
 * Copyright 2014, Max Irwin
 * MIT License
 *
 */

var express = require('express')
  , heimdall= require('../../heimdall')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

heimdall.load(process.cwd() + '/api/',app);

app.get('/index.html',heimdall.middleware('todo','collection'),heimdall.render('index.jade'));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
