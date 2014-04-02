var controller = require('../controllers/todo')
  , datatypes  = require('../../../heimdall').datatypes;

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
				createdate:datatypes.datetime("The date the item was entered into the system"),
				redirect:datatypes.string("Redirect to this URL after Add")
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
				createdate:datatypes.datetime("The date the item was entered into the system"),
				redirect:datatypes.string("Redirect to this URL after Save")				
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
