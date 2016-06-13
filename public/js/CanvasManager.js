var CanvasManager = function () {
	var $canvas  = $('#canvas')[0];
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
	}

	this.drawLine = function(lineData){
		context.beginPath();
		context.lineWidth = 2;
		context.moveTo(lineData[0].x, lineData[0].y);
		context.lineTo(lineData[1].x, lineData[1].y);
		context.stroke();
	}

	this.setMousePrevPosition = function(positionX, positionY){
		mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
	}

	this.setMouseMoveFalse = function(){
		mouse.move = false;
	}

	this.isNewLine = function(){
		return mouse.click && mouse.move && mouse.pos_prev;
	}

	this.getMousePosition = function(){
		return mouse.pos;
	}

	this.getMousePrevPosition = function(){
		return mouse.pos_prev;
	}

	this.enableDrawing = function(){
		drawingEnabled = true;
	}

	this.disableDrawing = function(){
		drawingEnabled = false;
	}

	this.clearBoard = function(){
		context.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	return this;
}

