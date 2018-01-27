const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

// make schema
// put data normalization as close to the model as possible
const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name',
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }

});

//Define our Indexs
storeSchema.index({
  name: 'text',
  description: 'text'
})

storeSchema.index({ location: '2dsphere' });



//TODO.. add some more validation.

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')){
    // if we haven't changed the name, already have a name and corresponding slug, no need to run this... move on to the save function
    return next();
  }
  this.slug = slug(this.name);
  //attach a slug generated from our name onto curr schemea, then save
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storeWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storeWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
})

storeSchema.statics.getTagsList = function(){
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id:'$tags', count: { $sum: 1} }},
    { $sort: { count: -1 }}
  ]);
}

module.exports = mongoose.model('Store', storeSchema)
