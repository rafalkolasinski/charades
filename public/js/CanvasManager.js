/* CANVAS METHODS
------------------------------------------------------------*/

/**
* Configuring canvas
*/
var CanvasManager = function () {
	var $canvas  = $('#canvas')[0];
	var $clearButton = $('#clear-boeard-button');
	var drawingEnabled = false;

	var mouse = { 
    	click: false,
    	move: false,
    	pos: {x:0, y:0},
    	pos_prev: false
	};

	var context = $canvas.getContext('2d');
	var width   = window.innerWidth / 2.25;
	var height  = window.innerHeight / 1.75;

	/**
	* Setting canvas' size and mouse events
	*/
	this.setUpCanvas = function(){
		$canvas.width = width;
		$canvas.height = height;

		$canvas.onmousedown = function(e){
			if(drawingEnabled){
			mouse.click = true;   					
			}
		};
		$canvas.onmouseup = function(e){
			if(drawingEnabled){
				mouse.click = false;					
			}
		};

		$canvas.onmousemove = function(e) {
			if(drawingEnabled){
				mouse.pos.x = e.offsetX;
				mouse.pos.y = e.offsetY;
				mouse.move = true;					
			}
		};

		$clearButton.prop( "disabled", true );
	}

	/**
	* Handling line drawing
	*/
	this.drawLine = function(lineData){
		context.beginPath();
		context.lineWidth = 2;
		context.moveTo(lineData[0].x, lineData[0].y);
		context.lineTo(lineData[1].x, lineData[1].y);
		context.stroke();
	}

	/**
	* Setting mouse position on canvas
	*/
	this.setMousePrevPosition = function(positionX, positionY){
		mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
	}

	/**
	* Setting mouse movement flag 
	*/
	this.setMouseMoveFalse = function(){
		mouse.move = false;
	}

	/**
	* Checking if new line is being drawn
	*/
	this.isNewLine = function(){
		return mouse.click && mouse.move && mouse.pos_prev;
	}

	/**
	* Getting current mouse position
	*/
	this.getMousePosition = function(){
		return mouse.pos;
	}

	/**
	* Getting previous mouse position
	*/
	this.getMousePrevPosition = function(){
		return mouse.pos_prev;
	}

	/**
	* Setting drawing flag to true
	*/
	this.enableDrawing = function(){
		drawingEnabled = true;
		$clearButton.prop("disabled", false);
	}

	/**
	* Setting drawing flag to false
	*/
	this.disableDrawing = function(){
		drawingEnabled = false;
		$clearButton.prop("disabled", true);
	}

	/**
	* Clearing the canvas
	*/
	this.clearBoard = function(){
		context.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	return this;
}

