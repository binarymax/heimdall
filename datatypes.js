var datatypes = [];

datatypes.push({
	name:"NULL",
	cast:function(val) { return null; },
	validate:function(val) { return val===null || val == 'null'; }
});

datatypes.push({
	name:"binary",
	cast:function(val) { return val; },
	validate:function(val) { return true; }
});

datatypes.push({
	name:"boolean",
	cast:function(val) { return (val===true || val==='on' || val==='checked' || val == '1' || val =='true' || val==1 )?1:0; },
	validate:function(val) { return val===true || val===false || val==='on' || val==='checked' || val == '1' || val =='true' || val == '0' || val == 'false' || val == 1 || val == 0;}
});

datatypes.push({
	name:"byte",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=0 && val<=256; }
});

datatypes.push({
	name:"datetime",
	cast:function(val){ return new Date(val) },
	validate:function(val) { return (new Date(val))?true:false; }
});

datatypes.push({
	name:"decimal",
	cast:function(val){ return parseFloat(val);},
	validate:function(val) { return !isNaN(parseFloat(val)); }
});

datatypes.push({
	name:"double",
	cast:function(val){ return parseFloat(val);},
	validate:function(val) { return !isNaN(parseFloat(val)); }
});

datatypes.push({
	name:"single",
	cast:function(val){ return parseFloat(val);},
	validate:function(val) { return !isNaN(parseFloat(val)); }
});


datatypes.push({
	name:"guid",
	cast:function(val) { return val; },
	validate:function(val) { var guidre = /^(guid\')?([\dabcdef]{8,8}-[\dabcdef]{4,4}-[\dabcdef]{4,4}-[\dabcdef]{4,4}-[\dabcdef]{12,12})(\')?$/i; return guidre.test(val); }
});

datatypes.push({
	name:"int16",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1; }
});

datatypes.push({
	name:"int32",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1; }
});

datatypes.push({
	name:"int64",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1; }
});

datatypes.push({
	name:"sbyte",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=-128 && val<=127; }
});

datatypes.push({
	name:"string",
	cast:function(val) { return val; },
	validate:function(val) { return typeof val === "string"; }
});

datatypes.push({
	name:"time",
	cast:function(val) { return val; },
	validate:function(val) { return true; }
});

datatypes.push({
	name:"datetimeoffset",
	cast:function(val) { return val; },
	validate:function(val) { return true; }
});


module.exports = { defaults:datatypes };

  
/*
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
*/