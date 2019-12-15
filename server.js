
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

var client = mqtt.connect("mqtt://192.168.0.107:1883", {username:"huytq",password:"quanghuy@123"});
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
	client.subscribe("Room")
	client.subscribe("Outside")
});
var P2_5 = 0;
var P2_5_out = 0
var PM2_5_Room = 0;
var PM2_5_outside = 0;
function push_data(){
	connection.query('SELECT * FROM NODE1 ORDER BY id DESC limit 10')
		.then(row => {
			row.forEach(function(value) {
				var m_time = value.Date_Time.toString().slice(4,24);
				P2_5 = P2_5 + value.PM2_5;
			});
			var P2_5_data= parseInt(((P2_5/10) / 0.3)*100);
			PM2_5_Room = P2_5_data;
			P2_5 = 0;		
	});
	connection.query('SELECT * FROM NODE2 ORDER BY id DESC limit 10')
		.then(row => {
			row.forEach(function(value) {
				var m_time = value.Date_Time.toString().slice(4,24);
				P2_5_out = P2_5_out + value.PM2_5;
			});
			var P2_5_data_out= parseInt(((P2_5_out/10) / 0.3)*100);
			PM2_5_outside = P2_5_data_out;
			P2_5_out = 0;		
	});
	var time = new Date();
	connection.query('INSERT INTO AQI(PM2_5_room,PM2_5_outside,Date_Time) values(?,?,?)', [PM2_5_Room,PM2_5_outside,time]).then(conn => {
		console.log("Inserted AQI into database");
		console.log("AQI room: " + PM2_5_Room);
		console.log("AQI outside: "+ PM2_5_outside)
	});
	io.sockets.emit('temp', {time:time, P2_5:PM2_5_Room, P2_5_out:PM2_5_outside});
}
push_data();
setInterval(push_data, 5000)

client.on("message", function(topic, message) {
	if(message != "") {
		console.log("topic is: " + topic);
		console.log("message is: " + message);
		if(topic == "Room"){
			data = message.toString();
			a = JSON.parse(data);
			var time = new Date();
			console.log("Date insert: " + time);
			connection.query('INSERT INTO NODE1(Temperature,Humidity,PM2_5,Date_Time) values(?,?,?,?)', [a.Temperature,a.Humidity,a.PM2_5,time]).then(conn => {
			console.log("Inserted data from node1 in room into database");
			});
			io.sockets.emit('temp_hum', {hum:a.Humidity,temp:a.Temperature});
		}
		if(topic == "Outside"){
			data = message.toString();
			a = JSON.parse(data);
			var time = new Date();
			console.log("Date insert: " +time);
			connection.query('INSERT INTO NODE2(Temperature,Humidity,PM2_5,Date_Time) values(?,?,?,?)', [a.Temperature,a.Humidity,a.PM2_5,time]).then(conn => {
			console.log("Inserted data from node2 outside into database");
			});
			io.sockets.emit('temp_hum1', {hum:a.Humidity,temp:a.Temperature});
		}
	}
});

io.on('connection', (socket) => {
	console.log("Someone connectted")
	connection.query('SELECT * FROM AQI')
		.then(row => {
			console.log("Databases: ");
			console.log(row);
			row.forEach(function(value) {
				var m_time = value.Date_Time.toString().slice(4,24);
				io.sockets.emit('temp', {time:time, P2_5:value.PM2_5_room, P2_5_out:PM2_5_outside});
		});
	});
});