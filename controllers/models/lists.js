var mongoose = require('mongoose')
var Schema = mongoose.Schema

const uuidV1 = require('uuid/v1')

/*
LISTS Collection
    √list_uuid: TEST, Required, Unique
    √list_name: TEXT                                     #e.g. Mid-term Study Groups
    √list_description: TEXT                              #e.g. 5 groups available
    √list_visible_start: DATETIME                        #Determines visibility of list to students.
    √list_visible_end: DATETIME                          #Determines visibility of list to students.
    √list_state: TEXT/ENUM ['OPEN', 'CLOSED'], default: ‘OPEN’  #State determined by reg'd users
                                                               # - CLOSED when Group(s) size/waitlist quotas are met.
                                                               # - CLOSED when list_visible_end is met.
    student_view: BOOLEAN, default: false
    √group_list: ARRAY of Group:                          #There is always one group. 1…n
    √    grp_uuid: TEXT, Required, Unique                 #Group unique ID
    √    grp_name: TEXT                                   #e.g. Mid-term Study Group: MONDAY (optional)
    √    grp_description: TEXT                            #e.g. Meets Mondays (optional)
    √    grp_location: TEXT                               #Where it meets (optional)
    √    grp_start: DATETIME                              #meeting time for group (optional)
    √    grp_end: DATETIME                                #meeting time for group (optional)
    √    grp_waitlist_allowed: BOOLEAN default: false
    √    grp_max_size: INTEGER                            #maximum number of students in the group
    √    grp_max_waitlist: INTEGER                        #maximum number of students to be waitlisted
    √    grp_state: TEXT/ENUM ['OPEN', 'CLOSED'], default: ‘OPEN'    #State determined by reg'd users
                                                                    #  - CLOSED when Group size/waitlist quotas are met
        √user_list: ARRAY of User:
        √  user: TEXT (UUID)
        √  role: TEXT/ENUM: ['INSTRUCTOR', 'TEACHING_ASSISTANT', 'STUDENT'] default: 'STUDENT’
        √  created_on: DATETIME
        √  modified: DATETIME
        √  added_by: TEXT
        √  waitlisted: BOOLEAN

 */

/*
 * userList schema definition
*/
var userSchema = new Schema(
  {
    user_uuid: { type: String, required: true },
    role: {
      type: String,
      enum: ['INSTRUCTOR', 'TEACHING_ASSISTANT', 'STUDENT'],
      default: 'STUDENT'
    },
    added_by: String,
    waitlisted: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'created_on', updatedAt: 'modified' }
  }
)

/*
 * groupSchema schema definition
*/
var groupSchema = new Schema(
  {
    grp_uuid: { type: String, required: true },
    grp_name: { type: String, required: true },
    grp_description: String,
    grp_location: String,
    grp_start: { type: Date, required: true },
    grp_end: Date,
    grp_waitlist_allowed: { type: Boolean, default: false },
    grp_max_size: Number,
    grp_max_waitlist: Number,
    grp_state: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN'
    },
    userList: [userSchema]
  })

/*
 * list schema definition
 */
var listSchema = new Schema(
  {
    list_uuid: { type: String, required: true },
    list_name: { type: String, required: true },
    list_description: String,
    list_visible_start: { type: Date, required: true },
    list_visible_end: { type: Date, required: true },
    student_view: { type: Boolean, default: false },
    groupList: [groupSchema]
  },
  { timestamps: { createdAt: 'created_on', updatedAt: 'updated_on' }
  })

/*
 * creates a UUID on list save if one does not exist
 */
listSchema.pre('validate', function (next) {
  if (!this.uuid) {
    this.list_uuid = uuidV1()
  }
  next()
})

/*
 * creates a UUID on group save if one does not exist
 */
groupSchema.pre('validate', function (next) {
  if (!this.grp_uuid) {
    this.grp_uuid = uuidV1()
  }
  next()
})

/*
 * Exports the listSchema for use elsewhere.
 */
module.exports = mongoose.model('List', listSchema)
