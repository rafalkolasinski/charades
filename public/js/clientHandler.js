/**
* Initializing material design for Bootstrap 3.x.x
*/
$.material.init();


/* APP INIT
------------------------------------------------------------*/

$(document).ready(function() {
	//Initializing socket.io
	var socket = io();
	clientService = ClientService(socket);

	var turnService = TurnService();

	//Getting users on app init
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
	var $messageAlert = '';
	var $turnModal = $('#turn-modal');
	var $currentPhrase = $('#current-phrase');
	var $currentUser = $('#current-user');

	document.clearBoard = clearBoard;
	document.acceptTurn = turnService.acceptTurn;
	document.dismissTurn = turnService.dismissTurn;
	document.closeCharadeGuessedAlert = turnService.closeCharadeGuessedAlert;

	/**
	* Init func - getting users, hiding alerts, setting up canvas
	*/
	function init(){
		clientService.emit(ServerMessagesConstant.GET_USERS);
		$turnModal.hide();
		turnService.hideAlerts();
		turnService.setUpCanvas();

		turnService.drawingLoop();
	}

	init();

	/**
	* Handling user connection
	*/
	socket.on(ServerMessagesConstant.CONNECT, function(){
		if(userName){
			clientService.emit(ServerMessagesConstant.NEW_USER, {'userName': userName});
		}else{
			switchToLogin();
		}
	});

	/**
	* Handling user logout
	*/
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
		$users.html(createUserlist(userlist));
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


/* GAME EVENTS
------------------------------------------------------------*/

	/**
	* Starting the game
	*/
	socket.on(ServerMessagesConstant.GAME_START, function(data){
		turnService.closeWaitingAlert();
		$currentPhrase.hide();
		$currentUser.show();
	});

	/**
	* Starting common turn
	*/
	socket.on(ServerMessagesConstant.TURN_START, function (data){
		turnService.startTurn(data);
	});

	/**
	* Starting specific user's turn 
	*/
	socket.on(ServerMessagesConstant.TURN_INIT, function(){
		$turnModal.show();
	});

	/**
	* Setting current phrase
	*/
	socket.on(ServerMessagesConstant.TURN_PHRASE, function(data){
		turnService.setCurrentPhrase(data.phrase);
		turnService.startOwnTurn();
	})

	/**
	* Stopping the game
	*/
	socket.on(ServerMessagesConstant.GAME_STOP, function(){
		if(userName){
			turnService.stopGame();
			clearBoard();			
		}
	});

	/**
	* Handling guessed phrase
	*/
	socket.on(ServerMessagesConstant.TURN_SUCCESS, function(){
		turnService.handleSuccessfulTurn();
	});

	/**
	* Handling not guessed phrase
	*/
	socket.on(ServerMessagesConstant.TURN_FAILURE, function(){
		turnService.handleFailedTurn();
	})


/* USER EVENTS
------------------------------------------------------------*/

	/**
	* Handling logging in
	*/
	$userForm.submit(function(e) {
		e.preventDefault();
		userName = $username.val();
		if($usernameAlert) {
			$usernameAlert.remove();
		}

		if(validateUsername(userName)) {
			var res = validateUsername(userName);

			if(res.success === false) {
				setAlert(res.message, 'username');
			} else if(res.success === true){
				clientService.emit(ServerMessagesConstant.NEW_USER, {'userName': userName});
				switchToGameBoard();				
				$username.val('');
			}
		}
	});

	/**
	* Handling sending chat message
	*/
	$messageForm.submit(function(e) {
		e.preventDefault();
		if($message.val()){
			var value = $message.val();
			var res = validateChatMessage(value);

			if(res.success === false) {
				setAlert(res.message, 'message');
			} else if(res.success === true) {
				if($messageAlert) {
					$messageAlert.remove();
				} 
				clientService.emit(ServerMessagesConstant.SEND_MESSAGE, {message: $message.val()});
				$message.val('');
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

	/**
	* Adding new message to chat window
	*/
	function addNewMessage(data){
		$chat.append(createMessage(data));
		$chat.scrollTop($chat[0].scrollHeight);
	}

	/**
	* Setting username/message alert
	*/
	function setAlert(error, el){
		if(el === 'username') {
			$('.username-input + .btn-basic').before($("<p id='username-alert'></p>"));
			$usernameAlert = $('#username-alert');
			$usernameAlert.html(error);
			$usernameAlert.addClass('alert-wrapper');
		} else if(el === 'message') {
			$('#message + .btn-basic').before($("<p id='message-alert'></p>"));
			$messageAlert = $('#message-alert');
			$messageAlert.html(error);
			$messageAlert.addClass('alert-wrapper');
		}
	}

	/**
	* Clearing the drawing board
	*/
	function clearBoard(){
		clientService.emit(ServerMessagesConstant.CLEAR_BOARD);
	}

	/**
	* Switching window to login
	*/
	function switchToLogin(){
		turnService.closeWaitingAlert();
		$userLoginArea.show();		
		$pageWrapper.hide();
	}

	/**
	* Switching window to game board
	*/
	function switchToGameBoard(){
		if(userlist.length === 0){
			turnService.showWaitingAlert();
		}
		$userLoginArea.hide();
		$pageWrapper.show();
		$currentPhrase.hide();
	}
});