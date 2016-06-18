/* TURN HANDLING SERVICE
------------------------------------------------------------*/

var TurnService = function(){
	var canvasManager = CanvasManager();

	var timer = null;
	var isOwnTurn = false;

	//Selectors
	var $turnModal = $('#turn-modal');
	var $drawingTimer = $('#drawing-timer');
	var $drawingUser = $('#drawing-user');
	var $drawingPhrase = $('#drawing-phrase');
	var $currentPhrase = $('#current-phrase');
	var $currentUser = $('#current-user');
	var $message = $('#message');
	var $sendMessageButton = $('#send-message-button');
	var $charadeGuessedAlert = $('#charade-guessed-alert');
	var $turnOverAlert = $('#turn-over-alert');
	var $waitingAlert = $('#waiting-alert');

	/**
	* Setting currently drawing user
	*/
	this.setCurrentlyDrawingUser = function(userName){
		$drawingUser.html(userName);
		$currentUser.show();
		$currentPhrase.hide();
	}

	/**
	* Setting current phrase to guess
	*/
	this.setCurrentPhrase = function (phrase){
		$drawingPhrase.html(phrase)
		$currentPhrase.show();
		$currentUser.hide();
	}

	/**
	* Starting the turn
	*/
	this.startTurn = function (data){
		if(!isOwnTurn){
			displayTimer(60);
			setCurrentlyDrawingUser(data.userName);	
		}
	}

	/**
	* Handling turn acceptance
	*/
	this.acceptTurn = function (){
		clientService.emit(ServerMessagesConstant.TURN_ACCEPTED);
		$turnModal.hide();		
	}

	/**
	* Starting specific user's turn
	*/
	this.startOwnTurn = function (){
		switchMessages(true);
		isOwnTurn = true;
		canvasManager.enableDrawing();
	}

	/**
	* Handling turn rejection
	*/
	this.dismissTurn = function (){
		$turnModal.hide();
		clientService.emit(ServerMessagesConstant.DISMISS_TURN);
		$drawingUser.html('');
		isOwnTurn = false;
		canvasManager.disableDrawing();
	}

	/**
	* Displaying timer func.
	*/
	this.displayTimer = function (seconds) {
		var count = seconds;
		$drawingTimer.html('0:' + count).css('color', '#000000');

		timer = setInterval(function() {
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

	/**
	* Handling guessed phrase
	*/
	this.handleSuccessfulTurn = function() {
		$charadeGuessedAlert.show();
		setTimeout(function(){
			$charadeGuessedAlert.hide();
		}, 10000);

		clearInterval(timer);
		
		if(isOwnTurn) {
			setOwnTurn(false);
			canvasManager.disableDrawing();
			switchMessages(false);
			clientService.emit(ServerMessagesConstant.TURN_FINISHED);
		}
	}

	/**
	* Handling not guessed phrase
	*/
	this.handleFailedTurn = function() {
		showTurnOverAlert();
		clearInterval(timer);				
		if(isOwnTurn){
			isOwnTurn = false;
			canvasManager.disableDrawing();
			switchMessages(false);			
		}
	}

	/**
	* Setting specific user's turn flag
	*/
	this.setOwnTurn = function (ownTurn){
		isOwnTurn = ownTurn;
	}

	/**
	* Checking specific user's turn flag
	*/
	this.isOwnTurn = function(){
		return isOwnTurn;
	}

	/**
	* Handling drawing loop
	*/
	this.drawingLoop = function(){
		if(isOwnTurn){
			if (canvasManager.isNewLine()) {
				clientService.emit(ServerMessagesConstant.DRAW_LINE,  { line: [ canvasManager.getMousePosition(), canvasManager.getMousePrevPosition() ] });
				canvasManager.setMouseMoveFalse();
			}
		}
		canvasManager.setMousePrevPosition();

		setTimeout(drawingLoop, 25);
	}

	/**
	* Switching off sending chat messages
	*/
	this.switchMessages = function(disable){
		$sendMessageButton.prop('disabled', disable);
		$message.prop('disabled', disable);
	}

	/**
	* Removing 'charade guessed' alert
	*/
	this.closeCharadeGuessedAlert = function(){
		$charadeGuessedAlert.hide();
	}

	/**
	* Removing 'waiting for another user' alert 
	*/
	this.closeWaitingAlert = function(){
		$waitingAlert.hide();
	}

	/**
	* Showing 'turn over' alert
	*/
	this.showTurnOverAlert = function(){
		$turnOverAlert.show();

		setTimeout(function(){
			closeTurnOverAlert();
		}, 10000);
	}

	/**
	* Removing 'turn over' alert
	*/
	this.closeTurnOverAlert = function(){
			$turnOverAlert.hide();		
	}

	/**
	* Showing 'waiting for another user' alert
	*/
	this.showWaitingAlert = function(gameStopped){
		if(gameStopped){
			$waitingAlert.html('<h4>Game paused</h4><p>Looks like you\'re the only player left. The game will start if at least one more user joins you.</p>');
		}else{
			$waitingAlert.html('<h4>Hello!</h4><p>The game will start if at least one more user joins you.</p>');			
		}

		$waitingAlert.show();
	}

	/**
	* Removing all alerts
	*/
	this.hideAlerts = function(){
		closeWaitingAlert();
		closeTurnOverAlert();
		closeCharadeGuessedAlert();
	}

	/**
	* Stopping the game
	*/
	this.stopGame = function(){
		dismissTurn();		
		clearInterval(timer);
		showWaitingAlert(true);
		setCurrentlyDrawingUser('');
	}

	this.setUpCanvas = canvasManager.setUpCanvas;
	this.drawLine = canvasManager.drawLine;
	this.clearBoard = canvasManager.clearBoard;

	return this;
}