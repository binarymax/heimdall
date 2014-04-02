var heimdall  = require('../../../heimdall');
var datatypes = heimdall.datatypes;

module.exports = {
	name: "hex",
	description: "An API resource for hex colors",
	api: {
		ENTRY:{
			description:"Converts a hexadecimal value to rgb",
			params:{
				"color":datatypes.string("The Hexadecimal color")
			},
			fields:{
				"r":datatypes.byte("The red value"),
				"g":datatypes.byte("The green value"),
				"b":datatypes.byte("The blue value")
			},
			command: function(data,callback) {
				console.log(data.color);
				var ok = /^([a-f0-9]{6})$/i;
				if(!ok.test(data.color)){
					//Error!
					callback("The supplied value is not a hexadecimal color.");
				} else {
					var r = parseInt(data.color.substr(0,2),16);
					var g = parseInt(data.color.substr(2,2),16);
					var b = parseInt(data.color.substr(4,2),16);
					callback(null,[{r:r,g:g,b:b}]);
				}
			}
		}
	}
}
