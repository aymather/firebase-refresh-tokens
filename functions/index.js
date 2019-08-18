const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const db = require('./config/keys').mongoURI;
const User = require('./config/models');
const request = require('request');
const ouraConfig = require('./config/oura');
const rp = require('request-promise');

admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.refreshTokens = functions.pubsub
    .schedule('0 */10 * * *')
    .onRun(async context => {

        try {
            await mongoose.connect(db, { useNewUrlParser: true });

            var users = await User.find();
            for(let user of users){
                for(let client of user.clients){
                    if(client.oura_api.oura_refresh_token){
                        var options = {
                            uri: 'https://us-central1-rezvanihealthrefreshtokens.cloudfunctions.net/request',
                            method: 'POST',
                            body: {
                                refresh_token: client.oura_api.oura_refresh_token,
                                client_id: client._id,
                                user_id: user._id
                            },
                            json: true
                        }
                        rp(options).catch(e => console.log(e))
                    }
                }
            }
            return 'Value';
        } catch(e) {
            console.log('Something went wrong...')
            console.log(e);
        }
    return 'Value';
})

exports.request = functions.https
    .onRequest((req, res) => {

    // We need the refresh token, user_id and client_id
    // from the request
    const { refresh_token,
            user_id,
            client_id } = req.body;

    // Build request options
    var options = {
        method: 'POST',
        url: ouraConfig.accessTokenUri,
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        form: {
          grant_type: 'refresh_token',
          client_id: ouraConfig.clientId,
          client_secret: ouraConfig.clientSecret,
          refresh_token
        }
    };

    // Refresh client token
    request(options, async (error, response, body) => {
        if (error) throw new Error(error);

        await mongoose.connect(db, { useNewUrlParser: true });
        
        var user = await User.findById(user_id);
        var client = user.clients.id(client_id);

        const { access_token, refresh_token } = JSON.parse(body);
        
        client.oura_api.oura_access_token = access_token;
        client.oura_api.oura_refresh_token = refresh_token;
        console.log('Client info now');
        console.log(client.firstname);
        console.log(client.oura_api);
        user.save()
            .then(() => {
                res.json({ msg: 'Success!' })
                return 'Value';
            })
            .catch(e => console.log(e))
    });
    return 'Value';
});