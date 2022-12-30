const mongoose=require("mongoose");
mongoose.Promise=global.Promise;
mongoose.connect(
  "mongodb://localhost:27017/mizuban",
  {useNewUrlParser:true}
);

const childSchema = new mongoose.Schema({
  firstName: String,
  lastName: String
});

const parentSchema = new mongoose.Schema({
  // Array of subdocuments
  children: [childSchema],

  // Single subdocument
  child: childSchema
});

const orderSchema = new mongoose.Schema({
  ref: String,
  lineItems: [
    new mongoose.Schema({
      name: String,
      price: Number,
      qty: Number,
      total: Number
    })
  ]
})

const Order = mongoose.model('Order', orderSchema, 'orders')

// Order.create({
//   ref: 'QR34',
//   lineItems: [
//     {
//       name: 'T-shirt',
//       price: 6,
//       qty: 2,
//       total: 12
//     },
//     {
//       name: 'Jeans',
//       price: 15,
//       qty: 1,
//       total: 15
//     }
//   ]
// })
  // .then(order1=>console.log(order1))
  // .catch(error=>console.log(error.message));
let order1;
Order.findOne({}).then(result => {
  order1=result;
  console.log(order1.lineItems.id('62cd2155a9d17c47ee612ef7'));
});
const doc = Order.lineItems;
console.log(doc);