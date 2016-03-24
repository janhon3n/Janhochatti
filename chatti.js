var port = 1337;
var maxMessagesPerChannel = 100;

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

var channels = ['lobby', 'testikanava', 'koodikanava'];

var io = require('socket.io').listen(app.listen(port));
io.on('connection', function(socket){

	socket.on('login', function(data){
		var username = validator.escape(data.username + '');
		var color = validator.escape(data.color + '');
		console.log(username + ' kirjautui chattiin');
		socket.username = username;
		socket.color = color;
		socket.emit('updateChannels', {channellist : channels});
	});

	socket.on('disconnect', function(){
		console.log(socket.username + ' disconnected');
	});

	socket.on('create', function(data){
		var channel = validator.escape(data.channel + '');
		var msg = socket.username + ' created a new channel ' + channel;
		console.log(msg);
		channels.push(channel);
		socket.join(channel);

		io.to(channel).emit('info', {channel : channel, color : 'black', message : msg});
		io.emit('updateChannels', {channellist : channels});
	});

	socket.on('join', function(data){
		var channel = validator.escape(data.channel + '');

		if(channels.indexOf(channel) == -1){
			channels.push(channel);
		}
		socket.join(channel);
		var msg = socket.username + ' liittyi kanavalle ' + channel;
		io.to(channel).emit('info', {channel : channel, color : 'black', message : msg});
		console.log(msg);
	});

	socket.on('leave', function(data){
		var channel = validator.escape(data.channel + '');
		console.log(socket.username + ' left channel ' + channel);
		socket.leave(channel);

		socket.emit('updateChannels', {channellist : channels});
	});

	socket.on('post', function(data){
		var channel = validator.escape(data.channel + '');
		var msg = validator.escape(data.message + '');
		console.log(channel + '- ' + socket.username + ': ' + msg);
		io.to(channel).emit('message', { channel : channel, username : socket.username, color : socket.color, message : msg });
	});
});



function findClientsSocket(roomId, namespace) {
	var res = [],
		ns = io.of(namespace ||"/"); // the default namespace is "/"
	if (ns) {
		for (var id in ns.connected) {
			if(roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId) ;
				if(index !== -1) {
					res.push(ns.connected[id]);
				}
			}
			else {
				res.push(ns.connected[id]);
			}
		}
	}
	return res;
}
