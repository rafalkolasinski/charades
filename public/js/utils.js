/**
*
* JS utils
*
*/

//Checks if username is empty
var validateUsername = function(username) {
	var text = username;
	if($.trim(text) !== '') {
		return true;
	} else {
		return false;
	}
}