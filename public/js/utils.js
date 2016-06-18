/**
*
* JS utils
*
*/

//Error messages
var messages = {
	empty: 'Username cannot be empty!',
	usernameLink: 'Username cannot contain URLs!',
	messageLink: 'Message cannot contain URLs!',
	success: 'Successfully set username!'
}

//Error substrings
var substr = {
	url: 'http://',
	secure: 'https://'
};

//Error response
var res = {
	message: '',
	success: false
};

//Input
var text = '';

//Checks if username is empty
var validateUsername = function(username) {
	text = username;

	if($.trim(text) !== ''){
		if(text.indexOf(substr.url) > -1 || text.indexOf(substr.secure) > -1) {
			res = {
				message: messages.usernameLink,
				success: false
			};
		} else {
			res = {
				message: messages.success,
				success: true
			};
		}
	} else if($.trim(text) === '') {
		res = {
			message: messages.empty,
			success: false
		};
	}

	return res;
}

var validateChatMessage = function(message) {
	text = message;

	if(text.indexOf(substr.url) > -1 || text.indexOf(substr.secure) > -1) {
		res = {
			message: messages.messageLink,
			success: false
		};
	} else {
		res = {
			message: messages.success,
			success: true
		};
	}

	return res;
}


var createHtmlMessageItem = function(username, message, classNames){
	var messageElement = document.createElement('div');
	messageElement.innerHTML = '<div class="message-user"><span class="message-username"><strong>' + username 
								+ ':</strong></span>&nbsp;<span class="message-content">' + message + '</span></div>';
	messageElement.className = classNames;
	return messageElement;
}

var createMessage = function(data){
	var messageToAdd = '';

		if(data.phrase === data.message.toLowerCase()){
			messageToAdd = createHtmlMessageItem(data.username, data.message, 'messages-item phrase-guessed');

		}else{
			var formattedMessage = checkPhraseSimilarity(data.phrase, data.message);
			formattedMessage = formattedMessage.length > 0 ? formattedMessage : data.message;

			messageToAdd = createHtmlMessageItem(data.username, formattedMessage, 'messages-item');
		}
	return messageToAdd;
}

var checkPhraseSimilarity = function(phrase, messageToCheck){
	message = messageToCheck.toLowerCase();
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

var checkForWordFragments = function(word, message, minLetterCount){
	for(var i=word.length; i >= minLetterCount; i--){
		var wordPart = word.substring(0, i);
		if(message.indexOf(wordPart) !== -1){
			return formatPartiallyCorrectMessage(wordPart, message);
		}				
	}
	return '';
}

var formatPartiallyCorrectMessage = function(matchingPart, message){
	var indexStart = message.indexOf(matchingPart);
	var indexEnd = indexStart + matchingPart.length;

	var messageStart = message.substring(0, indexStart);
	var messageMatch = message.substring(indexStart, indexEnd);
	var messageEnd = message.substring(indexEnd);
	return '<span>' + messageStart + '<span class="phrase-match">' + messageMatch + '</span>' + messageEnd + '</span>';
}

var createUserlist = function(userlist){
	html = '';
	for( var i=0; i < userlist.length; i++) {
		html += '<li class="users-item">' + userlist[i] + '</li>';	
	}
	return html
}