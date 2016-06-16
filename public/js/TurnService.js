var TurnService = function(){
	var canvasManager = CanvasManager();

	var turnSuccess = false;
	var timer = null;
	var isOwnTurn = false;

	var $turnModal = $('#turn-modal');
	var $drawingTimer = $('#drawing-timer');
	var $drawingUser = $('#drawing-user');
	var $drawingPhrase = $('#drawing-phrase');
	var $currentPhrase = $('#current-phrase');
	var $currentUser = $('#current-user');
	var $message = $('#message');
	var $sendMessageButton = $('#send-message-button');
	var $charadeGuessedAlert = $('#charade-guessed-alert');
	var $waitingAlert = $('#waiting-alert');

	this.setCurrentlyDrawingUser = function(userName){
		$drawingUser.html(userName);
		$currentUser.show();
		$currentPhrase.hide();
	}

	this.setCurrentPhrase = function (phrase){
		$drawingPhrase.html(phrase)
		$currentPhrase.show();
		$currentUser.hide();
	}
	this.startTurn = function (data){
		turnSuccess = false;
		if(!isOwnTurn){
			setCurrentlyDrawingUser(data.userName);	
		}
	}

	this.acceptTurn = function (){
		clientService.emit(ServerMessagesConstant.TURN_ACCEPTED);
		$turnModal.hide();		
	}

	//rozpoczęcie tury przez użytkownika
	this.startOwnTurn = function (){
		clearBoard();
		switchMessages(true);
		isOwnTurn = true;
		canvasManager.enableDrawing();

		//jesli w ciągu ustawionego czasu nie otrzymamy info, ze ktoś zgadł (turnSuccess jest false)
		//to tura jest przerwana
		setTimeout(function(){
			if(!turnSuccess){
				isOwnTurn = false;
				canvasManager.disableDrawing();
				clientService.emit(ServerMessagesConstant.CHANGE_DRAWING_USER, {username: ''});
				clientService.emit(ServerMessagesConstant.TURN_FINISHED);
				switchMessages(false);
			}else{
				turnSuccess = false;				
			}

		}, 20000); //na razie ustawilam 20s do testowania, pozniej bedzie 60s

		displayTimer(20);
	}

	//Użytkownik nie chce rysować
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
			if(!turnSuccess){
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
			}
		}, 1000);
	}

	this.handleSuccessfulTurn = function() {
		turnSuccess = true;
		$charadeGuessedAlert.show();
		setTimeout(function(){
			$charadeGuessedAlert.hide();
		}, 10000);

		if(isOwnTurn) {
			clearInterval(timer);
			setOwnTurn(false);
			canvasManager.disableDrawing();
			switchMessages(false);
			clientService.emit(ServerMessagesConstant.TURN_FINISHED);
		}
	}

	this.setOwnTurn = function (ownTurn){
		isOwnTurn = ownTurn;
	}

	this.isOwnTurn = function(){
		return isOwnTurn;
	}

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

	this.switchMessages = function(disable){
		$sendMessageButton.prop('disabled', disable);
		$message.prop('disabled', disable);
	}

	this.closeCharadeGuessedAlert = function(){
		$charadeGuessedAlert.hide();
	}

	this.closeWaitingAlert = function(){
		$waitingAlert.hide();
	}

	this.showWaitingAlert = function(){
		$waitingAlert.show();
	}

	this.setUpCanvas = canvasManager.setUpCanvas;
	this.drawLine = canvasManager.drawLine;
	this.clearBoard = canvasManager.clearBoard;

	return this;
}