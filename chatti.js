var port = 1337;
var maxMessagesPerChannel = 100;


var express = require('express');
var bodyParser = require('body-parser');

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
		console.log(data.username + ' kirjautui chattiin');
		socket.username = data.username;
		socket.color = data.color;
		socket.emit('updateChannels', {channellist : channels});
	});

	socket.on('disconnect', function(){
		console.log(socket.username + ' disconnected');
	});

	socket.on('create', function(data){
		console.log(socket.username + ' created a new channel ' + data.channel);
		channels.push(data.channel);
		socket.join(data.channel);
	});

	socket.on('join', function(data){
		var channel = data.channel;

		if(channels.indexOf(channel) == -1){
			channels.push(channel);
		}
		socket.join(channel);
		var msg = socket.username + ' liittyi kanavalle ' + channel;
		io.emit('info', {channel : channel, color : socket.color, message : msg});
		console.log(msg);
	});

	socket.on('leave', function(data){
		var channel = data.channel;
		socket.leave(channel);		
	});

	socket.on('post', function(data){
		var channel = data.channel;
		console.log(data.channel + '- ' + socket.username + ': ' + data.message);
		io.to(channel).emit('message', { channel : channel, username : socket.username, color : socket.color, message : data.message });
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
