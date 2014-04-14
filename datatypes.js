var moment = require('moment');

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

//INTEGER NUMBER TYPES

datatypes.push({
	name:"byte",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=0 && val<256; }
});

datatypes.push({
	name:"sbyte",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=-128 && val<=127; }
});

datatypes.push({
	name:"int16",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=-32768 && val<=32767; }
});

datatypes.push({
	name:"uint16",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=0 && val<=65535; }
});

datatypes.push({
	name:"int",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=-2147483648 && val<=2147483647; }
});

datatypes.push({
	name:"int32",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=-2147483648 && val<=2147483647; }
});

datatypes.push({
	name:"uint32",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=0 && val<=4294967295; }
});

datatypes.push({
	name:"int64",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=-9223372036854775808 && val<=9223372036854775807; }
});

datatypes.push({
	name:"uint64",
	cast:function(val){ return parseInt(val);},
	validate:function(val) { var val = parseInt(val); return !isNaN(val) && val.toString().indexOf(".")===-1 && val>=0 && val<=18446744073709551615; }
});

// FLOATING POINT NUMBER TYPES

datatypes.push({
	name:"decimal",
	cast:function(val){ return parseFloat(val);},
	validate:function(val) { var val = parseFloat(val); return !isNaN(val) && val>=(10e-28) && val<=(7.9*10e28); }
});

datatypes.push({
	name:"double",
	cast:function(val){ return parseFloat(val);},
	validate:function(val) { var val = parseFloat(val); return !isNaN(val) && val>=(-1.79769313486232e308) && val<=(1.79769313486232e308); }
});

datatypes.push({
	name:"float",
	cast:function(val){ return parseFloat(val);},
	validate:function(val) { var val = parseFloat(val); return !isNaN(val) && val>=(-3.402823e38) && val<=(3.402823e38); }
});

datatypes.push({
	name:"single",
	cast:function(val){ return parseFloat(val);},
	validate:function(val) { var val = parseFloat(val); return !isNaN(val) && val>=(-3.402823e38) && val<=(3.402823e38); }
});

// STRING TYPES

datatypes.push({
	name:"string",
	cast:function(val) { return val; },
	validate:function(val) { return typeof val === "string"; }
});

datatypes.push({
	name:"guid",
	cast:function(val) { return val; },
	validate:function(val) { var guidre = /^(guid\')?([\dabcdef]{8,8}-[\dabcdef]{4,4}-[\dabcdef]{4,4}-[\dabcdef]{4,4}-[\dabcdef]{12,12})(\')?$/i; return guidre.test(val); }
});

// DATE+TIME TYPES

datatypes.push({
	name:"date",
	cast:function(val){ return moment(val) },
	validate:function(val) { return moment(val).isValid(); }
});

datatypes.push({
	name:"datetime",
	cast:function(val){ return moment(val) },
	validate:function(val) { return moment(val).isValid(); }
});

datatypes.push({
	name:"time",
	cast:function(val) { return val; },
	validate:function(val) { var timere = /^([\d]{1,2}):([\d]{2}):([\d]{2})(\.[\d]+)?$/; return timere.test(val); }
});

datatypes.push({
	name:"datetimeoffset",
	cast:function(val) { return moment(val); },
	validate:function(val) { return moment(val).isValid(); }
});


module.exports = { defaults:datatypes };