var mongoose = require('mongoose')
var Schema = mongoose.Schema

const uuidV1 = require('uuid/v1')

// logSchema schema definition
var logSchema = new Schema(
  {
    uuid: { type: String, required: true, unique: true },
    course_uuid: { type: String, required: true },
    logged_on: Date,
    action_by: { type: String, required: true },
    action_on: String,
    action: {
      type: String,
      enum: ['list_add', 'list_remove', 'waitlist_add', 'waitlist_remove', 'list_created', 'list_removed']
    },
    comment: String
  },
  // `created_on` & `updated_on` will be included on saves and updates
  {
    timestamps: {
      createdAt: 'logged_on'
    }
  }
)

/*
 * pre Sets the createdOn parameter equal to the current time and
 * sets uuid before saving
 */
logSchema.pre('save', function (next) {
  var now = new Date()
  if (!this.logged_on) {
    this.logged_on = now
  }
  if (!this.uuid) {
    this.uuid = uuidV1()
  }
  next()
})

// Exports the courseSchema for use elsewhere.
module.exports = mongoose.model('Log', logSchema)
