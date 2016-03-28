//messages are stored locally in client, list of all channels and channels client is on are stored in the server
var defaultChannel = 'lobby';
var defaultColors = ['#ff0000', '#FF00AF', '#8700FF', '#0012FF', '#00C1E2', '#02CE00', '#A6B300', '#FF9B00', '#9A0000', '#7B4000'];
var messages = [];
var maxMessagesPerChannel = 50;
var socket;
var scrollActive = true;

messages[defaultChannel] = [];

var currentChannel = '';

$('document').ready(function(){
	$('input#color').val(defaultColors[Math.floor(Math.random() * defaultColors.length)]);
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
	socket = io();
	socket.emit('validateLogin', {username : usern, color : col}, function(error){
		if(error){
			alert(error);
			socket = null;
		} else {
			$('#content').load('/chat.html', function(){

				moveToChannel(defaultChannel);

				//updates the channel list
				socket.on('updateChannels', function(data){
					var channelsNotOn = data.channelsnoton;
					var channelsOn = data.channelson;
					console.log('updating channels:');
					console.log(channelsOn);
					console.log(channelsNotOn);
					
					//create links for active channels
					var activehtml = '';
					for(var i = 0; i < channelsOn.length; i++){
						activehtml += '<div class="channel channelMove">' + channelsOn[i] + '</div>';
					}
					$('#activechannellist').html(activehtml);
					$('.channelMove').click(function(){
						moveToChannel($(this).html());
					});

					//create links for non active channels
					var nonactivehtml = '';
					for(var i = 0; i < channelsNotOn.length; i++){
						nonactivehtml += '<div class="channel channelJoin">' + channelsNotOn[i] + '</div>';
					}
					$('#channellist').html(nonactivehtml);
					$('.channelJoin').click(function(){
						joinToChannel(socket, $(this).html());
					});
				});

				//receiving messages, client only receives messages from channels it is on
				socket.on('message', function(data){
					console.log(data.username + ': ' + data.message);
					if(messages[data.channel].length > maxMessagesPerChannel){
						messages[data.channel].shift();
					}
					messages[data.channel].push({type : 'normal', username : data.username, color : data.color, message : data.message});
					if(data.channel == currentChannel){
						addNewMessage(data.username, data.color, data.message);
					}
				});

				//recieving information messages (joining, leaving, alerts, ...)
				socket.on('info', function(data){	
					if(messages[data.channel].length > maxMessagesPerChannel){
						messages[data.channel].shift();
					}			
					messages[data.channel].push({type : 'info', messages : data.messages, colors : data.colors});
					if(data.channel == currentChannel){
						addNewInfoMessage(data.messages, data.colors);
					}
				});
				
				//recieving alerts. Just add a new message to the current channel with their info.
				socket.on('alert', function(data){
					addNewInfoMessage(data.messages, data.colors);
				});

				//gui stuff
				//if user trying to post emit the corresponding 'post'
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

				//user pressed the button to create new channel
				$('#createnewchannelbutton').click(function(){
					toggleCreateNew(socket);
				});

				//dropdown menu toggle button
				$('#dropdownmenu svg#menubutton').click(function(){
					$('#dropdownmenu #dropdowncontent').slideToggle(200);
				});

				//user pressed the leave from current channel button
				$('#leaveCurrentChannelButton').click(function(){
					$('#dropdownmenu #dropdowncontent').slideToggle(200);			
					leaveCurrentChannel(socket);
				});
				
				socket.emit('login', {username : usern, color : col});
			});
		}
	});	
}

//create new channel button/form toggling and functionality
var toggleCreateNewState = true;
function toggleCreateNew(socket){
	if(toggleCreateNewState){
		toggleCreateNewState = false;
		$('#createnewchannel').html('<input type="text"><button>Luo</button>').promise().done(function(){
			$('#createnewchannel input').focus();
			$('#createnewchannel button').click(function(){
				if($('#createnewchannel input').val()){
					createNewChannel(socket, $('#createnewchannel input').val());
					toggleCreateNew(socket);
				}
			});
			$('#createnewchannel input').keyup(function(e){
				if(e.keyCode == 13){
					if($('#createnewchannel input').val()){
						createNewChannel(socket, $('#createnewchannel input').val());
						toggleCreateNew(socket);
					}
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
	console.log('trying to create channel '+chann);
	socket.emit('create', {channel : chann}, function(error){
		if(!error){
			messages[chann] = [{type : 'info', messages : ['New channel created'], colors : []}];
		}
	});
}

function joinToChannel(socket, chan){
	console.log('joining channel '+chan);
	socket.emit('join', {channel : chan}, function(error){
		if(!error){
			messages[chan] = [];
			moveToChannel(chan);
		}
	});
}

function moveToChannel(channel){
	console.log('setting current channel to ' + channel);
	currentChannel = channel;
	$('#messages').html('');
	for(var i = 0; i < messages[channel].length; i++){
		if(messages[channel][i].type == 'normal'){
			addNewMessage(messages[channel][i].username, messages[channel][i].color, messages[channel][i].message);
		} else if(messages[channel][i].type == 'info'){
			addNewInfoMessage(messages[channel][i].messages, messages[channel][i].colors);
		}
	}
	$('#infobar #title').html(channel);

}
function leaveCurrentChannel(socket){
	if(currentChannel != defaultChannel){
		socket.emit('leave', {channel : currentChannel});
		moveToChannel(defaultChannel);
	} else {
		addNewInfoMessage(["You can't leave the default channel "+defaultChannel], ['black']);
	}
}

function addNewMessage(usern, color, msg){
	checkForScrollActive();
	$('#messages').append('<div class="messagewrap"><span class="message"><b style="color:' + color + '">' + usern + ':</b> ' + msg + '</span></div>');
	updateScroll();
}
function addNewInfoMessage(msgs, colors){
	checkForScrollActive();
	var mesg = '';
	for(var i = 0; i < msgs.length; i++){
		mesg += '<span style="color:';
		if(colors[i]){
			mesg += colors[i] + '';
		} else {
			mesg += 'black';
		}
		mesg += ';">' + msgs[i] + '</span>';
	}
	$('#messages').append('<div class="messagewrap"><b><span class="message">'+mesg+'</span></div></b>');
	updateScroll();
}

function checkForScrollActive(){
	var elem = $('#messages');
	if(elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()){
		scrollActive = true;
	} else {
		scrollActive = false;
	}
}
function updateScroll(){
	if(scrollActive){
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
}
