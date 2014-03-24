/****************************************************************************
*
* Heimdall - a self documenting oData API Guardian for Express 
* (c)Copyright 2014, Max Iwin
* MIT License
*
****************************************************************************/

//Module dependencies
var fs   = require('fs');

//All valid resources loaded by Heimdall
var specifications = [];
var resources = [];
var routes    = [];

//Environment context set by Express
var env;


//Default security middleware, can override
var security  = {authenticate:function(req,res,next){next()},administrator:function(req,res,next){res.send(403)}};

//Formats an oData JSON response
var format = function(host,uri,type,records) {
	var baseuri = "//" + host;
	var oData = {d:{
		__count : records.length,
		results : records.map(function(rec){
			rec.__metadata = rec.__metadata || {
				uri:baseuri+uri,
				type:type
			}
			return rec;
		})
	}};
	
	if (records.__prev) oData.d.__prev = records.__prev;
	if (records.__next) oData.d.__next = records.__next;
	
	return oData;
};

//Formats an oData JSON error response
var error = function(err,code,message,innererror) {
	code = (code||500).toString();
	message = message||"Internal Server Error";
	var oData = {error:{
			code : code,
			message : message,
			innererror : innererror||err
	}};
	
	if ('development' == env) {
		//Verbose console errors for development environments 
		console.error(oData.error);
	}
	
	return oData;
}

// --------------------------------------------------------------------------
// Heimdall Exports Object:
var Heimdall = module.exports = {oData:{Edm:{}}};

// --------------------------------------------------------------------------
// oData Edm DataType helper.  Used for validation and casting
var EdmType = Heimdall.oData.EdmType = function(type,validate,cast) {
	var self = this;
	self.type = type;
	self.validate = validate;
	self.cast = cast||function(val){return val;};
	Heimdall.oData.Edm[type] = function(description,required) {
		return new EdmClass(self,description,required);
	};
};

var EdmClass = function(edmtype,description,required) {
	var self = this;
	self.type = edmtype;
	self.description = description||edmtype.type;
	self.required = required?true:false;
};

// --------------------------------------------------------------------------
// Creates a heimdall route for a request
//  - Collects all predefined data into an object
//  - Ensures strict API definition
var route = function(name,type,method) {

	resources[name+'_'+type] = function(context,data,callback) {
		method.command.call(context, data, callback);
	};
	
	routes[name+'_'+type] = function(req,res,next) {

		var data = {};

		var check = function(specification,source) {
			var edm;
			for(var key in specification) {
				if (specification.hasOwnProperty(key) && (specification[key] instanceof EdmClass) && (source[key]||specification[key].required)) {
					edm = specification[key].type;
					if(edm.validate(source[key])) {
						data[key] = edm.cast(source[key]);
					} else {
						res.status(449).send(error("Type Error: '" + source[key] + "' is not a valid value for '" + key + "'",449,"Retry with " + edm.type))
						return false;
					}
				}
			}
			return true;
		}	

		if(method.query && !check(method.query,req.query)) return false;
		
		if(method.params && !check(method.params,req.params))  return false;

		if(method.body && !check(method.body,req.body)) return false;
		
		if(method.files && !check(method.files,req.files)) return false;

		//Add the session to the data
		for(var s in req.session) { if(req.session.hasOwnProperty(s) && s!=='cookie') data[s] = req.session[s]; }

		try {
			//Data object ready, call the resource command:
			resource(name, type, data, function(err,result) {
				if (err) {
					res.json(error(req.headers.host,req.url,name+'.'+type,err));
				} else if (data.redirect) {
					res.redirect(data.redirect);
				} else if (req.route.path.indexOf('.html')===-1) {
					res.json(format(req.headers.host,req.url,name+'.'+type,result));
				} else {
					req.heimdall = format(req.headers.host,req.url,name+'.'+type,result);
					next();
				}
			});
		} catch (ex) {
			//Exception in resource command
			res.json(error(req.headers.host,req.url,"Internal Command Error",ex.toString()));			
		}
	};
	
	return routes[name+'_'+type];
	
};


