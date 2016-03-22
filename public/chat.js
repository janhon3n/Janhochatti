window.onload = function(){
	alert('js toimi');
	alert(user);

	var messages = [];
	var socket = io();

	var field = document.getElementById("field");
	var sendButton = document.getElementById("send");
	var chat = document.getElementById("content");

	socket.emit('join', {username : user, channel : 'lobby'});
}
/*
	socket.on('message', function(data) {
		if(data.message) {
			messages.push(data.message);
			var html = '';
			for(var i=0; i < messages.length; i++){
				html += '<div>' + messages[i] + '</div>';
			}
			chat.innerHTML = html;
		} else {
			console.log("There is a problem:", data);
		}
	});


	sendButton.onclick = function() {
		var text = field.value;
		var channel = field2.value;
		socket.emit('send', {channel : channel, username : user, message : text});
	};
}
*/
