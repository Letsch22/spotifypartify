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

exports.sortPlaylists = function(longitude, latitude, callback)
{

    playlists.ensureIndex({loc: "2d"}, function(){
        playlists.find({loc : { $near : [ parseFloat(longitude), parseFloat(latitude) ]}}).toArray( function(err, array){
            if(err)
            {
                console.log('db.collection.find failed');
            }
            else
            {
                console.log(array);
                callback(array);
            }
        });
    });
    

}