//Initializing material design for Bootstrap 3.x.x
$.material.init();

$(document).ready(function() {
	var socket = io();
	clientService = ClientService(socket);

	var turnService = TurnService();

	socket.emit('get_users');
	var html = '';
	var userName = '';
	var userlist = [];

	//Selectors
	var $messageForm = $('#message-form');
	var $message = $('#message');
	var $chat = $('#chat');
	var $pageWrapper = $('#page-wrapper');
	var $userForm = $('#userForm');
	var $userLoginArea = $('#user-login-area');
	var $users = $('#users');
	var $username = $('#username');
	var $usernameAlert = '';
	var $turnModal = $('#turn-modal');
	var $currentPhrase = $('#current-phrase');
	var $currentUser = $('#current-user');

	document.clearBoard = clearBoard;
	document.acceptTurn = turnService.acceptTurn;
	document.dismissTurn = turnService.dismissTurn;
	document.closeCharadeGuessedAlert = turnService.closeCharadeGuessedAlert;


	function init(){
		//Request for userlist
		clientService.emit(ServerMessagesConstant.GET_USERS);
		$turnModal.hide();
		turnService.hideAlerts();
		turnService.setUpCanvas();

		//pętla do rysowania
		turnService.drawingLoop();
	}

	init();


	socket.on( ServerMessagesConstant.CONNECT, function(){
		if(userName){
			clientService.emit(ServerMessagesConstant.NEW_USER, {'userName': userName});
		}else{
			switchToLogin();
		}
	});

	socket.on(ServerMessagesConstant.NOT_LOGGED_IN, function(data){
		switchToLogin();
	});

	/**
	* Handling new message event
	*/
	socket.on(ServerMessagesConstant.NEW_MESSAGE, function(data) {
		addNewMessage(data);
	});
	
	/**
	* Handling getting users event
	*/
	socket.on(ServerMessagesConstant.SEND_USERNAMES, function(data) {
		userlist = data.userlist
		createUserlist(userlist);
	});

	/**
	* Handling draw line event
	*/
	socket.on(ServerMessagesConstant.DRAW_LINE, function (data) {
		turnService.drawLine(data.line);
	});

	/**
	* Handling clear board event
	*/
	socket.on(ServerMessagesConstant.CLEAR_BOARD, function(){
		turnService.clearBoard();
	});

	//-----GAME---------------------------------------------------------
	//START GAME
	socket.on(ServerMessagesConstant.GAME_START, function(data){
		turnService.closeWaitingAlert();
		$currentPhrase.hide();
		$currentUser.show();
		if(data.id === socket.id){
			$turnModal.show();
		}
	});
	//START TURN
	socket.on(ServerMessagesConstant.TURN_START, function (data){
		turnService.startTurn(data);
	});
	//START OWN TURN
	socket.on(ServerMessagesConstant.TURN_INIT, function(){
		$turnModal.show();
	});

	socket.on(ServerMessagesConstant.TURN_PHRASE, function(data){
		turnService.setCurrentPhrase(data.phrase);
		turnService.startOwnTurn();
	})

	//STOP GAME
	socket.on(ServerMessagesConstant.GAME_STOP, function(){
		if(userName){
			turnService.stopGame();
			clearBoard();			
		}
	});

	//CHARADE GUESSED
	socket.on(ServerMessagesConstant.TURN_SUCCESS, function(){
		turnService.handleSuccessfulTurn();
	});

	//----------------------------------------------------------------

	//USER FORM SUBMISSION (LOG IN)
	$userForm.submit(function(e) {
		e.preventDefault();
		userName = $username.val();
		if($usernameAlert) {
			$usernameAlert.remove();
		}
		// $usernameAlert.hide();
		// $usernameAlert.removeClass('username-alert-wrapper');

		//Empty username validation
		if(validateUsername(userName)) {
			//Duplicate username validation
			if(userlist.length === 0 || $.inArray(userName, userlist) === -1) {
				clientService.emit(ServerMessagesConstant.NEW_USER, {'userName': userName});
				switchToGameBoard();				
				$username.val('');
			} else {
				setUsernameAlert('Username already exists!');
			}
		} else {
			setUsernameAlert('Username cannot be empty!');
		}
	});

	//MESSAGE FORM SUBMISSION
	$messageForm.submit(function(e) {
		e.preventDefault();
		if($message.val()){
			clientService.emit(ServerMessagesConstant.SEND_MESSAGE, {message: $message.val()});
		}
		$message.val('');
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

	function createUserlist(userlist){
		html = '';
		for( var i=0; i < userlist.length; i++) {
			html += '<li class="users-item">' + userlist[i] + '</li>';	
		}
		$users.html(html);
	}

	function createMessage(username, message, classNames){
		var messageElement = document.createElement('div');
		messageElement.innerHTML = '<div class="message-user"><span class="message-username"><strong>' + username + ':</strong></span>&nbsp;<span class="message-content">' + message + '</span></div>';
		messageElement.className = classNames;
		return messageElement;
	}

	function addNewMessage(data){
		if(data.phrase_guessed){
			$chat.append(
				createMessage(data.username, data.message, 'messages-item phrase-guessed')
			);

		}else{
			$chat.append(
				createMessage(data.username, data.message, 'messages-item')
			);
		}

		$chat.scrollTop($chat[0].scrollHeight);
	}

	function setUsernameAlert(error){
		// $usernameAlert.show();
		$('.username-input + .btn-basic').before($("<p id='username-alert'></p>"));
		$usernameAlert = $('#username-alert');
		$usernameAlert.html(error);
		$usernameAlert.addClass('username-alert-wrapper');
	}

	//Czyszczenie tablicy do rysowania
	function clearBoard(){
		clientService.emit(ServerMessagesConstant.CLEAR_BOARD);
	}

	function switchToLogin(){
		turnService.closeWaitingAlert();
		$userLoginArea.show();		
		$pageWrapper.hide();
	}

	function switchToGameBoard(){
		turnService.showWaitingAlert();
		$userLoginArea.hide();
		$pageWrapper.show();
		$currentPhrase.hide();
	}
});