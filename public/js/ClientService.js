var ClientService = function (socket) {
	var socket = socket;

	this.emit = function(event, data){
		socket.emit(event, data);
	}

	return this;
}