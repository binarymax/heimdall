
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , heimdall = require('../../heimdall');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(app.router);

heimdall.load(process.cwd()+'/api/',app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
