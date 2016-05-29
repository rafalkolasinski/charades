var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


var line_history = [];
var userNames = [];
var connections = [];

var $drawingUser = $('#drawing-user');

server.listen(process.env.PORT || 3000);

console.log('Server running @ port 3000.');

app.use(express.static('public');

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
		console.log('Disconnected: %s sockets connected.', connections.length);
	});

	//Send message
	socket.on('send_message', function(data) {
		io.sockets.emit('new_message', {msg: data, user: socket.username});
	});

	//New user
	socket.on('new_user', function(data, callback) {
		callback(true);
		socket.username = data;
		userNames.push(socket.username);
		updateUsernames();
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

	socket.on('change_drawing_user', function(data) {
		$drawingUsername.html(data.username);
	})

	function determineNextPlayerToDraw(socket){
		console.log("NEXT");
		var previousIndex = connections.indexOf(socket);
		var index = previousIndex + 1;

		if(connections[index] === undefined){
			index = 0;
		}
		//następna osoba zostaje wyznaczona do rysowania
		io.sockets.emit('your_turn', {id : connections[index].id.substring(2), user: socket.username});
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
	if(connections.length > 1){
		io.sockets.emit('your_turn', {id : connections[0].id.substring(2)});		
	}

});