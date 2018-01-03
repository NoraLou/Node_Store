const mongoose = require('mongoose');
const Store = mongoose.model('Store');
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

exports.createStore = async (req, res) => {
  console.log(req.body)
  const store = await (new Store(req.body)).save();
  //console.log("trying to save :", req.body)
  // console.log("it worked")
  req.flash('success', `Successfully Created ${store.name} Care to Leave a Review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await (Store.find());
  res.render('stores', { title: 'Stores', stores });
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({slug: req.params.storeSlug})
  if (!store) {
    next();
    return;
  }
  res.render('store', {title:`${store.name}`, store});
}


exports.editStore = async(req, res) => {
  const store = await Store.findOne({ _id: req.params.id});
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
  const tags = await Store.getTagsList()
  const tag = req.params.tag
  res.render('tags', { tags, tag, title: 'Tags'});

}
