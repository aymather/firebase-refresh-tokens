const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    console.log('Hello world');
    console.log(request);
 response.send("Hello from Firebase!");
});
exports.refreshTokens = functions.pubsub.schedule('1 * * * *').onRun(context => {
    console.log('Hello World!');
    console.log(context);
})