window.onload = function(){
	var messages = [];
	var user = getUrlVars()['user'];

	var messages = [];
	var currentChannel = '';

	$('button#loginbutton').click(function(){
		login($('#usernamefield').val());
	});
}

function login(username){
	var socket = io();

	socket.emit('login', {username : username});

	$('#content').load('/chat.html', function(){
		socket.emit('join', {channel : 'lobby'});
		moveToChannel('lobby');

		socket.on('updateChannels', function(data){
			alert(data.channellist);
			var channellist = data.channellist;
			for(var i = 0; i < channellist.length; i++){
				if(!messages[channellist[i]]){
					alert('luodaan uusi messageslista kanavalle '+channellist[i]);
					messages[channellist[i]] = [];
				}
			}
			var html = '';
			for(i = 0; i < channellist.length; i++){
				html = html + '<div class="channel">' + channellist[i] + '</div>';
				$('#channellist').html(html);
			}
		});

		$('#input button').click(function(){
			var msg = $('#input input').val();
			socket.emit('post', { channel : currentChannel, message : msg });
		});


		socket.on('message', function(data){
			alert('uusi viesti: '+data.username + ' ' + data.message);
			messages[data.channel].push({username : data.username, message : data.message});
			if(data.channel == currentChannel){
				addNewMessage(data.username, data.message);
			}
		});
	});
}

function moveToChannel(channel){
	currentChannel = channel;
	alert('setting current channel to ' + channel);
	if(!messages[channel]){
		alert('luodaan uusi messageslista kanavalle ' + channel);
		messages[channel] = [];
	}

	$('#messages').html('');
	for(var i = 0; i < messages[channel].length; i++){
		addNewMessage(messages[channel][i].username, messages[channel][i].message);
	}
}

function addNewMessage(user, msg){
	$('#messages').append('<div class="message">' + user + ': ' + msg + '</div>');
}

function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}
