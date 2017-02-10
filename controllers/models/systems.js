var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
SYSTEM Collection 
*system_id: TEXT
hostname: TEXT
lti_key: TEXT
lti_secret: TEXT
rest_key: TEXT
rest_secret: TEXT
*/

//systemSchema schema definition
var systemSchema = new Schema({
    system_id   : { type: String, required: true, unique: true },
    hostname    : { type: String, required: true, unique: true },
    created_at  : { type: Date, required: true, default: Date.now }
  });

// Sets the createdOn parameter equal to the current time
systemSchema.pre('save', function(next){
  now = new Date();
  //this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});



//Exports the systemsSchema for use elsewhere.
module.exports = mongoose.model('System', systemSchema);