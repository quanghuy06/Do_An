
var mariadb = require('mariadb');
var mqtt = require('mqtt');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var url = require('url');
var fs = require('fs');
app.set('view engine', 'html');
app.set('views', __dirname);
app.engine('html', require('ejs').renderFile);


var client = mqtt.connect("mqtt://localhost:1883", {username:"huytq",password:"quanghuy@123"});
console.log("connected flag " + client.connected);

client.on("connect", function(){
	console.log("connected MQTT"+ client.connected);
});

var connection = mariadb.createPool({
	host	: 'localhost',
	user	: 'root',
	database: 'wsn'
});

connection.getConnection()
	.then(conn => {
		console.log("Connected Mariadb");
		conn.release(); //release connection
	})
	.catch(err => {
		console.log("Not connected due to erro: " +err);
	});

var server = app.listen(3000, () => {
	console.log("Connect to request on port 3000...");
})

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use((request, response, next) => {
  console.log(request.headers)
  next()
})
app.use((request, response, next) => {
	request.chance = Math.random()
	next()
})

//send index.html page on GET /
app.use(express.static('public'));

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	console.log("Dang nhap:");
	console.log(username);
	console.log(password)
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password]).then(rows => {
			console.log("Database: ");
			console.log(rows);
			console.log("row.length: " +rows.length);
			if (rows.length > 0) {
				request.session.loggedin = true;
				console.log("loggedin: " + request.session.loggedin);
				request.session.username = username;
				console.log("session.username: " + request.session.username);
				response.redirect('/home');
				console.log("Duong dan: ");
			} else {
				response.send('No Connect Account!');

			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/home', (request, response) => {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/index.html'));
	}else {
		response.send('Please login to view this page!!');
		response.end();
	}
	
})

//Bind socket.io to our express server
var io = require('socket.io')(server);

function publish(topic,msg){
	console.log("Publishing: ",msg);
	if(client.connected == true){
		client.publish(topic,msg);
	}
}
 
client.on("connect", function() {
	client.subscribe("DHT11")
});
var CO = 0;
function push_data(){
	connection.query('SELECT * FROM SENSORS ORDER BY id DESC limit 2')
		.then(row => {
			row.forEach(function(value) {
				var m_time = value.Date_and_Time.toString().slice(4,24);
				var CO = CO + value.CO;
				console.log(CO);
				//io.sockets.emit('temp', {time:m_time, P2_5:value.P2_5, hum:value.Humidity,CO:value.CO, SO2:value.SO2, temp:value.Temperature});
			});
			
	});
}
push_data();
setInterval(push_data, 5000)

// client.on("message", function(topic, message) {
// 	//var Temp;
// 	//var Hum;
// 	//var Illumination;
// 	var i=0;
// 	if(message != "") {
// 		console.log(i);
// 		i++;
// 		console.log(i);
// 		console.log("topic is: " + topic);
// 		console.log("message is: " + message);
// 		data = message.toString();
// 		a = JSON.parse(data);
// 		// var CO = parseInt((a.CO / 40)*100);
// 		// console.log("gia tri AQI: ");
// 		// console.log(CO);
// 		// var SO2= parseInt((a.SO2 / 0.5)*100);
// 		// console.log(SO2);
// 		// var P2_5= parseInt((a.P2_5 / 0.3)*100);
// 		// console.log(P2_5);
// 		var time = new Date();
// 		console.log("Date insert: " +time);
// 		connection.query('INSERT INTO SENSORS(Temperature,Humidity,CO,SO2,P2_5,Date_and_Time) values(?,?,?,?,?,?)', [a.Temperature,a.Humidity,a.CO,a.SO2,a.P2_5,time]).then(conn => {
// 		console.log("Inserted");
// 		});
// 		io.sockets.emit('temp_hum', {hum:a.Humidity,temp:a.Temperature});	
// 	}
// });

// io.on('connection', (socket) => {
// 	console.log("Someone connectted")
// 	connection.query('SELECT * FROM AQI')
// 		.then(row => {
// 			console.log("Databases: ");
// 			console.log(row);
// 			row.forEach(function(value) {
// 				var m_time = value.Date_and_Time.toString().slice(4,24);
// 				io.sockets.emit('temp', {time:m_time, P2_5:value.P2_5, hum:value.Humidity,CO:value.CO, SO2:value.SO2, temp:value.Temperature});
// 		});
// 	});
// });