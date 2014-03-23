# Heimdall

Heimdall is a type-safe, documentation oriented, and security minded HATEOAS API library for Express.

The goal of Heimdall is to provide an easy way to create reflective and secure REST resources, to enforce documentation standards, to separate req/res from the MVC pattern, and to ensure all incoming and outgoing data is registered, validated, and documented.   

Heimdall uses a modified oDatav2[1] format for API responses, and EDM[2] for type-safety

Heimdall is available for use under the MIT License

## Installation

```
npm install heimdall
```

## Setup

When starting the app, Heimdall is passed a path that contains the API specification files and Express app object:

```js
var api = process.cwd() + '/api/';
var app = express();
heimdall.load(api, app);
```

The api path should have at least one file.  An API specification file declares and documents a RESTful resource by including its available methods and all incoming and outgoing data for the resource.


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

	/todo/?isdone=1&random=abc123

The "isdone" is a declared querystring parameter for the method.  That parameter value will be passed into the COLLECTION.command function as a property.  However, the "random" parameter is not declared, and will not be passed into the COLLECTION.command function.

Here is an example of the COLLECTION.command function:

	function(data,callback) {
		console.log(data.isdone); //true
		console.log(data.random); //undefined
		model.GetTodos(data.listid,callback);
	}


## Hello World Example

Consider a simple resource that accepts request, and returns 'Hello World'.  First we include the Heimdall EDM data types, then layout the resource.
  
```js
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
```

Visiting http://example.com/helloworld returns the following JSON:

```js
{
  "d": {
    "__count": 2,
    "results": [
      {
        "value": "Hello",
        "__metadata": {
          "uri": "//localhost:3000/helloworld",
          "type": "helloworld.collection"
        }
      },
      {
        "value": "World",
        "__metadata": {
          "uri": "//localhost:3000/helloworld",
          "type": "helloworld.collection"
        }
      }
    ]
  }
}
```

## Hex to RGB Example

Consider a simple resource that accepts a hex color value, and returns its respective rgb value.  First we include the Heimdall EDM data types, then layout the resource.
  
```js
var heimdall = require('heimdall');
var datatype = heimdall.oData.Edm;
module.exports = {
	name: "hex",
	description: "An API resource for hex colors",
	api: {
		ENTRY:{
			description:"Converts a hexadecimal value to rgb",
			params:{ "color":datatype.string("The Hexadecimal color",true) },
			command: function(data,callback) {
				var ok = /^[A-F|0-9]{6}$/i;
				if(!ok.test(data.color)){
					//Error!
					callback("The supplied value '"+data.color+"' is not a hexadecimal color.");
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
```

The above specification creates a resource that validates our color and returns RGB values.  Visiting http://example.com/hex/FF6600 returns the following JSON:

```js
{
	d:{
		results:[{
			__metadata:{
				uri:"/hex/FF6600",
				type:"hex.entry"
			},
			r:255,
			g:102,
			b:0
		}],
		__count:1
	}
}
```

Our hex resource also validates for us.  Visiting http://example.com/hex/foobar returns the following JSON:

```js
{
  "error": {
    "code": "/hex/foobar",
    "message": "hex.entry",
    "innererror": "The supplied value 'foobar' is not a hexadecimal color."
  }
}
```


## Self documenting

For the above hex example - not only did we create two working resources (hex and helloworld), but we also constructed everything we need to supply complete documentation to anyone who wants to consume our API.

Visting our documentation at http://example.com/api returns the following JSON:
```js
{
  "d": {
    "__count": 2,
    "results": [
      {
        "__metadata": {
          "uri": "/api/helloworld",
          "type": "api.resource"
        },
        "name": "helloworld",
        "description": "A Hello World API resource",
        "methods": [
          {
            "verb": "GET",
            "description": "Returns Hello World",
            "url": "/helloworld"
          }
        ]
      },
      {
        "__metadata": {
          "uri": "/api/hex",
          "type": "api.resource"
        },
        "name": "hex",
        "description": "An API resource for hex colors",
        "methods": [
          {
            "verb": "GET",
            "description": "Converts a hexadecimal value to rgb",
            "url": "/hex/:color",
            "params": [
              {
                "key": "color",
                "type": "string",
                "description": "The Hexadecimal color",
                "required": false
              }
            ]
          }
        ]
      }
    ]
  }
}```

The specification above can be used by either a person or machine to consume the API


## Todo List Example

Here is another example of a resource declaration for a todo list API:

```js
var controller = require('../controllers/todo')
  , edm = require('../../../heimdall').oData.Edm;

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
				description:edm.string("The textual description of the item"),
				donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:edm.datetime("The date the item was entered into the system"),
				isdeleted:edm.boolean("True if the item has been removed from the list")
			},
			command:controller.Entry
		},

		COLLECTION: {
			description:"Gets a list of Todo Items for a List",
			query:{
				isdone:edm.boolean("If true, only returns done items")
			},
			fields:{
				id:edm.int64("The ID of the item"),
				description:edm.string("The textual description of the item"),
				donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:edm.datetime("The date the item was entered into the system"),
				isdeleted:edm.boolean("True if the item has been removed from the list")
			},
			command:controller.Collection
		},

		ADD: {
			description:"Adds a new Todo Item to a List",
			body:{
				description:edm.string("The textual description of the item",true),
				donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:edm.datetime("The date the item was entered into the system")
			},
			fields:{
				id:edm.int64("The ID of the newly added item"),
				description:edm.string("The textual description of the item"),
				donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:edm.datetime("The date the item was entered into the system")
			},
			command:controller.Add
		},

		SAVE: {
			description:"Saves a specific Todo Item",
			params:{
				id:edm.int64("The ID of the item entry to save",true)
			},
			body:{
				description:edm.string("The textual description of the item"),
				donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:edm.datetime("The date the item was entered into the system")
			},
			fields:{
				id:edm.int64("The ID of the saved Todo item"),
				description:edm.string("The textual description of the item"),
				donedate:edm.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:edm.datetime("The date the item was entered into the system")
			},
			command:controller.Save
		},

		REMOVE: {
			description:"Marks a specific Todo Item as deleted",
			params:{
				id:edm.int64("The ID of the item entry to remove",true)
			},
			fields:{
		        affectedRows: edm.int32("The number of records effected by the removal")
			},
			command:controller.Remove
		}

	}

}
```

## Security
 
We can also pass in security functions as middleware into our heimdall load.  This will lock down all resource methods that do not declare open:true in the specification.  For example, if we want to secure all our resources to be accessible only to the local machine, we just do this:

```js
var authenticate = function(req,res) { if(req.headers.ip==='127.0.0.1') next(); else res.send(403); };
heimdall.load(api,app,authenticate);
```

A more complex example with a username/password session authentication will be available soon.
 
## Types

Heimdall uses the oData EDM (entity data model) type system.  The available types are listed below, and can be used in params, query, body, and fields declarations.

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
 

## References
 - [1] The oData specification can be found at http://odata.org/
 - [2] EDM details can be found at http://www.odata.org/documentation/odata-v2-documentation/overview/#6_Primitive_Data_Types

###### *Made with love by Max Irwin (http://binarymax.com)*