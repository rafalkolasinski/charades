var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


var line_history = [];
var userNames = [];
var connections = [];
var loggedInPlayers = [];
var gameOn = false;

server.listen(process.env.PORT || 3000);

console.log('Server running @ port 3000.');

app.use(express.static('public'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
	//Connect
	connections.push(socket);
	console.log('Connected: %s sockets connected.', connections.length);

	//Disconnect
	socket.on('disconnect', function(data) {
		userNames.splice(userNames.indexOf(socket.username), 1);
		updateUsernames();
		connections.splice(connections.indexOf(socket), 1);
		if(loggedInPlayers.indexOf(socket) !== -1){
			loggedInPlayers.splice(loggedInPlayers.indexOf(socket), 1);			
		}
		console.log('Disconnected: %s sockets connected.', connections.length);

		if(loggedInPlayers.length < 1){
			stopGame();
		}
	});

	socket.on('check_login', function(data){
		if(loggedInPlayers.indexOf(socket) === -1){
			socket.emit('not_logged_in');
		}
	});

	//Send message
	socket.on('send_message', function(data) {
		io.sockets.emit('new_message', {msg: data, user: socket.username});
	});

	//New user
	socket.on('new_user', function(data, callback) {
		callback(true);
		socket.username = data.userName;
		userNames.push(socket.username);
		loggedInPlayers.push(socket);
		updateUsernames();
		if(!gameOn){
			console.log("START GAME");
			startGame();			
		}
	});

	//new line handler
	socket.on('draw_line', function (data) {
    	line_history.push(data.line);
    	io.sockets.emit('draw_line', { line: data.line });
   });

	//czyszczenie tablicy
	socket.on('clear_board', function () {
		line_history = [];
    	io.sockets.emit('clear_board');
   });

	//tura jest zakończona - albo skonczl sie czas, albo ktoś zgadł
	socket.on('turn_finished', function(){
		determineNextPlayerToDraw(socket);
	});

	socket.on('dismiss_turn', function(){
		determineNextPlayerToDraw(socket);
	});

	function determineNextPlayerToDraw(socket){
		if(gameOn){
			console.log("NEXT");
			var previousIndex = loggedInPlayers.indexOf(socket);
			var index = previousIndex + 1;

			if(connections[index] === undefined){
				index = 0;
			}
			var nextUserId = loggedInPlayers[index].id;

			io.to(nextUserId).emit('your_turn');
			io.sockets.emit('start_turn', {userName: loggedInPlayers[index].username});			
		}
	}

	//Get active users
	function updateUsernames() {
		io.sockets.emit('get_users', userNames);
	}

	//send already drawn lines
	for (var i in line_history) {
    	socket.emit('draw_line', { line: line_history[i] } );
	}

	//jesli jest więcej niz 1 użytkownik (na razie) gra sie rozpoczyna
	//rysuje pierwszy użytkownik z listy
	function startGame(){
		if(loggedInPlayers.length > 1){
			console.log("GAME ON");
			gameOn = true;

			io.sockets.emit('start_game', {id : loggedInPlayers[0].id.substring(2), userName: loggedInPlayers[0].username});		
		}
	}

	function stopGame(){
		gameOn = false;
		io.sockets.emit('stop_game');
	}
});