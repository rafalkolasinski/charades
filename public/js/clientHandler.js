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
	var userName = '';

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
	document.startOwnTurn = startOwnTurn;
	document.dismissTurn = dismissTurn;

	$turnModal.hide();
	setUpCanvas();


	$messageForm.submit(function(e) {
		e.preventDefault();
		if($message.val()){
			socket.emit('send_message', $message.val());
		}
		$message.val('');
	});

	$userForm.submit(function(e) {
		e.preventDefault();
		userName = $username.val();

		if(validateUsername(userName)) {
			if($("#username-alert").length){
				$("#username-alert").remove();
			}
			//then validate for duplicated username
			
			//then redirect to to board
			socket.emit('new_user', {userName: userName}, function(data) {
				if(data) {
					switchToGameBoard();
				}
			});
			$username.val('');
		} else {
			if(!$("#username-alert").length){
				$("#username-wrapper").append('<p id="username-alert">Username cannot be empty.</p>');
			}
		}
	});

	/**
	* Submitting message form on enter key
	*/
	$message.keypress(function(event) {
	    if(event.which == 13) {
	        event.preventDefault();
	        $messageForm.submit();
	    }
	});

	socket.on('connect', function(){
		canDraw = false;

		if(userName){
			socket.emit('new_user', {userName: userName}, function(data){
				if(!data){
					switchToLogin();
				}
			});
		}else{
			switchToLogin();
		}
	});

	socket.on('not_logged_in', function(data){
		canDraw = false;
		switchToLogin();
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

	socket.on('your_turn', function(){
		$turnModal.show();
	});

	//Na razie zrobilam tak, ze serwer wysyla do wszystkich info z socket id i rysuje ten, kto ma to id
	socket.on('start_turn', function (data){
		startTurn(data);
	});

	socket.on('start_game', function(data){
		startTurn(data);
		if(data.id === socket.id){
			$turnModal.show();
		}
	});

	//tutaj na razie jest tylko handling od strony osoby rysującej
	//@TODO handling osób zgadujących
	socket.on('charade_guessed', function(data){
		if(data.id === socket.id) {
			canDraw = false;
			turnSuccess = true;
			socket.emit('turn_finished');
			$sendMessageButton.prop('disabled', false);
			$message.prop('disabled', false);
		}
	});

	socket.on('stop_game', function(){
		canDraw = false;
		setCurrentlyDrawingUser('');
	});

	function setCurrentlyDrawingUser(userName){
		currentlyDrawing = userName;
		$drawingUser.html(currentlyDrawing);
	}

	function startTurn(data){
		setCurrentlyDrawingUser(data.userName);
	}

	//rozpoczęcie tury przez użytkownika
	function startOwnTurn(){
		$turnModal.hide();
		clearBoard();
		$sendMessageButton.prop('disabled', true);
		$message.prop('disabled', true);
		canDraw = true;

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
		}, 20000); //na razie ustawilam 20s do testowania, pozniej bedzie 60s

		displayTimer(20);
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
	* Displaying timer func.
	*/
	function displayTimer(seconds) {
		var count = seconds;
		$drawingTimer.html('0:' + count).css('color', '#000000');

		var timer = setInterval(function() {
			count -= 1;
			if(count <= 0) {
				clearInterval(timer);
				$drawingTimer.html('0:00').css('color', '#FF0000');
				return;
			}
			if(count >= 10) {
				$drawingTimer.html('0:' + count);
			} else if(count < 10 && count > 0) {
				$drawingTimer.html('0:0' + count);
			}
		}, 1000);
	}

	function switchToLogin(){
		$userLoginArea.show();		
		$pageWrapper.hide();
	}

	function switchToGameBoard(){
		$userLoginArea.hide();		
		$pageWrapper.show();
	}

	function setUpCanvas(){
		$canvas.width = width;
		$canvas.height = height;

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
	}
});