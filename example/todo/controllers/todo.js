var Todo = module.exports = {};

//----------------------------------------------------
//In Memory Model for demo
var itemid = 2;
var items = [
	{id:1,description:'Fix Rainbow Bridge',donedate:null,createdate:new Date,isdeleted:0},
	{id:2,description:'Sharpen Sword',donedate:null,createdate:new Date,isdeleted:0},
	{id:3,description:'Trim Beard',donedate:null,createdate:new Date,isdeleted:0}
];

//----------------------------------------------------
//Entry Controller, gets a Todo by ID
Todo.Entry = function(data,callback) {
	if (!data.id || !items[data.id]) {
		callback("The item could not be found");
	} else {
		callback(null,[items[data.id]]);
	}
};

//----------------------------------------------------
//Collection Controller, lists Todos
Todo.Collection = function(data,callback) {
	callback(null,items);
};

//----------------------------------------------------
//Add Controller, Adds a new Todo
Todo.Add = function(data,callback) {
	data.id = ++itemid;
	data.donedate = data.donedate||null;
	data.createdate = data.createdate||(new Date);
	data.isdeleted = 0;
	items[itemid] = data;
	callback(null,[items[data.id]]);
};

//----------------------------------------------------
//Save Controller, Saves a Todo
Todo.Save = function(data,callback) {
	if (!data.id || !items[data.id]) {
		callback("The item could not be found");
	} else {
		items[data.id] = data;
		callback(null,[items[data.id]]);
	}
};

//----------------------------------------------------
//Remove Controller, Removes a Todo
Todo.Remove = function(data,callback) {
	items[data.id].isdeleted = 1;
	callback(null,[items[data.id]]);
};