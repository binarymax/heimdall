# Heimdall

Heimdall is a type-safe, documentation oriented, and security minded API library for Express.

The goal of Heimdall is to provide an easy way to create reflective and secure REST resources, to enforce documentation standards, to separate req/res from the MVC pattern, and to ensure all incoming and outgoing data is registered, validated, documented, and tested.   

Heimdall uses a modified oDatav2[1] format for API responses, and standard types for validation and data safety.

Heimdall is available for use under the MIT License

## Installation

```
npm install heimdall
```

It is assumed that your app already has Express installed.  Heimdall does not install Express for you.  If you are not familiar with Express, you can learn more at http://expressjs.com/


## Setup

When starting the app, Heimdall is passed at least two arguments: (1) a path that contains the API specification files and (2) the Express app object:

```js
var express = require('express')
  , heimdall= require('heimdall')
  , http = require('http')
  , app = express()
  , api = process.cwd() + '/api/';

/* ... configure express as usual ... */

heimdall.load(api, app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Heimdall server listening on port ' + app.get('port'));
});

```

The api path should have at least one API specification file.  An API specification file declares and documents a RESTful resource by including its available methods and all incoming and outgoing data for the resource.


## Specification

For a Heimdall API specification to be loaded, the module.exports must have the following required properties: 
 - name - The resource name (for example - name:"todo" will create the HTTP resource /todo)
 - description - The documentation description of the resource
 - api - an object that contains the method details

## Hello World Example

Consider a simple resource that accepts a request from the client at /helloworld, and returns ['Hello', 'World'].
  
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
Note the complete absence of the req and res objects in the above example.  These are abstracted away in favor of a single data object that contains all incoming req values.  The callback in the command function is expected to return any error(s) and an array of data for the response.  Heimdall takes care of sending the appropriate response back to the client based on the error and data specified in the callback.  This frees your application from the burden of maintaining these objects down through your callback or promise chain, and lets you focus on implementing a pure MVC pattern.

The COLLECTION method is one of the 5 accepted methods for resources, which will be covered in more detail later.

Using the above example, visiting http://example.com/helloworld returns the following JSON:

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

Consider a simple resource that accepts a hex color value, and returns its respective rgb value.  First we include the Heimdall datatypes, then layout the resource.
  
```js
var heimdall = require('heimdall');
var datatype = heimdall.datatypes;
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

Our hex resource also validates for us.  Visiting http://example.com/hex/foobar returns the following error JSON:

```js
{
  "error": {
    "code": "/hex/foobar",
    "message": "hex.entry",
    "innererror": "The supplied value 'foobar' is not a hexadecimal color."
  }
}
```

## Request/Response Flow

The complete flow of a satisfied client request to a Heimdall resource is this:

1. client sends request
2. node http receives request
3. express routes the request to heimdall
4. heimdall validates the request data (if validation fails, an error is created and steps 5 to 7 are not executed)
5. heimdall aggregates the request data
6. heimdall calls appropriate method command
7. command does its job and executes the heimdall callback
8. heimdall formats the outgoing response
9. heimdall sends response to client
10. client receives response

NOTE: Step 6 wraps the command in a _try...catch_ block.  If an exception is thrown by the command it is formatted and sent as an error response, and step 7 is aborted.


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
}
```

The specification above can be used by either a person or machine to consume the API.  Visiting http://example.com/api.html returns the API documentation in a friendly HTML format.


## Todo List Example

Here is a more complete example of a resource declaration for a todo list API:

```js
var controller = require('../controllers/todo')
  , datatypes = require('../../../heimdall').datatypes;

 module.exports = {

	name: "todo",

	description:"A Todo list CRUD API",

	api: {

		ENTRY: {
			description:"Gets a specific To-Do Item",
			params:{
				id:datatypes.int64("The ID of the item entry to retrieve",true)
			},
			fields:{
				id:datatypes.int64("The ID of the item"),
				description:datatypes.string("The textual description of the item"),
				donedate:datatypes.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:datatypes.datetime("The date the item was entered into the system"),
				isdeleted:datatypes.boolean("True if the item has been removed from the list")
			},
			command:controller.Entry
		},

		COLLECTION: {
			description:"Gets a list of Todo Items for a List",
			query:{
				isdone:datatypes.boolean("If true, only returns done items")
			},
			fields:{
				id:datatypes.int64("The ID of the item"),
				description:datatypes.string("The textual description of the item"),
				donedate:datatypes.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:datatypes.datetime("The date the item was entered into the system"),
				isdeleted:datatypes.boolean("True if the item has been removed from the list")
			},
			command:controller.Collection
		},

		ADD: {
			description:"Adds a new Todo Item to a List",
			body:{
				description:datatypes.string("The textual description of the item",true),
				donedate:datatypes.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:datatypes.datetime("The date the item was entered into the system")
			},
			fields:{
				id:datatypes.int64("The ID of the newly added item"),
				description:datatypes.string("The textual description of the item"),
				donedate:datatypes.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:datatypes.datetime("The date the item was entered into the system")
			},
			command:controller.Add
		},

		SAVE: {
			description:"Saves a specific Todo Item",
			params:{
				id:datatypes.int64("The ID of the item entry to save",true)
			},
			body:{
				description:datatypes.string("The textual description of the item"),
				donedate:datatypes.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:datatypes.datetime("The date the item was entered into the system")
			},
			fields:{
				id:datatypes.int64("The ID of the saved Todo item"),
				description:datatypes.string("The textual description of the item"),
				donedate:datatypes.datetime("The date/time when the item was marked as done, null otherwise"),
				createdate:datatypes.datetime("The date the item was entered into the system")
			},
			command:controller.Save
		},

		REMOVE: {
			description:"Marks a specific Todo Item as deleted",
			params:{
				id:datatypes.int64("The ID of the item entry to remove",true)
			},
			fields:{
		        affectedRows: datatypes.int32("The number of records effected by the removal")
			},
			command:controller.Remove
		}

	}

}
```

