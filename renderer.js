var fs = require('fs');

var Renderer = module.exports = {};

//Cached template file existence
var templateexists = [];

// --------------------------------------------------------------------------
// Render helper functions

//Get the expanded name of a view with req.params
var parseview = function(view,params) {
	if (view.indexOf(":")>-1) {
		for(var key in params) {
			if (params.hasOwnProperty(key)) {
				view = view.replace(":"+key, params[key]);
			}
		}
	}
	return view;
};

//Renders the view, after verifying the template exists
var renderview = function(req,res,view) {		

	//Inherit chained heimdall data
	var data = req.heimdall ? req.heimdall.d : {};

	var key;

	//Add params data to the view object
	data.params = {};
	for(key in req.params) {
		if(req.params.hasOwnProperty(key)) {
			data.params[key] = req.params[key];
		}
	}

	//Add query data to the view object
	data.query = {};
	for(key in req.query) {
		if(req.query.hasOwnProperty(key)) {
			data.query[key] = req.query[key];
		}
	}

	//Add session data to the view object
	data.session = {};
	for(key in req.session) {
		if(req.session.hasOwnProperty(key) && key!= 'cookie') {
			data.session[key] = req.session[key];
		}
	}

	data.request = {};
	data.request.url = req.url;

	res.render(view,data);
};

// --------------------------------------------------------------------------
//Public Heimdall render method 
var render = Renderer.render = function(view) {

	return function(req,res){

		var notfound = function(){ res.sendStatus(404); };

		var viewname = parseview(view,req.params);
		
		if (templateexists[viewname] === true) {
			//template known to exist, render
			renderview(req,res,viewname);

		} else if (templateexists[viewname] === false) {
			//template known to not exist, 404
			notfound();

		} else {
			//check if template exists
			var filename = (viewname.indexOf('/heimdall/views/')>-1?viewname:process.cwd()+'/views/'+viewname)+'.pug';
			fs.exists(filename, function(exists) {

				if (exists) { 
					//Template exists!  Cache result and render
					templateexists[viewname]=true;
					renderview(req,res,viewname);

				} else {
					//Template does not exist!  Cache result and 404
					templateexists[viewname]=false;
					notfound(); 

				}
										
			});
		}
	};
};
