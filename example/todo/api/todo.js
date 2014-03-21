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
				createdate:edm.datetime("The date the item was entered into the system"),
				redirect:edm.string("Redirect to this URL after Add")
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
				createdate:edm.datetime("The date the item was entered into the system"),
				redirect:edm.string("Redirect to this URL after Save")				
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