// --------------------------------------------------------------------------
// Registers a heimdall-compliant API specification  
var documentresource = function(resource){
	return {
		__metadata:{
			uri:'/api/'+resource.name,
			type:'api.resource'
		},
		name:resource.name,
		description:resource.description,
		methods:[]
	}
}

// --------------------------------------------------------------------------
// Registers a heimdall-compliant API method specification  
var documentmethod = function(specification,verb,methodtype,method) {

	var url  = buildroutestring(specification.name,method);
	var type = specification.name + '.' + methodtype.toLowerCase();

	var doc = {verb:verb,description:method.description,url:url,type:type};

	verb = verb.toUpperCase();

	var inputspec = function(items) {
		var obj = method[items];
		if (obj) {
			var list = [];
			for (var o in obj) {
				if(obj.hasOwnProperty(o)) {
					list.push({
						key:o,
						type:obj[o].type.type,
						description:obj[o].description,
						required:obj[o].required
					});
				}
			}
			if(list.length) doc[items] = list;
		}
	};

	inputspec('params');
	inputspec('query');
	inputspec('body');
	inputspec('files');
	inputspec('fields');

	specification.methods.push(doc);
}


// --------------------------------------------------------------------------
// Creates API Documentation resources for all Heimdall-Compliant routes 
var documentation = function(app) {
	
	app.get("/api",function(req,res) {
		res.json(format(req.headers.host,req.url,'API.Resource',specifications));
	});

	app.get("/api/:name",function(req,res) {

		var spec = null;

		for(var i=0,l=specifications.length;i<l;i++) {
			if (specifications[i].name === req.params.name) {
				spec = specifications[i];
				break;
			}
		}
		
		if(spec) {
			res.json(format(req.headers.host,req.url,'API.Resource',[spec]));
		} else {
			res.status(404).send(error("The API resource specification '/api/" + req.params.name + "' could not be found, please check the URL and try again",404,"404 (not found)"));
		}

	});

}; 

// --------------------------------------------------------------------------
// Builds a url route string, based on accepted method params 
var buildroutestring = function(name,method) {
	var routestring = "/"+name+"/";
	for(var p in method.params) {
		if (method.params.hasOwnProperty(p)) {
			routestring += ":" + p + "/";
		}
	}
	return routestring + "?";
}

// --------------------------------------------------------------------------
// Builds an REST resource based on an API specification 
var buildmethodresource = function(name,resource,specification,verb,methodname,app) {
	var method = resource.api[methodname];
	var routestring = buildroutestring(name,method);
	var methodnamelc = methodname.toLowerCase();
	var verblc = verb.toLowerCase();

	documentmethod(specification,verb,methodname,method);

	if (method.open) {
		app[verblc](routestring, route(name,methodnamelc,method));
	} else 	if (method.admin) {
		app[verblc](routestring, security.administrator, route(name,methodnamelc,method));
	} else {  
		app[verblc](routestring, security.authenticate, route(name,methodnamelc,method));
	}
}

// --------------------------------------------------------------------------
// Expose heimdall resource calls for use by other modules 
var resource = Heimdall.resource = function(name,type,data,callback) {
	resources[name+'_'+type]({name:name,type:type},data,callback);
};

// --------------------------------------------------------------------------
// Middleware to set a querystring value or values 
var set = Heimdall.set = function(query) {
	return function(req,res,next) { 
		for(var key in query) { if(query.hasOwnProperty(key)) { req.query[key] = query[key]; } }
		next();
	}
};

// --------------------------------------------------------------------------
// Expose heimdall resource calls for use as connect/express middleware 
var middleware = Heimdall.middleware = function(name,type) {
	return routes[name+'_'+type];
};

// --------------------------------------------------------------------------
// Renders heimdall middleware oData to a view 
var render = Heimdall.render = function(view) {
	return function(req,res){
		var data = req.heimdall ? req.heimdall.d : {};

		//Add query data to the view object
		data.query = {};
		for(var key in req.query) {
			if(req.query.hasOwnProperty(key)) {
				data.query[key] = req.query[key];
			}
		}

		//Add session data to the view object
		data.session = {};
		for(var key in req.session) {
			if(req.session.hasOwnProperty(key) && key!= 'cookie') {
				data.session[key] = req.session[key];
			}
		}

		res.render(view,data);
	}
}

