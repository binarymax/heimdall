/****************************************************************************
*
* Heimdall - a self documenting API Guardian for Express 
* (c)Copyright 2014, Max Irwin
* MIT License
*
****************************************************************************/

//Module dependencies
var fs = require('fs');

var datatype = require('datatype');

var tools = require('./tools');
var render = require('./renderer').render;
var documenter = require('./documenter');

//All valid resources loaded by Heimdall
var resources = [];
var routes    = [];

//Environment context set by Express
var env;

//Default security middleware, can override
var security  = {authenticate:function(req,res,next){next();},administrator:function(req,res,next){res.send(403);}};

//Builtin request parameters that are always allowed and do not need to be specified
var builtins  = {
	__start:datatype.int("The record number to start from"),
	__rows:datatype.int("The number of rows to return")
};

//List of property names that are reserved
var reserved = {
	session:true,
	__start:true,
	__rows:true
};

//Tool library shortcuts
var format = tools.format;
var error = function() {
	var args = Array.prototype.slice.apply(arguments);
	var data = tools.error.apply(this, args);
	if (env === 'development') {
		//Verbose console errors for development environments 
		console.error(data.error);
		console.trace();
	}
	return data;
};

// ==========================================================================
// Heimdall Exports Object:
var Heimdall = module.exports = {datatypes:datatype};


// --------------------------------------------------------------------------
// Checks a set of request fields with the specification 
//  - Validates source data with defined datatypes (in-spec and builtins)
//  - Groups into valid data and errors
var check = function(validation,apiurl,specification,source) {
	var data = validation.data;
	var errors = validation.errors;
	var keytype;

	if (source) {
		//Check the request against the specification
		for(var key in specification) {
			var sk = source[key];
			var sp = specification[key];
			if (specification.hasOwnProperty(key) && datatype.isType(specification[key]) && (source[key]||specification[key].required)) {
				keytype = specification[key];
				if(keytype.validate(source[key])) {
					data[key] = keytype.cast(source[key]);
				} else {
					var errormessage;
					if (specification[key].required && !source[key]) {
						errormessage = "Missing Required Parameter: a value must be supplied for '" + key + "'";
					} else {
						errormessage = "Type Error: '" + source[key] + "' is not a valid value for '" + key + "'";
					}
					errors.push({code:"449",message:"Retry with " + keytype.type,expects:keytype.description,description:errormessage,specification:apiurl});
				}
			}
		}

		//Check for builtin params
		for(var key in builtins) {
			if (builtins.hasOwnProperty(key) && source[key]) {
				keytype = builtins[key];
				if(keytype.validate(source[key])) {
					data[key] = keytype.cast(source[key]);
				} else {
					var errormessage = "Type Error: '" + source[key] + "' is not a valid value for '" + key + "'";
					errors.push({code:"449",message:"Retry with " + keytype.type,expects:keytype.description,description:errormessage,specification:apiurl});
				}

			}
		}
	}
	
	return {data:data,errors:errors};
};	

var command = function(name,type,data,resource,success,failure) {
	try {
		//Data object ready, call the resource command:
		resource(name, type, data, success);
	} catch (ex) {
		//Exception in resource command
		failure(ex);
	}
}

