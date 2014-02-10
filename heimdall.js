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
var resources = [];
var routes    = [];

//Default security middleware, can override
var security  = {authenticate:function(req,res,next){next()}};

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
	if (records.__next) oData.d.__prev = records.__next;
	
	return oData;
};

//Formats an oData JSON error response
var error = function(err,code,message) {
	code = (code||500).toString();
	message = message||"Internal Server Error";
	var oData = {error:{
			code : code,
			message : message,
			innererror : err
	}};
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
	};
	
	return routes[name+'_'+type];
	
};

// --------------------------------------------------------------------------
// Creates an oData ENTRY immutable resource, based on an API specification
var Entry = function(name,resource,app) {
	if (resource.api.ENTRY.open) {
		app.get('/'+name+'/:name/?', route(name,'entry',resource.api.ENTRY));
	} else { 
		app.get('/'+name+'/:name/?', security.authenticate, route(name,'entry',resource.api.ENTRY));
	}
};

// --------------------------------------------------------------------------
// Creates an oData COLLECTION immutable resource, based on an API specification
var Collection = function(name,resource,app) {
	if (resource.api.COLLECTION.open) {
		app.get('/'+name+'/?', route(name,'collection',resource.api.COLLECTION));
	} else {
		app.get('/'+name+'/?', security.authenticate, route(name,'collection',resource.api.COLLECTION));
	}
};

// --------------------------------------------------------------------------
// Creates an oData ADD mutable resource, based on an API specification
var Add = function(name,resource,app) {
	if (resource.api.ADD.open) {
		app.post('/'+name+'/?', route(name,'add',resource.api.ADD));
	} else {
		app.post('/'+name+'/?', security.authenticate, route(name,'add',resource.api.ADD));
	}
};

// --------------------------------------------------------------------------
// Creates an oData SAVE mutable resource, based on an API specification
var Save = function(name,resource,app) {
	app.put('/'+name+'/?', security.authenticate, route(name,'save',resource.api.SAVE));
};

// --------------------------------------------------------------------------
// Creates an oData REMOVE mutable resource, based on an API specification
var Remove = function(name,resource,app) {
	app['delete']('/'+name+'/:name/?', security.authenticate, route(name,'remove',resource.api.REMOVE));
};

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
		var data;
		if (req.heimdall) {
			data = req.heimdall.d;
		} else {
			data = {};
			for(var key in req.query) {
				if(req.query.hasOwnProperty(key))
					data[key] = req.query[key];
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
	for(var method in resource.api) {
		if(resource.api.hasOwnProperty(method)) {
			switch(method) {
				case 'ENTRY': Entry(resource.name,resource,app); break;
				case 'COLLECTION': Collection(resource.name,resource,app); break;
				case 'ADD': Add(resource.name,resource,app); break;
				case 'SAVE': Save(resource.name,resource,app); break;
				case 'REMOVE': Remove(resource.name,resource,app); break;
			}
		}
	} 
};

// --------------------------------------------------------------------------
// Heimdall Main entry point
//  params:
//    @path - the absolute path to the API definition files
//    @app  - the express app
//    @auth - optional authentication middleware
var load = Heimdall.load = function(path,app,auth) {

	if (typeof auth==='function') security.authenticate = auth;

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

	//Chain after load:
	return Heimdall;

}


//Declare all the oData Edm DataTypes
var guidre = /^(guid\')?([\dabcdef]{8,8}-[\dabcdef]{4,4}-[\dabcdef]{4,4}-[\dabcdef]{4,4}-[\dabcdef]{12,12})(\')?$/i;
new EdmType("NULL",		function(val) { return val===null || val == 'null'; }, function(val) { return null; });
new EdmType("binary",	function(val) { return true; });
new EdmType("boolean",	function(val) { return val===true || val===false || val==='on' || val==='checked' || val == '1' || val =='true'; }, function(val) { return val?1:0; });
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
http://www.odata.org/documentation/odata-v2-documentation/overview/#6_Primitive_Data_Types

Primitive Types,Literal Form,Example
Null		Represents the absence of a value	null	Example 1: null
Edm.Binary	Represent fixed- or variable- length binary data	binary’[A-Fa-f0-9][A-Fa-f0-9]*’ OR X ‘[A-Fa-f0-9][A-Fa-f0-9]*’ NOTE: X and binary are case sensitive. Spaces are not allowed between binary and the quoted portion. Spaces are not allowed between X and the quoted portion. Odd pairs of hex digits are not allowed.	Example 1: X’23AB’ Example 2: binary’23ABFF’
Edm.Boolean	Represents the mathematical concept of binary-valued logic	true | false	Example 1: true Example 2: false
Edm.Byte	Unsigned 8-bit integer value	[A-Fa-f0-9]+	Example 1: FF
Edm.DateTime	Represents date and time with values ranging from 12:00:00 midnight, January 1, 1753 A.D. through 11:59:59 P.M, December 9999 A.D.	datetime’yyyy-mm-ddThh:mm[:ss[.fffffff]]’ NOTE: Spaces are not allowed between datetime and quoted portion. datetime is case-insensitive	Example 1: datetime’2000-12-12T12:00′
Edm.Decimal	Represents numeric values with fixed precision and scale. This type can describe a numeric value ranging from negative 10^255 + 1 to positive 10^255 -1	[0-9]+.[0-9]+M|m	Example 1:2.345M
Edm.Double	Represents a floating point number with 15 digits precision that can represent values with approximate range of Â± 2.23e -308 through Â± 1.79e +308	[0-9]+ ((.[0-9]+) | [E[+ | -][0-9]+])	Example 1: 1E+10 Example 2: 2.029 Example 3: 2.0
Edm.Single	Represents a floating point number with 7 digits precision that can represent values with approximate range of Â± 1.18e -38 through Â± 3.40e +38	[0-9]+.[0-9]+f	Example 1: 2.0f
Edm.Guid	Represents a 16-byte (128-bit) unique identifier value	guid’dddddddd-dddd-dddd-dddd-dddddddddddd’ where each d represents [A-Fa-f0-9]	Example 1: guid’12345678-aaaa-bbbb-cccc-ddddeeeeffff’
Edm.Int16	Represents a signed 16-bit integer value	[-] [0-9]+	Example 1: 16 Example 2: -16
Edm.Int32	Represents a signed 32-bit integer value	[-] [0-9]+	Example 1: 32 Example 2: -32
Edm.Int64	Represents a signed 64-bit integer value	[-] [0-9]+L	Example 1: 64L Example 2: -64L
Edm.SByte	Represents a signed 8-bit integer value	[-] [0-9]+	Example 1: 8 Example 2: -8
Edm.String	Represents fixed- or variable-length character data	‘<any UTF-8 character>’ Note: See definition of UTF8-char in [RFC3629]	Example 1: ‘Hello OData’
Edm.Time	Represents the time of day with values ranging from 0:00:00.x to 23:59:59.y, where x and y depend upon the precision	time’<timeLiteral>’ timeLiteral = Defined by the lexical representation for time at http://www.w3.org/TR/xmlschema-2	Example 1: 13:20:00
Edm.DateTimeOffset	Represents date and time as an Offset in minutes from GMT, with values ranging from 12:00:00 midnight, January 1, 1753 A.D. through 11:59:59 P.M, December 9999 A.D	datetimeoffset’<dateTimeOffsetLiteral>’ dateTimeOffsetLiteral = Defined by the lexical representation for datetime (including timezone offset) at http://www.w3.org/TR/xmlschema-2	Example 1: 2002-10-10T17:00:00Z
*/
