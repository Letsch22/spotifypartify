var express = require('express');
var router = express.Router();
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var spotify = require('../modules/spotify'); //Spotify module
var playlists = require('../modules/playlists'); //Spotify module

var client_id = '3fb8c65f0e22480d8866f29dd00f3d18'; // Your client id
var client_secret = 'fab9f851e0e848d49104f683b585ffc0'; // Your client secret
var redirect_uri = 'http://localhost:3000/create'; // Your redirect uri



/* GET home page. */
router.get('/', function(req, res, next) {
    
    res.render('index', { title: 'Express' });
});

router.get('/create', function(req, res, next) {  
    
  // your application requests refresh and access tokens
  // after checking the state parameter
  var stateKey = 'spotify_auth_state';
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
  
  //If query doesn't contain code & state, ask for spotify api auth
  if(code === null && state === null){
    var state = spotify.generateRandomString(16);
    res.cookie(stateKey, state);
    
    // your application requests authorization
    var scope = 'playlist-modify-public';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    }));
  }//If query contains code & state, save auth credentials
  else{
      if (state === null || state !== storedState) {
        res.redirect('/#' +
        querystring.stringify({
            error: 'state_mismatch'
        }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
        };
    
        request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log('auth response: ' + response);
            var access_token = body.access_token,
                refresh_token = body.refresh_token;
    
            var options = {
            url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
            };
            
            
            // use the access token to access the Spotify Web API
            request.get(options, function(error, response, body) {
                var user_id = body.id;
                res.render('create', { title: 'Create' , id: user_id, body: body, access_token: access_token, refresh_token: refresh_token, code: code});
            });

        }
        });
    }
  }
    
});

//GET Playlist 
router.get('/playlist', function(req, res, next) { 
    var playlistID = req.query.id;
    res.render('playlist', { title: 'Playlist' , id: playlistID});
    /*
    playlists.getPlaylistById(playlistID, function(playlist){
        console.log(playlist[0]);
        spotify.getPlaylist(playlist[0].id, playlist[0].body.body.id, playlist[0].access_token, playlist[0].refresh_token, playlist[0].code, function(data){
            console.log('Some information about this playlist', data.body);
            res.render('playlist', { title: 'Playlist - ' + playlist[0].name , id: playlistID});
        });
    })
    */
});

//POST Playlist 
router.post('/playlist', function(req, res) { 
    var playlistID = req.body.playlist_id; 
        playlists.getPlaylistById(playlistID, function(playlist){
            if(req.body.key == 'getTracks') {
                spotify.getPlaylist(playlist[0].id, playlist[0].body.body.id, playlist[0].access_token, playlist[0].refresh_token, playlist[0].code, function(data){
                    console.log('---------');
                    console.log(data);
                    console.log('---------');
                    res.send(data);
                });
            }
            else {
                spotify.searchTracks(req.body.track_name, playlist[0].access_token, playlist[0].refresh_token, function(data){
                    console.log(data);
                    res.send(data);
                });
            }
        })
});

//Create post handling
router.post('/create', function(req, res){
    
    spotify.createPlaylist(req.body.id, req.body.name, req.body.access_token, req.body.refresh_token, req.body.code, req.body.long, req.body.lat, req.body.pass, function(data){
        console.log(data.body);
        res.send(data.body);
    });
    
});

router.post('/', function(req, res){
  playlists.sortPlaylists(req.body.long, req.body.lat, function(array){
    res.send(array);
  })
});

module.exports = router;