// --------------------------------------------------------------------------
// Creates a heimdall route for a request
//  - Collects all predefined data into an object
//  - Ensures strict API definition
var route = function(name,type,method) {

	resources[name+'_'+type] = function(context,data,callback) {
		method.command.call(context, data, callback);
	};
	
	routes[name+'_'+type] = function(req,res,next) {

		var validation = {data:{},errors:[]};
		var apiurl = req.protocol + '://'+req.headers.host+'/api/'+name+'/'+type+'.html';

		if(method.query  || req.query)  validation = check(validation,apiurl,method.query,req.query);
		
		if(method.params || req.params) validation = check(validation,apiurl,method.params,req.params);

		if(method.body   || req.body)   validation = check(validation,apiurl,method.body,req.body);
		
		if(method.files  || req.files)  validation = check(validation,apiurl,method.files,req.files);

		if(validation.errors.length) {
			//Validation errors, respond to client
			res.status(449).send(error("Invalid Data",449,"Validation Failed",validation.errors));
			return false;
		}

		var data = validation.data;

		//Add the request session to the data
		data.session = {};
		for(var s in req.session) { 
			if(req.session.hasOwnProperty(s) && s!=='cookie') {
				data[s] = req.session[s]; //Convenience, with risk of override in the specification
				data.session[s] = req.session[s]; //Safety, can only be set by Heimdall between request and controller
			}
		}

		var commandSuccess = function(err,result) {

			if (!isNaN(req.heimdallcacheduration)) {
				res.setHeader('Cache-Control', 'public, max-age=' + req.heimdallcacheduration);
			}

			if (err) {
				if(!isNaN(parseInt(err.code))) res.status(parseInt(err.code));
				res.json(error(req.headers.host,err.code,name+'.'+type,err));

			} else if (req.heimdallchain) {
				req.heimdallchain = null;
				req.heimdall = format(req.headers.host,req.url,name+'.'+type,result);
				next();

			} else if (data.redirect) {
				res.redirect(data.redirect);

			} else if (req.route.path.indexOf('.html')===-1) {
				res.json(format(req.headers.host,req.url,name+'.'+type,result));

			} else {
				req.heimdall = format(req.headers.host,req.url,name+'.'+type,result);
				next();
			}

		}

		var commandFailure = function(ex) {
			res.json(error(req.headers.host,req.url,"Internal Command Error",ex.toString()));
		}

		//Call the resource in a try/catch block
		command(name,type,data,resource,commandSuccess,commandFailure);


	};
	
	return routes[name+'_'+type];
	
};

// --------------------------------------------------------------------------
// Verifies that an API specification is valid
// Will panic and halt the application if an error is found
var blessmethodresource = function(name,verb,method) {

	var parts = 'query,params,body,files'.split(',');

	for(var i=0;i<parts.length;i++) {
		var part = method[parts[i]];
		for(var key in part) {
			if (reserved[key]) {
				//Panic!
				throw new Error('Unauthorized declaration of reserved specification key "' + key + '" in /' + name + '/' + verb);
				process.exit();
			}
		}
	}

};

// --------------------------------------------------------------------------
// Builds an REST resource based on an API specification 
var buildmethodresource = function(name,root,resource,specification,verb,methodname,app) {
	var method = resource.api[methodname];
	var routestring = tools.buildroutestring(name,root,method);
	var methodnamelc = methodname.toLowerCase();
	var verblc = verb.toLowerCase();

	blessmethodresource(name,verb,method);

	documenter.method(root,specification,verb,methodname,method);

	if (method.open) {
		app[verblc](routestring, route(name,methodnamelc,method));
	} else if (method.admin) {
		app[verblc](routestring, security.administrator, route(name,methodnamelc,method));
	} else {  
		app[verblc](routestring, security.authenticate, route(name,methodnamelc,method));
	}
};

// --------------------------------------------------------------------------
// Registers all the resources for a heimdall-compliant API specification 
var register = function(filename,resource,app) {
	if (typeof resource.name !== "string") { throw (new Error("Resource " + filename + " requires a name"));}
	if (typeof resource.description !== "string") { throw (new Error("Resource " + name + " at " + filename + " requires a description"));}
	if (typeof resource.api !== "object") { throw (new Error("Resource " + name + " at "  + filename + " requires an API definition"));}
	if (typeof resource.root !== "string" && resource.root) { throw (new Error("Resource root for " + name + " at "  + filename + " must be a string"));}
	var root = resource.root?("/"+root+"/"):"/";
	var specification = documenter.resource(resource);
	for(var method in resource.api) {
		if(resource.api.hasOwnProperty(method)) {
			switch(method) {
				case 'ENTRY': buildmethodresource(resource.name,root,resource,specification,'GET',method,app); break;
				case 'COLLECTION': buildmethodresource(resource.name,root,resource,specification,'GET',method,app); break;
				case 'ADD': buildmethodresource(resource.name,root,resource,specification,'POST',method,app); break;
				case 'SAVE': 
					buildmethodresource(resource.name,root,resource,specification,'PUT',method,app);
					buildmethodresource(resource.name,root,resource,specification,'POST',method,app);
					break;
				case 'REMOVE':buildmethodresource(resource.name,root,resource,specification,'DELETE',method,app); break;
			}
		}
	}
};


