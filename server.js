var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

users = [];
connections = [];

server.listen(process.env.PORT || 3000);

console.log('Server running @ port 3000.');

app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
	//Connect
	connections.push(socket);
	console.log('Connected: %s sockets connected.', connections.length);

	//Disconnect
	socket.on('disconnect', function(data) {
		users.splice(users.indexOf(socket.username), 1);
		updateUsernames();
		connections.splice(connections.indexOf(socket), 1);
		console.log('Disconnected: %s sockets connected.', connections.length);
	});

	//Send message
	socket.on('send message', function(data) {
		io.sockets.emit('new message', {msg: data});
	});

	//New user
	socket.on('new user', function(data, callback) {
		callback(true);
		socket.username = data;
		users.push(socket.username);
		updateUsernames();
	});

	//Get active users
	function updateUsernames() {
		io.sockets.emit('get users', users);
	}
});