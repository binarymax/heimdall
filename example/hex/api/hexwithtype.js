var heimdall  = require('../../../heimdall');
var datatypes = heimdall.datatypes;

module.exports = {
	name: "hex2",
	description: "An API resource for hex colors",
	api: {
		ENTRY:{
			description:"Converts a hexadecimal value to rgb, using the extended hexadecimal type",
			params:{
				"color":datatypes.hexadecimal("The Hexadecimal color")
			},
			fields:{
				"r":datatypes.byte("The red value"),
				"g":datatypes.byte("The green value"),
				"b":datatypes.byte("The blue value")
			},
			command: function(data,callback) {
				//data.color is guaranteed to be a 6 character long hex string 
				var r = parseInt(data.color.substr(0,2),16);
				var g = parseInt(data.color.substr(2,2),16);
				var b = parseInt(data.color.substr(4,2),16);
				callback(null,[{r:r,g:g,b:b}]);
			}
		}
	}
}
