var tools = require('./tools');
var render = require('./renderer').render;

var format = tools.format;
var error = tools.error;

var Documenter = module.exports = {};

var specifications = Documenter.specifications = [];

// --------------------------------------------------------------------------
// Registers a heimdall-compliant API specification  
var documentresource = Documenter.resource = function(resource){
	var specification = {
		__metadata:{
			uri:'/api/'+resource.name,
			type:'api.resource'
		},
		__deferred:{
			uri:'/api/'+resource.name+'.html'
		},
		name:resource.name,
		description:resource.description,
		methods:{}
	};

	specifications.push(specification);
	
	return specification;
};

// --------------------------------------------------------------------------
// Registers a heimdall-compliant API method specification  
var documentmethod = Documenter.method = function(root,specification,verb,methodtype,method) {

	var url  = tools.buildroutestring(specification.name,root,method);
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

	specification.methods[methodtype.toLowerCase()] = doc;
};


// --------------------------------------------------------------------------
// Creates API Documentation resources for all Heimdall-Compliant routes 
var route = Documenter.route = function(app) {
	
	var viewpath = __dirname+'/views/';
	var apiview = viewpath + 'api';
	var methodview = viewpath + 'method'

	app.get("/api.html",function(req,res,next) {
		req.heimdall = format(req.headers.host,req.url,'API.Resource',specifications);
		next();
	},render(apiview));
	

	app.get("/api",function(req,res) {
		res.json(format(req.headers.host,req.url,'API.Resource',specifications));
	});

	var getspec = function(name) {
		var spec = null;

		for(var i=0,l=specifications.length;i<l;i++) {
			if (specifications[i].name === name) {
				spec = specifications[i];
				break;
			}
		}
		
		return spec;
	};

	app.get("/api/:name.html",function(req,res,next) {

		var spec = getspec(req.params.name);
		
		if(!spec) {
			res.status(404).send(error("The API resource specification '/api/" + req.params.name + "' could not be found, please check the URL and try again",404,"404 (not found)"));
			return false;
		}

		req.heimdall = format(req.headers.host,req.url,'API.Resource',[spec]);
		next();

	},render(apiview));


	app.get("/api/:name",function(req,res) {

		var spec = getspec(req.params.name);

		if(!spec) {
			res.status(404).send(error("The API resource specification '/api/" + req.params.name + "' could not be found, please check the URL and try again",404,"404 (not found)"));
			return false;
		}
		
		res.json(format(req.headers.host,req.url,'API.Resource',[spec]));

	});

	app.get("/api/:name/:type.html",function(req,res,next) {

		var spec = getspec(req.params.name);
		var meth = spec.methods[req.params.type.toLowerCase()];

		if(!spec) {
			res.status(404).send(error("The API resource specification '/api/" + req.params.name + "' could not be found, please check the URL and try again",404,"404 (not found)"));
			return false;
		}

		if(!meth) {
			res.status(404).send(error("The API resource specification method '/api/" + req.params.name + "/" + req.params.type + "' could not be found, please check the URL and try again",404,"404 (not found)"));
			return false;			
		}

		req.heimdall = format(req.headers.host,req.url,'API.Resource.Method',[meth]);
		next();

	},render(methodview));


	app.get("/api/:name/:type",function(req,res) {

		var spec = getspec(req.params.name);
		var meth = spec.methods[req.params.type.toLowerCase()];

		if(!spec) {
			res.status(404).send(error("The API resource specification '/api/" + req.params.name + "' could not be found, please check the URL and try again",404,"404 (not found)"));
			return false;
		}
		
		if(!meth) {
			res.status(404).send(error("The API resource specification method '/api/" + req.params.name + "/" + req.params.type + "' could not be found, please check the URL and try again",404,"404 (not found)"));
			return false;			
		}

		res.json(format(req.headers.host,req.url,'API.Resource.Method',[meth]));

	});

}; 