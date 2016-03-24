var messages = [];
var defaultChannel = 'lobby';

var channelsOn = [];
var currentChannel = '';

$('document').ready(function(){
	$('#login button#loginbutton').click(function(){
		login($('#usernamefield').val(), $('input#color').val());
	});
	$('#login input').keyup(function(e){
		if(e.keyCode == 13){
			login($('#usernamefield').val(), $('input#color').val());
		}
	});
});

function login(usern, col){
	$('#content').load('/chat.html', function(){
		var socket = io();
		socket.emit('login', {username : usern, color : col}, function(){
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

			messages[data.channel].push({username : data.username, color : data.color, message : data.message});
			if(data.channel == currentChannel){
				addNewMessage(data.username, data.color, data.message);
			}
		});

		socket.on('info', function(data){
			var msg = data.message;
			console.log(msg);

			messages[data.channel].push({username : 'info', color : data.color, message : msg});
			if(data.channel == currentChannel){
				addNewMessage('info', data.color, data.message);
			}
		});

		$('#input button').click(function(){
			var msg = $('#input input').val();
			$('#input input').val('');
			socket.emit('post', { channel : currentChannel, message : msg });
		});
		$('#input input').keyup(function(e){
			if(e.keyCode == 13){
				var msg = $(this).val();
				$(this).val('');
				socket.emit('post', { channel : currentChannel, message : msg});
			}
		});
		$('#createnewchannelbutton').click(function(){
			toggleCreateNew(socket);
		});
		$('#dropdownmenu svg#menubutton').click(function(){
			$('#dropdownmenu #dropdowncontent').slideToggle(200);
		});
		$('#leaveCurrentChannelButton').click(function(){
			$('#dropdownmenu #dropdowncontent').slideToggle(200);			
			leaveCurrentChannel(socket);
		});
	});
}

var toggleCreateNewState = true;
function toggleCreateNew(socket){
	if(toggleCreateNewState){
		toggleCreateNewState = false;
		$('#createnewchannel').html('<input type="text" autofocus><button>Luo</button>').promise().done(function(){
			$('#createnewchannel button').click(function(){
				if($('#createnewchannel input').val()){
					createNewChannel(socket, $('#createnewchannel input').val());
					toggleCreateNew(socket);
				}
			});
		});
	} else {
		toggleCreateNewState = true;
		$('#createnewchannel').html('<div id="createnewchannelbutton">Luo uusi kanava</div>').promise().done(function(){
			$('#createnewchannelbutton').click(function(){
				toggleCreateNew(socket);
			});
		});
	}
}

function createNewChannel(socket, chan){
	var chann = validator.escape(chan + '');
	console.log('creating channel '+chann);
	channelsOn.push(chann);
	currentChannel = chann;
	messages[chann] = [];
	$('#messages').html('');
	socket.emit('create', {channel : chann});
	$('#activechannellist').append('<div class="channel channelMove">' + chann + '</div>');
	$('.channelMove').click(function(){
		moveToChannel($(this).html());
	});
	$('#infobar #title').html(chann);
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
	$('#infobar #title').html(chan);
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
		addNewMessage(messages[channel][i].username, messages[channel][i].color, messages[channel][i].message);
	}
	$('#infobar #title').html(channel);

}
function leaveCurrentChannel(socket){
	var index = channelsOn.indexOf(currentChannel);
	channelsOn.splice(index, 1);	
	$('#activechannellist .channelMove').filter(function(){
		return $(this).html() == currentChannel;
	}).remove();
	socket.emit('leave', {channel : currentChannel});
	moveToChannel($('#activechannellist .channelMove').first().html());
}

function addNewMessage(usern, color, msg){
	$('#messages').append('<div class="messagewrap"><span class="message"><b style="color:' + color + '">' + usern + ':</b> ' + msg + '</span></div>');
}
