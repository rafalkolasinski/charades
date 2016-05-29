//Initializing material design for Bootstrap 3.x.x
$.material.init();

$(document).ready(function() {

	var mouse = { 
    	click: false,
    	move: false,
    	pos: {x:0, y:0},
    	pos_prev: false
	};

	var $canvas  = $('#canvas')[0];
	var context = canvas.getContext('2d');
	var width   = window.innerWidth / 2
	var height  = window.innerHeight / 1.5;
	var canDraw = false;
	var turnSuccess = false; 
	var currentlyDrawing = '';
	var html = '';

	var socket = io.connect();
	var $messageForm = $('#message-form');
	var $message = $('#message');
	var $sendMessageButton = $('#send-message-button');
	var $chat = $('#chat');
	var $pageWrapper = $('#page-wrapper');
	var $userForm = $('#userForm');
	var $userLoginArea = $('#user-login-area');
	var $users = $('#users');
	var $username = $('#username');
	var $turnModal = $('#turn-modal');
	var $drawingTimer = $("#drawing-timer");
	var $drawingUser = $("#drawing-user");

	document.clearBoard = clearBoard;
	document.startTurn = startTurn;
	document.dismissTurn = dismissTurn;

	$turnModal.hide();

	$canvas.width = width;
	$canvas.height = height;

	/**
	* Handling mouse movement
	*/
	$canvas.onmousedown = function(e){
		if(canDraw){
		mouse.click = true;   					
		}
	};
	$canvas.onmouseup = function(e){
		if(canDraw){
			mouse.click = false;					
		}
	};

	$canvas.onmousemove = function(e) {
		if(canDraw){
			mouse.pos.x = e.offsetX;
			mouse.pos.y = e.offsetY;
			mouse.move = true;					
		}
	};

	$messageForm.submit(function(e) {
		e.preventDefault();
		if($message.val()){
			socket.emit('send_message', $message.val());
		}
		$message.val('');
	});

	$userForm.submit(function(e) {
		e.preventDefault();
		socket.emit('new_user', $username.val(), function(data) {
			if(data) {
				$userLoginArea.hide();
				$pageWrapper.show();
			}
		});
		$username.val('');
	});

	/**
	* Handling new message event
	*/
	socket.on('new_message', function(data) {
		$chat.append('<div class="list-group-item messages-item"><strong>' + data.user + ':</strong>&nbsp;' + data.msg + '</div>');
		$chat.scrollTop($chat[0].scrollHeight);
	});
	
	/**
	* Handling getting users event
	*/
	socket.on('get_users', function(data) {
		html = '';
		for(i=0; i<data.length; i++) {
			html += '<li class="list-group-item users-item">' + data[i] + '</li>';	
		}
		$users.html(html);
	});

	/**
	* Handling draw line event
	*/
	socket.on('draw_line', function (data) {
    	var line = data.line;
    	context.beginPath();
    	context.lineWidth = 2;
    	context.moveTo(line[0].x, line[0].y);
    	context.lineTo(line[1].x, line[1].y);
    	context.stroke();
	});

	/**
	* Handling clear board event
	*/
	socket.on('clear_board', function(){
		context.clearRect(0, 0, canvas.width, canvas.height);
	});

	//Na razie zrobilam tak, ze serwer wysyla do wszystkich info z socket id i rysuje ten, kto ma to id
	socket.on('your_turn', function(data){
		if(data.id === socket.id){
			currentlyDrawing = data.user;

			console.log("MY TURN", socket.id);
			//modal - użytkownik decyduje, czy chce rysowac
			$turnModal.show();				
		}
	});

	//tutaj na razie jest tylko handling od strony osoby rysującej
	//@TODO handling osób zgadujących
	socket.on('charade_guessed', function(data){
		if(data.id === socket.id) {
			$

			canDraw = false;
			turnSuccess = true;
			socket.emit('turn_finished');
			$sendMessageButton.prop('disabled', false);
			$message.prop('disabled', false);
		}
	});

	//rozpoczęcie tury przez użytkownika
	function startTurn(){
		$turnModal.hide();
		clearBoard();
		$sendMessageButton.prop('disabled', true);
		$message.prop('disabled', true);
		canDraw = true;

		$drawingUser.html(currentlyDrawing);

		//jesli w ciągu ustawionego czasu nie otrzymamy info, ze ktoś zgadł (turnSuccess jest false)
		//to tura jest przerwana
		setTimeout(function(){
			if(!turnSuccess){
				console.log("FAILURE");
				canDraw = false;

				socket.emit('change_drawing_user', {username: ''});

				socket.emit('turn_finished');
				$sendMessageButton.prop('disabled', false);
				$message.prop('disabled', false);
			}
			turnSuccess = false;
		}, 4000); //na razie ustawilam 20s do testowania, pozniej bedzie 60s

		displayTimer(4);
	}

	//Użytkownik nie chce rysować
	function dismissTurn(){
		$turnModal.hide();
		socket.emit('dismiss_turn');

		$drawingUser.html('');
	}

	//Czyszczenie tablicy do rysowania
	function clearBoard(){
		socket.emit('clear_board');
	}

	//pętla do rysowania
	function mainLoop() {
		if(canDraw){
			if (mouse.click && mouse.move && mouse.pos_prev) {
				socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ] });
				mouse.move = false;
			}
		}
		mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
		setTimeout(mainLoop, 25);
	}

	mainLoop();

	/**
	* Submitting message form on enter key
	*/
	$("#message").keypress(function(event) {
	    if(event.which == 13) {
	        event.preventDefault();
	        $("#message-form").submit();
	    }
	});

	/**
	* Displaying timer func.
	*/
	function displayTimer(seconds) {
		var count = seconds;
		$drawingTimer.html('0:' + count);

		var timer = setInterval(function() {
			count -= 1;
			if(count <= 0) {
				clearInterval(timer);
				$drawingTimer.html('0:00').css('color', '#FF0000');
				return;
			}
			$drawingTimer.html('0:' + count);
		}, 1000);
	}
});