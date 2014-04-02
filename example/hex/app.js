/****************************************************************************
*
* Example Hexadecimal and Helloworld API specifications for Heimdall
* March, 2014 
*
****************************************************************************/


var express = require('express')
  , http = require('http')
  , heimdall = require('../../heimdall');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(app.router);

// ----------------------------------------------
// Declare our custom Hexadecimal datatype
heimdall.type({ 
	name:"hexadecimal", 
	validate:function(val){ return (/^([a-f0-9]{6})$/i).test(val)?true:false; }
});

// ----------------------------------------------
// Load all our API resources
heimdall.load(process.cwd()+'/api/',app);

// ----------------------------------------------
// Start the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});