var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
LISTS Collection
name: TEXT
description: TEXT
location: TEXT
start: DATETIME
end: DATETIME
waitlist_allowed: BOOLEAN
max_size: INTEGER
max_waitlist: INTEGER
state: TEXT/ENUM
group: TEXT
userlist: ARRAY
     user: TEXT (UUID)
     role: TEXT/ENUM
     created: DATETIME
     modified: DATETIME
     added_by: TEXT
     waitlisted: BOOLEAN
 */


//listSchema schema definition
var listSchema = new Schema({
    name: String,
    description: String,
    location: String,
    start: Date,
    end: Date,
    waitlist_allowed: Boolean,
    max_size: Number,
    max_waitlist: Number,
    state: {
        type: String,
        enum: ['NEW', 'STATUS'],
        default: 'NEW'
    },
    group: String,
    userlist: [{
        user_uuid: String,
        role: { type: String,
                enum: ['INSTRUCTOR', 'TEACHING_ASSISTANT', 'STUDENT'],
                default: 'STUDENT'
        },
        added_by: String,
        waitlisted: Boolean,
        created_on: Date,
        updated_on: Date },
        { timestamps: { 
        createdAt: 'created_on', 
        updatedAt: 'updated_on'
      } 
    } 
);

//Exports the listSchema for use elsewhere.
module.exports = mongoose.model('List', listSchema);