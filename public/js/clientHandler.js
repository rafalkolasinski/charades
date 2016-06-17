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
	var $messageAlert = '';
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

	//CHARADE NOT GUESSED
	socket.on(ServerMessagesConstant.TURN_FAILURE, function(){
		console.log("SERVER FAILURE");
		turnService.handleFailedTurn();
	})

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
			var res = validateUsername(userName);

			if(res.success === false) {
				setAlert(res.message, 'username');
			} else if(res.success === true){
				console.log(res.message);
				clientService.emit(ServerMessagesConstant.NEW_USER, {'userName': userName});
				switchToGameBoard();				
				$username.val('');
			}
		}
	});

	//MESSAGE FORM SUBMISSION
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

	function createUserlist(userlist){
		html = '';
		for( var i=0; i < userlist.length; i++) {
			html += '<li class="users-item">' + userlist[i] + '</li>';	
		}
		$users.html(html);
	}

	function createMessage(username, message, classNames){
		var messageElement = document.createElement('div');
		messageElement.innerHTML = '<div class="message-user"><span class="message-username"><strong>' + username 
									+ ':</strong></span>&nbsp;<span class="message-content">' + message + '</span></div>';
		messageElement.className = classNames;
		return messageElement;
	}

	function addNewMessage(data){
		if(data.phrase === data.message){
			$chat.append(
				createMessage(data.username, data.message, 'messages-item phrase-guessed')
			);

		}else{
			var formattedMessage = checkPhraseSimilarity(data.phrase, data.message);
			var message = formattedMessage.length > 0 ? formattedMessage : data.message;

			$chat.append(
				createMessage(data.username, message, 'messages-item')
			);
		}

		$chat.scrollTop($chat[0].scrollHeight);
	}

	function checkPhraseSimilarity(phrase, message){
		if(message.indexOf(phrase) !== -1){
			return formatPartiallyCorrectMessage(phrase, message);
		}else{
			var formattedMessage = '';
			formattedMessage = checkForWordFragments(phrase, message, 5);

			if(formattedMessage.length === 0){
				var phraseWords = phrase.split(' ');
				for(key in phraseWords){
					if(message.indexOf(phraseWords[key]) !== -1){
						formattedMessage = formatPartiallyCorrectMessage(phraseWords[key], message);
					}else{
						formattedMessage = checkForWordFragments(phraseWords[key], message, 5);						
					}

					if(formattedMessage.length >0){
						break;
					}
				}				
			}
			
			return formattedMessage;
		}
	}

	function checkForWordFragments(word, message, minLetterCount){
		for(var i=word.length; i >= minLetterCount; i--){
			var wordPart = word.substring(0, i);
			if(message.indexOf(wordPart) !== -1){
				return formatPartiallyCorrectMessage(wordPart, message);
			}				
		}
		return '';
	}

	function formatPartiallyCorrectMessage(matchingPart, message){
		console.log(matchingPart);
		var indexStart = message.indexOf(matchingPart);
		var indexEnd = indexStart + matchingPart.length;

		var messageStart = message.substring(0, indexStart);
		var messageMatch = message.substring(indexStart, indexEnd);
		var messageEnd = message.substring(indexEnd);
		return '<span>' + messageStart + '<span class="phrase-match">' + messageMatch + '</span>' + messageEnd + '</span>';
	}

	function setAlert(error, el){
		if(el === 'username') {
			// $usernameAlert.show();
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
		if(userlist.length === 0){
			turnService.showWaitingAlert();
		}
		$userLoginArea.hide();
		$pageWrapper.show();
		$currentPhrase.hide();
	}
});