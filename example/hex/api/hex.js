var heimdall = require('../../../heimdall');
var datatype = heimdall.oData.Edm;

module.exports = {
	name: "hex",
	description: "An API resource for hex colors",
	api: {
		ENTRY:{
			description:"Converts a hexadecimal value to rgb",
			params:{
				"color":datatype.string("The Hexadecimal color")
			},
			fields:{
				"r":datatype.byte("The red value"),
				"g":datatype.byte("The green value"),
				"b":datatype.byte("The blue value")
			},
			command: function(data,callback) {
				var ok = /^[A-F|0-9]{6}$/i;
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
