var SpotifyWebApi = require('spotify-web-api-node');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;

var dbPort 		= 27017;
var dbHost 		= 'localhost';
var dbName 		= 'spotifypartify';

var client_id = '3fb8c65f0e22480d8866f29dd00f3d18'; // Your client id
var client_secret = 'fab9f851e0e848d49104f683b585ffc0'; // Your client secret
var redirect_uri = 'http://localhost:3000/create'; // Your redirect uri

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId : client_id,
  clientSecret : client_secret,
  redirectUri : redirect_uri
});

/* establish the database connection */
var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
	db.open(function(e, d){
	if (e) 
    {
		console.log(e);
	}	
    else
    {
		console.log('connected to database :: ' + dbName);
	}
});

// Creates a new collection 'playlists'
var playlists = db.collection('playlists');

exports.generateRandomString = function(length)
{
   /**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


exports.createPlaylist = function(id, name, access_token, refresh_token, code,  long, lat, pass, callback)
{
    spotifyApi.setAccessToken(access_token);
    // Create new playlist
    spotifyApi.createPlaylist(id, name, {'public': true}, function(err, data) {
        if (err) {
            console.error('Something went wrong!');
        } else {
            playlists.insert({id: id, name: name, loc: [parseFloat(long), parseFloat(lat)], password: pass, access_token: access_token, refresh_token: refresh_token, code: code,body: data}, function(){
                console.log('worked');
                callback(data.body);
            });
        }
    });
}

exports.getPlaylist = function(user_id, playlist_id, access_token, refresh_token, code, callback)
{


    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    spotifyApi.refreshAccessToken(function(err, data){
        playlists.update({"body.body.id": playlist_id},{$set: {"access_token": data.body.access_token}}, function(){
            console.log(data.body.access_token);
            spotifyApi.setAccessToken(data.body.access_token);
            console.log('---------');
            console.log(user_id);
            console.log(playlist_id);
            spotifyApi.getPlaylist(user_id, playlist_id)
            .then(function(data) {
                console.log('Some information about this playlist', data.body);
                callback(data.body);
            }, function(err) {
                console.log('Something went wrong!', err);
            });
        })
    });

    /*
    spotifyApi.setAccessToken(access_token);
    console.log('hi');
    spotifyApi.getUserPlaylists(user_id, function(err, data) {
        console.log(err);
        console.log(data);
        console.log('Some information about this playlist', data.body);
        callback(data.body);
    });
    */
    /*
    // First retrieve an access token
    spotifyApi.authorizationCodeGrant(code, function(err, data){
        console.log('adfasfdasdfasdfasdf');
        console.log(err);
        console.log(data);
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log('-------------hi');
        spotifyApi.getUserPlaylists(user_id, playlist_id, function(err, data) {
            console.log('Some information about this playlist', data.body);
            callback(data.body);
        });
    });
    */
    
}

exports.searchTracks = function(track_name, access_token, refresh_token, callback)
{
  spotifyApi.setAccessToken(access_token);
  spotifyApi.setRefreshToken(refresh_token);
  spotifyApi.searchTracks(track_name)
  .then(function(data) {
    console.log(data.body);
    callback(data.body);
  }, function(err) {
    console.error(err);
  });
}