// --------------------------------------------------------------------------
// Registers all the resources for a heimdall-compliant API specification 
var register = Heimdall.register = function(filename,resource,app) {
	if (typeof resource.name !== "string") { throw (new Error("Resource " + filename + " requires a name")); return false;}
	if (typeof resource.description !== "string") { throw (new Error("Resource " + name + " at " + filename + " requires a description")); return false;}
	if (typeof resource.api !== "object") { throw (new Error("Resource " + name + " at "  + filename + " requires an API definition")); return false;}
	var specification = documentresource(resource);
	for(var method in resource.api) {
		if(resource.api.hasOwnProperty(method)) {
			switch(method) {
				case 'ENTRY': buildmethodresource(resource.name,resource,specification,'GET',method,app); break;
				case 'COLLECTION': buildmethodresource(resource.name,resource,specification,'GET',method,app); break;
				case 'ADD': buildmethodresource(resource.name,resource,specification,'POST',method,app); break;
				case 'SAVE': buildmethodresource(resource.name,resource,specification,'PUT',method,app); break;
				case 'REMOVE': buildmethodresource(resource.name,resource,specification,'DELETE',method,app); break;
			}
		}
	}
	specifications.push(specification); 
};

// --------------------------------------------------------------------------
// Heimdall Main entry point
//  params:
//    @path - the absolute path to the API definition files
//    @app  - the express app
//    @auth - optional authentication middleware
var load = Heimdall.load = function(path,app,auth,admin) {

	if (typeof auth==='function') security.authenticate = auth;
	if (typeof admin==='function') security.administrator = admin;

	var revar = /\w+\.js$/i;
	var files = fs.readdirSync(path);
	var file, name, resource;
	for (var i=0,l=files.length;i<l;i++) {
		file = files[i];
		if (revar.test(file)) {
			console.log('Heimdall found API specification',file);	
			name = file.substr(0,file.indexOf(".js"));
			resource = require(path+name);
			register(path+name,resource,app);
		}
	}
	
	env = app.get('env');

	documentation(app);

	//Chain after load:
	return Heimdall;

}


//Declare all the oData Edm DataTypes
var guidre = /^(guid\')?([\dabcdef]{8,8}-[\dabcdef]{4,4}-[\dabcdef]{4,4}-[\dabcdef]{4,4}-[\dabcdef]{12,12})(\')?$/i;
new EdmType("NULL",		function(val) { return val===null || val == 'null'; }, function(val) { return null; });
new EdmType("binary",	function(val) { return true; });
new EdmType("boolean",	function(val) { return val===true || val===false || val==='on' || val==='checked' || val == '1' || val =='true' || val == '0' || val == 'false' || val == 1 || val == 0;}, function(val) { return (val===true || val==='on' || val==='checked' || val == '1' || val =='true' || val==1 )?1:0; });
new EdmType("byte",		function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=0 && val<=256; },function(val){ return parseInt(val);});
new EdmType("datetime",	function(val) { return (new Date(val))?true:false; },function(val){ return new Date(val) });
new EdmType("decimal",	function(val) { return !isNaN(parseFloat(val)); }, function(val){ return parseFloat(val);}); //TODO - validate min/max
new EdmType("double",	function(val) { return !isNaN(parseFloat(val)); }, function(val){ return parseFloat(val);}); //TODO - validate min/max
new EdmType("single",	function(val) { return !isNaN(parseFloat(val)); }, function(val){ return parseFloat(val);}); //TODO - validate min/max
new EdmType("guid",		function(val) { return guidre.test(val); });
new EdmType("int16",	function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1; },function(val){ return parseInt(val);}); //TODO - validate min/max
new EdmType("int32",	function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1; },function(val){ return parseInt(val);}); //TODO - validate min/max
new EdmType("int64",	function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1; },function(val){ return parseInt(val);}); //TODO - validate min/max
new EdmType("sbyte",	function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=-128 && val<=127; },function(val){ return parseInt(val);});
new EdmType("string",	function(val) { return typeof val === "string"; });
new EdmType("time",		function(val) { return true; }); //TODO - validate and cast
new EdmType("datetimeoffset",function(val) { return true; }); //TODO - validate and cast

