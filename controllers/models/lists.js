var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const uuidV1 = require('uuid/v1');

/*
LISTS Collection
uuid: TEST, Required, Unique
name: TEXT, Required
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

//userList schema definition 
var userSchema = new Schema (
    {
        user_uuid: String,
        role: { type: String,
            enum: ['INSTRUCTOR', 'TEACHING_ASSISTANT', 'STUDENT'],
            default: 'STUDENT'},
        added_by: String,
        waitlisted: { type: Boolean, default: false }
    },
    {
        timestamps: {createdAt : "created_on", updatedAt : "updated_on"}
    }
);

//listSchema schema definition
var listSchema = new Schema(
    {
        uuid: { type: String, required: true },
        name: { type: String, required: true },
        description: String,
        location: String,
        start: { type: Date, required: true },
        end: Date,
        waitlist_allowed: { type: Boolean, default: false },
        student_view: { type: Boolean, default: false },
        max_size: Number,
        max_waitlist: Number,
        state: {
            type: String,
            enum: ['OPEN', 'CLOSED'],
            default: 'OPEN'
        },
        group: String,
        userList: [userSchema]
    }
);

/*
 * pre Sets the createdOn parameter equal to the current time and 
 * sets uuid before saving
 */
// creates a UUID on list save if one does not exist
listSchema.pre('validate', function(next){
  if (!this.uuid) {
    this.uuid = uuid=uuidV1();
  }
  next();
});

//Exports the listSchema for use elsewhere.
module.exports = mongoose.model('List', listSchema);