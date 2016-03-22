var express = require('express');
var bodyParser = require('body-parser');

var port = 1337;
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
app.get('/chat', function(req,res){
	var user = req.params.user;
	res.render('page', {username : user});
});

var io = require('socket.io').listen(app.listen(port));
io.on('connection', function(socket){
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
	socket.on('join', function(data){
		console.log(data);
	});
});

/*

	console.log('uusi yhteys');
	socket.on('join', function(data){
		console.log('käyttäjä liittyi kanavaan');
		//var msg = 'Käyttäjä liittyi kanavalle ' + data.channel + ' käyttäjänimellä: '+ data.username;
		//console.log(msg);
		//io.sockets.emit('message', {channel : data.channel, username : data.username, message : msg});
	});
	socket.on('send', function(data) {
		console.log('uusi viesti');
		//io.sockets.emit('message', { channel : data.channel, username : data.username, message : data.message });
	});
});
*/
