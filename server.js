var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var messagesConstants= require(__dirname + '/server_files/ServerMessagesConstant.js');
var phrasesLibrary = require(__dirname + '/server_files/PhrasesLibrary.js');

var line_history = [];
var userNames = [];
var connections = [];
var loggedInPlayers = [];
var gameOn = false;
var timer = null;
var currentlyDrawingUSer = null;

var currentPhrase = '';
var messages = messagesConstants.ServerMessagesConstant;

server.listen(process.env.PORT || 3000);

console.log('Server running @ port 3000.');

app.use(express.static('public'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on(messages.CONNECTION, function(socket) {
	//Sends users array to all clients on connection
	socket.on(messages.GET_USERS, function() {
		socket.emit(messages.SEND_USERNAMES, {userlist: userNames});
	});

	//Connect
	connections.push(socket);
	console.log('Connected: %s sockets connected.', connections.length);

	//Disconnect
	socket.on(messages.DISCONNECT, function(data) {
		userNames.splice(userNames.indexOf(socket.username), 1);
		updateUsernames();
		connections.splice(connections.indexOf(socket), 1);

		if(loggedInPlayers.indexOf(socket) !== -1){
			loggedInPlayers.splice(loggedInPlayers.indexOf(socket), 1);			
		}
		console.log('Disconnected: %s sockets connected.', connections.length);

		if(loggedInPlayers.length < 2){
			stopGame();
		}
	});

	socket.on(messages.CHECK_LOGIN, function(data){
		if(loggedInPlayers.indexOf(socket) === -1){
			socket.emit(messages.NOT_LOGGED_IN);
		}
	});

	//Send message
	socket.on(messages.SEND_MESSAGE, function(data) {
		io.sockets.emit(messages.NEW_MESSAGE, {message: data.message, username: socket.username, phrase: currentPhrase});		
		if(data.message === currentPhrase){
			clearTimeout(timer);
			io.sockets.emit(messages.TURN_SUCCESS);
			currentPhrase = '';
			determineNextPlayerToDraw();
		}
	});

	//New user
	socket.on(messages.NEW_USER, function(data) {
		socket.username = data.userName;
		userNames.push(socket.username);
		loggedInPlayers.push(socket);
		updateUsernames();
		console.log(gameOn);
		if(!gameOn){
			console.log('START GAME');
			startGame();			
		}
	});

	//new line handler
	socket.on(messages.DRAW_LINE, function (data) {
    	line_history.push(data.line);
    	io.sockets.emit(messages.DRAW_LINE, { line: data.line });
   });

	//czyszczenie tablicy
	socket.on(messages.CLEAR_BOARD, function () {
		line_history = [];
    	io.sockets.emit(messages.CLEAR_BOARD);
   });


	socket.on(messages.DISMISS_TURN, function(){
		determineNextPlayerToDraw();
	});

	socket.on(messages.TURN_ACCEPTED, function(){
		console.log(loggedInPlayers.indexOf(socket));
		var acceptedSocketIndex = loggedInPlayers.indexOf(socket);

		currentPhrase = randomPhrase();
		io.sockets.emit(messages.TURN_START, {
			userName: loggedInPlayers[acceptedSocketIndex].username
		});

		console.log("PHRASE", currentPhrase);
		io.to(loggedInPlayers[acceptedSocketIndex].id).emit(messages.TURN_PHRASE, {phrase: currentPhrase});

		timer = setTimeout(function(){
			currentPhrase = '';
			clearTimeout(timer);
			io.sockets.emit(messages.TURN_FAILURE);
			determineNextPlayerToDraw();			
			console.log("SERVER FAILURE");
		}, 20000); //na razie ustawilam 20s do testowania, pozniej bedzie 60s
	})

	function determineNextPlayerToDraw(){
		if(gameOn){
			console.log('NEXT');
			if(currentlyDrawingUSer === null){
				index = 0
			}else{
				var previousIndex = loggedInPlayers.indexOf(currentlyDrawingUSer);
				console.log('PREVIOUS', previousIndex);
				var index = previousIndex + 1;

				if(connections[index] === undefined){
					index = 0;
				}				
			}

			console.log(loggedInPlayers.length, index);
			currentlyDrawingUSer = loggedInPlayers[index];
			var nextUserId = currentlyDrawingUSer.id;

			io.to(nextUserId).emit(messages.TURN_INIT);	
		}
	}

	//Get active users
	function updateUsernames() {
		io.sockets.emit(messages.SEND_USERNAMES, {userlist: userNames});
	}

	//send already drawn lines
	for (var i in line_history) {
    	socket.emit(messages.DRAW_LINE, { line: line_history[i] } );
	}

	//jesli jest więcej niz 1 użytkownik (na razie) gra sie rozpoczyna
	//rysuje pierwszy użytkownik z listy
	function startGame(){
		if(loggedInPlayers.length > 1){
			console.log('GAME ON');
			gameOn = true;

			io.sockets.emit(messages.GAME_START, {
				id : loggedInPlayers[0].id.substring(2), 
				userName: loggedInPlayers[0].username
			});		
		}
	}

	function stopGame(){
		currentPhrase = '';
		gameOn = false;
		io.sockets.emit(messages.GAME_STOP);
	}

	function randomPhrase(){
		var max = phrasesLibrary.phrases.length - 1;
		var randomIndex = Math.floor(Math.random()*(max+1));
		console.log(randomIndex);
		return phrasesLibrary.phrases[randomIndex];
	}
});