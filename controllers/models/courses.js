var mongoose = require('mongoose')
var Schema = mongoose.Schema
require('./lists')

// courseSchema schema definition
var courseSchema = new Schema(
  {
    uuid: { type: String, required: true, unique: true },
    externalId: { type: String },
    lists: [{ type: Schema.Types.ObjectId, ref: 'List' }],
    ultrafied: { type: Boolean, required: true }
  },
  // `created_on` & `updated_on` will be included on saves and updates
  {
    timestamps: {
      createdAt: 'created_on',
      updatedAt: 'updated_on'
    }
  }
)

// Exports the courseSchema for use elsewhere.
module.exports = mongoose.model('Course', courseSchema)
