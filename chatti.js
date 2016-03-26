var port = 1337;
var defaultChannel = 'lobby';

var express = require('express');
var bodyParser = require('body-parser');
var validator = require('validator');

console.log("Aloitetaan chattiseveri portissa "+port);
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname+'/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);


app.get('/', function(req,res){
	console.log('Uusi käyttäjä saapui sivulle');
	res.render('login');
});

var channels = [defaultChannel];
var clients = [];

var io = require('socket.io').listen(app.listen(port));
io.on('connection', function(socket){
	socket.channelsOn = [];
	clients.push(socket);

	socket.on('login', function(data, callback){
		var username = validator.escape(data.username + '');
		var color = validator.escape(data.color + '');
		console.log(username + ' kirjautui chattiin');
		socket.username = username;
		socket.color = color;
		callback();
		joinChannel(socket, defaultChannel);
	});

	socket.on('create', function(data){
		var channel = validator.escape(data.channel + '');
		channels.push(channel);
		socket.channelsOn.push(channel);
		console.log(socket.username + ' created a new channel ' + channel);
		socket.join(channel);

		for(var i = 0; i < clients.length; i++){
			clients[i].emit('updateChannels', {channelson : clients[i].channelsOn, channelsnoton : getChannelsNotOn(clients[i].channelsOn)});
		}

		var msg = [];
		var clrs = [];
		msg[0] = socket.username;
		clrs[0] = socket.color;
		msg[1] = ' created a new channel ';
		msg[2] = channel;
		clrs[2] = 'gray';
		io.to(channel).emit('info', {channel : channel, messages : msg, colors : clrs});
	});

	socket.on('join', function(data){
		var channel = validator.escape(data.channel + '');
		joinChannel(socket, channel);
	});

	socket.on('leave', function(data){
		var channel = validator.escape(data.channel + '');
		console.log(socket.username + ' left channel ' + channel);

		//remove channel from clients list of active channels
		var ind = socket.channelsOn.indexOf(channel);
		if(ind != -1){
			socket.channelsOn.splice(ind,1);
		}
		socket.leave(channel);

		if(channelIsEmpty(channel)){
			removeChannel(channel);
			for(var i = 0; i < clients.length; i++){
				clients[i].emit('updateChannels', {channelson : clients[i].channelsOn, channelsnoton : getChannelsNotOn(clients[i].channelsOn)});
			}
		} else {
			socket.emit('updateChannels', {channelson : socket.channelsOn, channelsnoton : getChannelsNotOn(socket.channelsOn)});
		}
	});

	socket.on('disconnect', function(){
		var ind = clients.indexOf(socket);
		if(ind != -1){
			clients.splice(ind, 1);
		}
		//check if channels client left are left empty => delete them
		for(var i = 0; i < socket.channelsOn.length; i++){
			if(channelIsEmpty(socket.channelsOn[i])){
				removeChannel(socket.channelsOn[i]);
			}
		}
		for(var i = 0; i < clients.length; i++){
			clients[i].emit('updateChannels', {channelson : clients[i].channelsOn, channelsnoton : getChannelsNotOn(clients[i].channelsOn)});
		}

		console.log(socket.username + ' disconnected');
	});

	socket.on('post', function(data){
		var channel = validator.escape(data.channel + '');
		var msg = validator.escape(data.message + '');
		console.log(channel + '- ' + socket.username + ': ' + msg);
		io.to(channel).emit('message', { channel : channel, username : socket.username, color : socket.color, message : msg });
	});
});

function joinChannel(socket, channel){
	console.log(socket.username + ' joined channel ' + channel);

	socket.join(channel);
	socket.channelsOn.push(channel);

	socket.emit('updateChannels', {channelson : socket.channelsOn, channelsnoton : getChannelsNotOn(socket.channelsOn)});

	var msg = [];
	var clrs = [];
	msg[0] = socket.username;
	clrs[0] = socket.color;
	msg[1] = ' joined the channel';

	io.to(channel).emit('info', {channel : channel, messages : msg, colors : clrs});
}

function getChannelsNotOn(channelsOn){
	var channelsNotOn = [];
	for(var i = 0; i < channels.length; i++){
		if(channelsOn.indexOf(channels[i]) < 0){
			channelsNotOn.push(channels[i]);
		}
	}
	return channelsNotOn;
}

function channelIsEmpty(channel){
	console.log('checking if '+channel+' is empty:');
	for(var i = 0; i < clients.length; i++){
		if(clients[i].channelsOn.indexOf(channel) >= 0){
			console.log('no');
			return false;
		}
	}
	console.log('yes');
	return true;
}
function removeChannel(channel){
	ind = channels.indexOf(channel);
	if(ind != -1){
		channels.splice(ind, 1);
	}
	console.log('channels now:');
	console.log(channels);
}
