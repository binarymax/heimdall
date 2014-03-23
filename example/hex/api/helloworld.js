module.exports = {
	name: "helloworld",
	description: "A Hello World API resource",
	api: {
		COLLECTION:{
			description:"Returns Hello World",
			command: function(data,callback) {
				callback(null,[{value:"Hello"},{value:"World"}]);
			}
		}
	}
}
