# Heimdall

Heimdall is a type-safe, documentation oriented, and security minded HATEOS API library for Express.

The goal of Heimdall is to provide an easy way to create reflective and secure REST resources, to enforce documentation standards, to separate req/res from the MVC pattern, and to ensure all incoming and outgoing data is registered, validated, and documented.   

Heimdall uses a modified oDatav2[1] format for API responses, and EDM[2] for type-safety

Heimdall is available for use under the MIT License

## Example

Here is a simple example of a resource declaration:

	var controller = require('../controllers/todo')
	  , edm = require('heimdall').oData.Edm;
	
	 module.exports = {
	
		name: "todo",
	
		description:"A Todo list CRUD API",
	
		api: {
	
			ENTRY: {
				description:"Gets a specific To-Do Item",
				params:{
					id:edm.int64("The ID of the item entry to retrieve",true)
				},
				fields:{
					id:edm.int64("The ID of the item"),
					listid:edm.int32("The ID of the parent ToDo list"),
					description:edm.string("The textual description of the item"),
					donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
					createdate:edm.datetime("The date the item was entered into the system"),
					isdeleted:edm.boolean("True if the item has been removed from the list")
				},
				command:controller.Entry
			},
	
			COLLECTION: {
				description:"Gets a list of ToDo Items for a List",
				query:{
					listid:edm.int32("The ID of the parent ToDo list")
				}
				fields:{
					id:edm.int64("The ID of the item"),
					listid:edm.int32("The ID of the parent ToDo list"),
					description:edm.string("The textual description of the item"),
					donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
					createdate:edm.datetime("The date the item was entered into the system"),
					isdeleted:edm.boolean("True if the item has been removed from the list")
				},
				command:controller.Collection
			},
	
			ADD: {
				description:"Adds a new ToDo Item to a List",
				body:{
					listid:edm.int32("The ID of the parent ToDo list",true),
					description:edm.string("The textual description of the item",true),
					donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
					createdate:edm.datetime("The date the item was entered into the system")
				},
				fields:{
			        insertId: edm.int64("The automatically generated ID for the item"),
			        fieldCount: edm.int32("The number of fields in the record"),
			        affectedRows: edm.int32("The number of records effected by the addition")
				},
				command:controller.Add
			},
	
			SAVE: {
				description:"Saves a specific ToDo Item",
				params:{
					id:edm.int64("The ID of the item entry to retrieve",true)
				},
				body:{
					listid:edm.int32("The ID of the parent ToDo list"),
					description:edm.string("The textual description of the item"),
					donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
					createdate:edm.datetime("The date the item was entered into the system")
				},
				fields:{
			        fieldCount: edm.int32("The number of fields in the record"),
			        affectedRows: edm.int32("The number of records effected by the save")
				},
				command:controller.Save
			},
	
			REMOVE: {
				description:"Marks a specific ToDo Item as deleted",
				id:"The todo ID",
				fields:{
			        affectedRows: edm.int32("The number of records effected by the removal")
				},
				command:controller.Remove
			}
	
		}
	
	}

## Specification

For a Heimdall API specification to be loaded, the module.exports must have the following required properties: 
 - name - The resource name ("todo" will be used as :resource for the above specification)
 - description - The documentation description of the resource   
 - api - an object that contains the method details

### Methods

In the above example the methods are mapped as follows:
 - ENTRY is a GET for /:resource/:id
 - COLLECTION is a GET for /:resource/
 - ADD is a POST for /:resource/
 - SAVE is a PUT for /:resource/:id
 - REMOVE is a DELETE for /:resource/:id

Each method specification must have the following required properties
 - description - The documentation description of the resource method
 - command - A function that accepts one request data argument and one callback for the response data
 - fields - An object that lists the fields that will be returned by the response
 
Each method can also contain definitions for querystring, body and files request data:
 - query - The querystring parameters that will be used by the resource (req.query)
 - body - The form body data that will be used by the resource (req.body)
 - files - The multipart form data file attachments that will be used by the resource (req.files)

The ENTITY, SAVE, and REMOVE methods also require the "params" property, for definition of the resource id:

  params: {
	id: ... 
  }

## Method Command

The command property is typically a controller method, that will retrieve or alter data, and return a response.

When a request to a resource method is made, Heimdall checks the incoming query, body, and files data, and aggregates them into a single object.

If a value is sent to the request but is not declared in the resource's Heimdall API specification method, it is ignored.

For the above COLLECTION method example, consider the following request:

	/todo/?listid=505&random=abc123

The listid is a declared querystring parameter for the method.  That parameter value will be passed into the COLLECTION.command function as a listid property.  However, the "random" parameter is not declared, and will not be passed into the COLLECTION.command function.

Here is an example of the COLLECTION.command function:

	function(data,callback) {
		console.log(data.listid); //505
		console.log(data.random); //undefined
		model.GetTodos(data.listid,callback);
	}

 
## Types

Heimdall uses the oData EDM (entity data model) type system.  The available types are listed below. 

 - edm.NULL
 - edm.binary
 - edm.boolean
 - edm.byte
 - edm.datetime
 - edm.decimal
 - edm.double
 - edm.single
 - edm.guid
 - edm.int16
 - edm.int32
 - edm.int64
 - edm.sbyte
 - edm.string
 - edm.time
 - edm.datetimeoffset
 
	
## Setup

When starting the app, Heimdall is passed a path that contains the API specification files and Express app object:

	var api = process.cwd() + '/api/';
	var app = express();
	heimdall.load(api, app);

References
 - [1] The oData specification can be found at http://odata.org/
 - [2] EDM details can be found at http://www.odata.org/documentation/odata-v2-documentation/overview/#6_Primitive_Data_Types

###### *Made with love by Max Irwin (http://binarymax.com)*