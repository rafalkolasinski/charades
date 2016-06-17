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