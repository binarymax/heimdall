var Tools = module.exports = {};

//Formats an oData-V2-style JSON response
var format = Tools.format = function(host,uri,type,records) {
	var __index = 0;
	var baseuri = "//" + host;
	if (!(records instanceof Array)) records = [records]; 
	var oData = {d:{
		__count : records.length,
		results : records.map(function(rec){
			rec.__index         = __index++;
			rec.__metadata      = rec.__metadata      || {}
			rec.__metadata.uri  = rec.__metadata.uri  || (baseuri+uri);  
			rec.__metadata.type = rec.__metadata.type || type;  
			return rec;
		})
	}};
	
	if (records.__prev) oData.d.__prev = records.__prev;
	if (records.__next) oData.d.__next = records.__next;
	
	return oData;
};

//Formats an oData-V2-style JSON error response
var error = Tools.error = function(err,code,message,innererror) {
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

var buildroutestring = Tools.buildroutestring = function(name,root,method) {
	var routestring = root + name + "/";
	for(var p in method.params) {
		if (method.params.hasOwnProperty(p)) {
			routestring += ":" + p + "/";
		}
	}
	return routestring + "?";
}
