var express = require('express');
var router = express.Router();
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');


var client_id = '3fb8c65f0e22480d8866f29dd00f3d18'; // Your client id
var client_secret = 'fab9f851e0e848d49104f683b585ffc0'; // Your client secret
var redirect_uri = 'http://localhost:3000/create'; // Your redirect uri

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId : client_id,
  clientSecret : client_secret,
  redirectUri : redirect_uri
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

/*
app.use(express.static(__dirname + '/public'))
   .use(cookieParser());
*/

/* GET home page. */
router.get('/', function(req, res, next) {
    
    res.render('index', { title: 'Express' });
});

router.get('/create', function(req, res, next) {  
    
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
  
  //If query doesn't contain code & state, ask for spotify api auth
  if(code === null && state === null){
    var state = generateRandomString(16);
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
    
            var access_token = body.access_token,
                refresh_token = body.refresh_token;
    
            var options = {
            url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
            };
            
            
            // use the access token to access the Spotify Web API
            request.get(options, function(error, response, body) {
                console.log(body);
                var user_id = body.id;
                res.render('create', { title: 'Create' , id: user_id, body: body, access_token: access_token, refresh_token: refresh_token});
            });

        }
        });
    }
  }
    
});

//Create post handling
router.post('/create', function(req, res){
    
    spotifyApi.setAccessToken(req.body.access_token);
    console.log(typeof(req.body.name));
    // Create new playlist
    spotifyApi.createPlaylist(req.body.id, req.body.name, {'public': true}, function(err, data) {
        if (err) {
            console.error('Something went wrong!');
        } else {
            console.log(data.body);
            res.send(data.body);
        }
    });
    
});

module.exports = router;
