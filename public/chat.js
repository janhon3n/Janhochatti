var messages = [];
var defaultChannel = 'lobby';

var channelsOn = [];
var currentChannel = '';

$('document').ready(function(){
	$('button#loginbutton').click(function(){
		login($('#usernamefield').val());
	});
});

function login(usern){
	$('#content').load('/chat.html', function(){
		var socket = io();
		socket.emit('login', {username : usern}, function(){
		});

		joinToChannel(socket, 'lobby');
		socket.on('updateChannels', function(data){
			var channellist = data.channellist;
			console.log('updating channels:');
			console.log(channellist);
			var html = '';
			for(var i = 0; i < channellist.length; i++){
				if(channelsOn.indexOf(channellist[i]) == -1){
					html = html + '<div class="channel channelJoin">' + channellist[i] + '</div>';
				}
			}
			$('#channellist').html(html);
			$('.channelJoin').click(function(){
				joinToChannel(socket, $(this).html());
				$(this).remove();
			});
		});

		socket.on('message', function(data){
			var msg = data.username + ': ' + data.message;
			console.log(msg);

			messages[data.channel].push({username : data.username, message : data.message});
			if(data.channel == currentChannel){
				addNewMessage(data.username, data.message);
			}
		});

		socket.on('info', function(data){
			var msg = data.message;
			console.log(msg);

			messages[data.channel].push({username : 'info', message : msg});
			if(data.channel == currentChannel){
				addNewMessage('info', data.message);
			}
		});

		$('#input button').click(function(){
			var msg = $('#input input').val();
			socket.emit('post', { channel : currentChannel, message : msg });
		});

		
	});
}

function joinToChannel(socket, chan){
	console.log('joining channel '+chan);
	channelsOn.push(chan);
	currentChannel = chan;
	messages[chan] = [];
	$('#messages').html('');
	socket.emit('join', {channel : chan});
	$('#activechannellist').append('<div class="channel channelMove">' + chan + '</div>');	
	$('.channelMove').click(function(){
		moveToChannel($(this).html());
	});

}

function leaveChannel(chan){

}

function moveToChannel(channel){
	currentChannel = channel;
	console.log('setting current channel to ' + channel);
	if(!messages[channel]){
		console.log('luodaan uusi messageslista kanavalle ' + channel);
		messages[channel] = [];
	}

	$('#messages').html('');
	for(var i = 0; i < messages[channel].length; i++){
		addNewMessage(messages[channel][i].username, messages[channel][i].message);
	}
}

function addNewMessage(usern, msg){
	$('#messages').append('<div class="message">' + usern + ': ' + msg + '</div>');
}

function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}