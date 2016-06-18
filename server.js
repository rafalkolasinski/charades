/* SERVER CONFIGURATION
------------------------------------------------------------*/

/**
* Basic server config
*/
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

/**
* Getting server files
*/
var messagesConstants= require(__dirname + '/server_files/ServerMessagesConstant.js');
var phrasesLibrary = require(__dirname + '/server_files/PhrasesLibrary.js');

//Vars
var line_history = [];
var userNames = [];
var connections = [];
var loggedInPlayers = [];
var gameOn = false;
var timer = null;
var currentlyDrawingUser = null;

var currentPhrase = '';
var messages = messagesConstants.ServerMessagesConstant;

//Starting server listening
server.listen(process.env.PORT || 3000);

//Getting public folder files
app.use(express.static('public'));

//Getting index file
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

/**
* Listening for server connection event
*/
io.sockets.on(messages.CONNECTION, function(socket) {
	//Sends users array to all clients on connection
	socket.on(messages.GET_USERS, function() {
		socket.emit(messages.SEND_USERNAMES, {userlist: userNames});
	});

	//Adding connection to connections array
	connections.push(socket);

	/**
	* Listening for server disconnections event
	*/
	socket.on(messages.DISCONNECT, function(data) {
		userNames.splice(userNames.indexOf(socket.username), 1);
		updateUsernames();
		connections.splice(connections.indexOf(socket), 1);

		if(loggedInPlayers.indexOf(socket) !== -1){
			loggedInPlayers.splice(loggedInPlayers.indexOf(socket), 1);			
		}

		if(loggedInPlayers.length < 2){
			stopGame();
		}
	});

	/**
	* Listening for checking user's login event
	*/
	socket.on(messages.CHECK_LOGIN, function(data){
		if(loggedInPlayers.indexOf(socket) === -1){
			socket.emit(messages.NOT_LOGGED_IN);
		}
	});

	/**
	* Listening for sending chat message event
	*/
	socket.on(messages.SEND_MESSAGE, function(data) {
		io.sockets.emit(messages.NEW_MESSAGE, {message: data.message, username: socket.username, phrase: currentPhrase});		
		if(data.message.toLowerCase() === currentPhrase){
			clearTimeout(timer);
			io.sockets.emit(messages.TURN_SUCCESS);
			currentPhrase = '';
			determineNextPlayerToDraw();
		}
	});

	/**
	* Listening for new user logging in event
	*/
	socket.on(messages.NEW_USER, function(data) {
		socket.username = data.userName;
		userNames.push(socket.username);
		loggedInPlayers.push(socket);
		updateUsernames();
		if(!gameOn){
			startGame();			
		}
	});

	/**
	* Listening for drawing a new line on canvas event
	*/
	socket.on(messages.DRAW_LINE, function (data) {
    	line_history.push(data.line);
    	io.sockets.emit(messages.DRAW_LINE, { line: data.line });
   });

	/**
	* Listening for clearing the board event
	*/
	socket.on(messages.CLEAR_BOARD, function () {
		line_history = [];
    	io.sockets.emit(messages.CLEAR_BOARD);
   });

	/**
	* Listening for ndismissing the turn event
	*/
	socket.on(messages.DISMISS_TURN, function(){
		determineNextPlayerToDraw();
	});

	/**
	* Listening for accepting the turn event
	*/
	socket.on(messages.TURN_ACCEPTED, function(){
		var acceptedSocketIndex = loggedInPlayers.indexOf(socket);

		currentPhrase = randomPhrase();
		io.sockets.emit(messages.TURN_START, {
			userName: loggedInPlayers[acceptedSocketIndex].username
		});

		io.to(loggedInPlayers[acceptedSocketIndex].id).emit(messages.TURN_PHRASE, {phrase: currentPhrase});

		timer = setTimeout(function(){
			currentPhrase = '';
			clearTimeout(timer);
			io.sockets.emit(messages.TURN_FAILURE);
			determineNextPlayerToDraw();			
		}, 20000); //na razie ustawilam 20s do testowania, pozniej bedzie 60s
	})

	/**
	* Handling next player selection
	*/
	function determineNextPlayerToDraw(){
		if(gameOn){
			if(currentlyDrawingUser === null){
				index = 0
			}else{
				var previousIndex = loggedInPlayers.indexOf(currentlyDrawingUser);
				var index = previousIndex + 1;

				if(connections[index] === undefined){
					index = 0;
				}				
			}
			currentlyDrawingUser = loggedInPlayers[index];
			io.to(currentlyDrawingUser.id).emit(messages.TURN_INIT);	
		}
	}

	/**
	* Sending an event of updating usernames array
	*/
	function updateUsernames() {
		io.sockets.emit(messages.SEND_USERNAMES, {userlist: userNames});
	}

	/**
	* Sending an event of updating canvas lines
	*/
	for (var i in line_history) {
    	socket.emit(messages.DRAW_LINE, { line: line_history[i] } );
	}

	/**
	* Starting the game if number of logged in users > 1
	*/
	function startGame(){
		if(loggedInPlayers.length > 1){
			gameOn = true;
			io.sockets.emit(messages.GAME_START);
			determineNextPlayerToDraw();
		}
	}

	/**
	* Sending an event of stopping the game
	*/
	function stopGame(){
		currentPhrase = '';
		gameOn = false;
		io.sockets.emit(messages.GAME_STOP);
	}

	/**
	* Choosing a phrase to guess
	*/
	function randomPhrase(){
		var max = phrasesLibrary.phrases.length - 1;
		var randomIndex = Math.floor(Math.random()*(max+1));
		return phrasesLibrary.phrases[randomIndex];
	}
});