// --------------------------------------------------------------------------
// Expose heimdall resource calls for use by other modules 
var resource = Heimdall.resource = function(name,type,data,callback) {
	if (resources[name+'_'+type]) {
		resources[name+'_'+type]({name:name,type:type},data,callback);
	} else {
		var heimdall_resource_not_found = "ERROR - The Heimdall resource ["+name+"."+type+"] does not exist";
		console.error(heimdall_resource_not_found);
		callback(heimdall_resource_not_found);
	}
};

//===========================================================================
// Public Heimdall Middleware methods
//===========================================================================

// --------------------------------------------------------------------------
//Public Heimdall render method 
Heimdall.render = render;

// --------------------------------------------------------------------------
// Middleware to set a querystring value or values 
var set = Heimdall.set = function(query) {
	return function(req,res,next) { 
		for(var key in query) { if(query.hasOwnProperty(key)) { req.query[key] = query[key]; } }
		next();
	};
};

// --------------------------------------------------------------------------
// Expose Heimdall resource calls for use as connect/express middleware 
//	params:
//		@name - The API resource name
//		@type - The API resource method type (entry,collection,add,save,remove)
var middleware = Heimdall.middleware = function(name,type) {	
	if (routes[name+'_'+type]) {
		return routes[name+'_'+type];
	} else {
		var heimdall_middleware_not_found = "ERROR - The Heimdall route ["+name+"."+type+"] does not exist";
		throw new Error(heimdall_middleware_not_found);
	}	
};

// --------------------------------------------------------------------------
// Expose Heimdall resource calls for use as connect/express middleware 
//	params:
//		@name - The API resource name
//		@type - The API resource method type (entry,collection,add,save,remove)
var chain = Heimdall.chain = function(name,type) {
	if (routes[name+'_'+type]) {
		return function(req,res,next) {
			req.heimdallchain = true;
			routes[name+'_'+type].call(this,req,res,next);
		};
	} else {
		var heimdall_chain_not_found = "ERROR - The Heimdall route ["+name+"."+type+"] does not exist";
		throw new Error(heimdall_chain_not_found);
	} 

};

// --------------------------------------------------------------------------
// Middleware to set Cache-Control for the resource to a specific duration
//	params:
//		@duration - The cache duration in milliseconds
var cache = Heimdall.cache = function(duration) {
	return function(req,res,next) {
		req.heimdallcacheduration = duration;
		next();
	};
};

//===========================================================================
// Public Heimdall Initialization methods
//===========================================================================

// --------------------------------------------------------------------------
// Heimdall extended DataType creation method
//  params:
//    @datatype - the type object to create. Properties:
//              - "name"       - the name of the datatype           (required)
//				- "definition" - the textual definition             (optional)
//				- "validate"   - the validation function            (optional)
//				- "cast"       - the type casting function          (optional)
//				- "defaultvalue" - the default value to set         (optional)
var type = Heimdall.type = datatype.add;

// --------------------------------------------------------------------------
// Heimdall extended DataType creation method
//  params:
//    @datatypes - an array of type objects to create
var types = Heimdall.types = datatype.add;

// --------------------------------------------------------------------------
// Heimdall Main entry point
//  params:
//    @path - the absolute path to the API definition files
//    @app  - the express app
//    @auth - optional authentication middleware
var load = Heimdall.load = function(path,app,auth,admin) {

	//Set Express environment context
	env = app.get('env');

	//Override security middleware if specified
	if (typeof auth==='function') security.authenticate = auth;
	if (typeof admin==='function') security.administrator = admin;

	var revar = /\w+\.js$/i;
	var files = fs.readdirSync(path);
	var file, name, resource;

	console.log('Heimdall found',files.length,'API specifications');	
	
	for (var i=0,l=files.length;i<l;i++) {
		file = files[i];
		if (revar.test(file)) {
			console.log(' └── ',file);	
			name = file.substr(0,file.indexOf(".js"));
			resource = require(path+name);
			if(resource.resources && resource.resources instanceof Array) {
				resource.resources.map(function(apispec){ register(path+name,apispec,app) });
			} else {
				register(path+name,resource,app);
			}
		}
	}
	
	//Load documentation routes
	documenter.route(app);

	//Chain after load:
	return Heimdall;

};