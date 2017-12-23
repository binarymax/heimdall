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
app.set('port', process.env.PORT || 3456);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

heimdall.load(process.cwd() + '/api/',app);

app.get('/',heimdall.middleware('todo','collection'),heimdall.render('index'));
app.get('/index.html',heimdall.middleware('todo','collection'),heimdall.render('index'));
app.post('/index.html',heimdall.middleware('todo','add'),heimdall.render('index'));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