/*
http://www.odata.org/documentation/odata-version-2-0/overview/#AbstractTypeSystem

Primitive Types,Literal Form,Example
Null		Represents the absence of a value	null	Example 1: null
Edm.Binary	Represent fixed- or variable- length binary data	binary'[A-Fa-f0-9][A-Fa-f0-9]*' OR X '[A-Fa-f0-9][A-Fa-f0-9]*' NOTE: X and binary are case sensitive. Spaces are not allowed between binary and the quoted portion. Spaces are not allowed between X and the quoted portion. Odd pairs of hex digits are not allowed.	Example 1: X'23AB' Example 2: binary'23ABFF'
Edm.Boolean	Represents the mathematical concept of binary-valued logic	true | false	Example 1: true Example 2: false
Edm.Byte	Unsigned 8-bit integer value	[A-Fa-f0-9]+	Example 1: FF
Edm.DateTime	Represents date and time with values ranging from 12:00:00 midnight, January 1, 1753 A.D. through 11:59:59 P.M, December 9999 A.D.	datetime'yyyy-mm-ddThh:mm[:ss[.fffffff]]' NOTE: Spaces are not allowed between datetime and quoted portion. datetime is case-insensitive	Example 1: datetime'2000-12-12T12:00′
Edm.Decimal	Represents numeric values with fixed precision and scale. This type can describe a numeric value ranging from negative 10^255 + 1 to positive 10^255 -1	[0-9]+.[0-9]+M|m	Example 1:2.345M
Edm.Double	Represents a floating point number with 15 digits precision that can represent values with approximate range of ± 2.23e -308 through ± 1.79e +308	[0-9]+ ((.[0-9]+) | [E[+ | -][0-9]+])	Example 1: 1E+10 Example 2: 2.029 Example 3: 2.0
Edm.Single	Represents a floating point number with 7 digits precision that can represent values with approximate range of ± 1.18e -38 through ± 3.40e +38	[0-9]+.[0-9]+f	Example 1: 2.0f
Edm.Guid	Represents a 16-byte (128-bit) unique identifier value	guid'dddddddd-dddd-dddd-dddd-dddddddddddd' where each d represents [A-Fa-f0-9]	Example 1: guid'12345678-aaaa-bbbb-cccc-ddddeeeeffff'
Edm.Int16	Represents a signed 16-bit integer value	[-] [0-9]+	Example 1: 16 Example 2: -16
Edm.Int32	Represents a signed 32-bit integer value	[-] [0-9]+	Example 1: 32 Example 2: -32
Edm.Int64	Represents a signed 64-bit integer value	[-] [0-9]+L	Example 1: 64L Example 2: -64L
Edm.SByte	Represents a signed 8-bit integer value	[-] [0-9]+	Example 1: 8 Example 2: -8
Edm.String	Represents fixed- or variable-length character data	'<any UTF-8 character>' Note: See definition of UTF8-char in [RFC3629]	Example 1: 'Hello OData'
Edm.Time	Represents the time of day with values ranging from 0:00:00.x to 23:59:59.y, where x and y depend upon the precision	time'<timeLiteral>' timeLiteral = Defined by the lexical representation for time at http://www.w3.org/TR/xmlschema-2	Example 1: 13:20:00
Edm.DateTimeOffset	Represents date and time as an Offset in minutes from GMT, with values ranging from 12:00:00 midnight, January 1, 1753 A.D. through 11:59:59 P.M, December 9999 A.D	datetimeoffset'<dateTimeOffsetLiteral>' dateTimeOffsetLiteral = Defined by the lexical representation for datetime (including timezone offset) at http://www.w3.org/TR/xmlschema-2	Example 1: 2002-10-10T17:00:00Z
*/
