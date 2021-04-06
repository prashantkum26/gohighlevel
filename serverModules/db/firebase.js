var admin = require("firebase-admin");
var serviceAccount = require("./../../admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gohighleveldb-default-rtdb.firebaseio.com"
});

var db = admin.firestore();

exports.getCollection = function (collection) {
  const appointmentRef = db.collection(collection);
  return appointmentRef;
}