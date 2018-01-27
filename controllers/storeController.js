const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
//multer middleware lets us upload multi-part data, images etc
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  //use memory not disc space
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/')
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That fileype isn\'t allowed!'}, false);
    }
  }
}

// exports.homePage = (req, res) => {
//   res.render('index')
// };

exports.addStore = (req, res) => {
  //res.send('it works')
  res.render('editStore', {title: 'Add Store'})

};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async(req, res, next) => {
  //checkif there is a file on this req
  if(!req.file){
    next()
    return;
  }
  const extension = req.file.mimetype.split('/')[1]
  //unique id no conflicting names
  req.body.photo = `${uuid.v4()}.${extension}`

  //resize now.. using jimp a promise based library.. calls alread async ...so we need to await
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  //once we have written the photo to our filesystem go on!
  next();
}

// exports.createStore = async (req, res) => {
//   req.body.author = req.user._id;
//   console.log('req.body.author :', req.body.author)
//   const store = await (new Store(req.body)).save();
//   //console.log("trying to save :", req.body)
//   // console.log("it worked")
//   req.flash('success', `Successfully Created ${store.name} Care to Leave a Review?`);
//   res.redirect(`/store/${store.slug}`);
// };

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  //TO DO : this is running asynchrosouly... before store is saved and gives a 404 error...
  // req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`))
  // res.redirect(`/store/${store.slug}`)
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
  res.redirect(`/stores`)

};


exports.getStores = async (req, res) => {
  const stores = await (Store.find());
  res.render('stores', { title: 'Stores', stores });
}


exports.getStoreBySlug = async (req, res, next) => {
  //Note the populate method... populates with data from cross association with author id
  const store = await Store.findOne({slug: req.params.storeSlug})
    .populate('author')
  if (!store) {
    next();
    return;
  }
  res.render('store', {title:`${store.name}`, store});
}

const confirmOwner = (store, user) => {
  //Note the .equals() meth - necessary to make a comparision btwn mongo ObjectId and user_id
  if ( !store.author.equals(user._id)){
    throw Error ('you must own a store in order to edit it')
  }
}

exports.editStore = async(req, res) => {
  const store = await Store.findOne({ _id: req.params.id});
  confirmOwner(store, req.user)
  res.render('editStore', { title: `Edit ${store.name}`, store });
}

exports.updateStore = async(req, res) => {
  //set the location data to be a point so it is not overridevn on auto update
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate( {_id: req.params.id}, req.body,
    {
     new: true,//return new store instead of the old one
     runValidators: true,
    }
  ).exec()
  req.flash('success', `Successfully updated ${store.name} <a href=/stores/${store.slug}>Go To Store</a>`)
  res.redirect(`/stores/${store._id}/edit`);
  //redirect them to the store and tell them it worked
}

exports.getStoresByTag = async(req, res) => {
  const tag = req.params.tag
  // the second param here... if there is no specified tag.. just return any store that has a tag prop on it
  const tagQuery = tag || { $exists: true };
  // const tags = await Store.getTagsList()
  // note: in making muliptly calls effeciently - we want to keep async
  // * i.e. need to remove await method & store using promise object
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  // wait until we get our object back to assign to var and template
  const [ tags, stores ] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tags', { tags, tag, stores, title: 'Tags'});

}


exports.searchStores = async (req, res) => {
  // test/view query params from url
  //res.json(req.query);
  // bc have indexed name and description of our store via text... search mongo db with the $text operator
  const stores = await Store.find({
    //search text for the query
    $text: {
      $search: req.query.q,
    }
    //add a score field based on the occurance of the query word
  }, {
    score: { $meta: 'textScore' }
    // sort data by frequency of occurance of query
  }).sort({
    score: { $meta: 'textScore'}
  })
  res.json(stores)

}

exports.mapStores = async (req, res) => {

  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000
      }
    }
  }
  //Use .select() to select specific info keep overhead low
  const stores = await Store.find(q).select('slug name description location').limit(10)
  res.json(stores);

}

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map'});
}

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
  .findByIdAndUpdate(req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render('stores', { title: 'Hearted Stores', stores });
};