### Methods

In the above example the methods are mapped as follows:
 - ENTRY is a GET for /:resource/:id
 - COLLECTION is a GET for /:resource/
 - ADD is a POST for /:resource/
 - SAVE is a PUT for /:resource/:id
 - REMOVE is a DELETE for /:resource/:id

The method name must be UPPERCASE.

Each method specification must have the following required properties
 - description - The documentation description of the resource method
 - command - A function that accepts one request data argument and one callback for the response data
 - fields - An object that lists the fields that will be returned by the response
 
Each method can also contain definitions for querystring, body and files request data:
 - query - The querystring parameters that will be used by the resource (req.query)
 - body - The form body data that will be used by the resource (req.body)
 - files - The multipart form data file attachments that will be used by the resource (req.files)

The ENTRY, SAVE, and REMOVE methods also require the "params" property, for definition of the resource id:

  params: {
	id: ... 
  }

## Method Command

The command property is typically a controller method, that will retrieve or alter data, and return a response.

When a request to a resource method is made, Heimdall checks the incoming query, body, and files data, and aggregates them into a single object.

If a value is sent to the request but is not declared in the resource's Heimdall API specification method, it is ignored.

For the above Todo List COLLECTION method example, consider the following request:

	/todo/?isdone=1&random=abc123

The "isdone" property is a declared querystring parameter for the method.  That parameter value will be passed into the COLLECTION.command function as a property.  However, the "random" parameter is not declared, and will not be passed into the COLLECTION.command function.

Here is an example of the COLLECTION.command function:

	command:function(data,callback) {
		console.log(data.isdone); //true
		console.log(data.random); //undefined
		model.GetTodos(data.isdone,callback);
	}


## Security
 
We can also pass in a security functions as middleware into our heimdall load.  This will lock down all resource methods that do not declare open:true in the specification.  For example, if we want to secure all our resources to be accessible only to the local machine, we just do this:

```js
var authenticate = function(req,res,next) { 
	if(req.ips[0]==='127.0.0.1') {
		next();
	} else { 
		res.send(403);
	} 
};
heimdall.load(api,app,authenticate);
```

 
## Types

Heimdall uses commonly found datatypes as a type system.  The core types are listed below, and can be used in params, query, body, and fields declarations.

 - heimdall.datatypes.NULL
 - heimdall.datatypes.binary
 - heimdall.datatypes.boolean
 - heimdall.datatypes.byte
 - heimdall.datatypes.datetime
 - heimdall.datatypes.decimal
 - heimdall.datatypes.double
 - heimdall.datatypes.single
 - heimdall.datatypes.guid
 - heimdall.datatypes.int16
 - heimdall.datatypes.int32
 - heimdall.datatypes.int64
 - heimdall.datatypes.sbyte
 - heimdall.datatypes.string
 - heimdall.datatypes.time
 - heimdall.datatypes.datetimeoffset
 
## Custom Types

Heimdall also enables custom plugin datatypes.  A type can be declared by your application by calling the heimdall.type method.  Plugin types must be declared before the heimdall.load method is called.

The heimdall.type method accepts one object parameter that has the following properties:
 - name <string> - the name of the type.  This cannot be a duplicate, and an error will be thrown if the type already exists
 - validation <function> - this method is called before cast and must return a true or false.  If false, the API returns a validation error.  If true, the cast method is called before adding the value to the data object for the command.
 - cast <function> (optional) - as all data originates as a string from the params, querystring, or body, this method allows you to cast the string into a native javascript datatype.  If this method is not included, the value is passed as a string. 

Declaring a type and then reusing it throughout the API is a powerful way to abstract away common API data validation and casting, for values that need more control than is offered by the core datatypes.

For example, suppose you need a string identifier that is guaranteed to be 20 characters in length or less, and it is used throughout your API.  Rather than having to write validation in your controllers, consider declaring this custom type:

```js
heimdall.type({ 
	name:"string20", 
	validate:function(val){ return (val && val.length<=20)?true:false; }
});
```

Now, you can use this type in the params, query, or body declarations in API resources...

```js
	params:{
		"widgetid":datatypes.string20("The widget string identifier")
	},
```

Casting is also a great way to simplify tasks.  Building on our above hex resource, this is an example of a custom hexadecimal type, that uses the cast method to make for clearer controller code:

```js
heimdall.type({ 
	name:"hexadecimal", 
	validate:function(val){ return (/^([a-f0-9]{6})$/i).test(val)?true:false; },
	cast:function(val){ 
		return [
			parseInt(val.substr(0,2),16),
			parseInt(val.substr(2,2),16),
			parseInt(val.substr(4,2),16)
		]; 
	}
});
```

Now we can use the hexadecimal type in our API:

```js
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
				// data.color has been validated and cast as a datatypes.hexadecimal 
				// this command will not be called if the validation failed, therefore   
				// data.color is guaranteed to be an array of 3 integers
				callback(null,[{r:data.color[0],g:data.color[1],b:data.color[2]}]);
			}
		}
	}
}
```


## References
 - [1] The oData specification can be found at http://odata.org/ ...note that only the v2 json response format is utilized by Heimdall, and is otherwise unrelated.

###### *Made with love by Max Irwin (http://binarymax.com)*