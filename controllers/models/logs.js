var mongoose = require('mongoose');
var Schema = mongoose.Schema;

LOGS Collection
uuid: TEXT, Required, Unique
course_uuid: TEXT, Required
logged_on: DATE
action_by: TEXT <= user_uuid (instructor etc)
action_on: TEXT <= user_uuid (student etc)
action: enum - list_add, list_remove, waitlist_add waitlist_remove
comment: TEXT

//logSchema schema definition
var logSchema = new Schema(
    {
        uuid: { type: String, required: true, unique: true },
        course_uuid: { type: String, required: true },
        logged_on: Date,
        action_by: { type: String, required: true },
        action_on: String,
        action: {
            type: String,
            enum: ['list_add', 'list_remove', 'waitlist_add', 'waitlist_remove', 'list_created', 'list_removed'],
        },
        comment: String
    },
    // `created_on` & `updated_on` will be included on saves and updates
    { timestamps: { 
        createdAt: 'logged_on'
      } 
    } 
);

//Exports the courseSchema for use elsewhere.
module.exports = mongoose.model('Log', logSchema);