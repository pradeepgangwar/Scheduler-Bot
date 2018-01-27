'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
var pg = require("pg");

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

//DB

var conString = "postgres://wxjvrhqrbqjros:a24eabb637dc812603e6b9b927f78fb15d1be6cd5196f2c2bb11f4695871fca2@ec2-54-225-230-142.compute-1.amazonaws.com:5432/d5ot44f3mlrilt";
var client = new pg.Client(conString);
client.connect();


client.query("CREATE TABLE IF NOT EXISTS userData(firstname varchar(100))");


app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id

		request({
			url: "https://graph.facebook.com/v2.6/" + sender,
			qs: {
				access_token : token,
				fields: "first_name"
			},
			method: "GET",

		}, function(error, response, body) {
			if(error){
				console.log("error getting username")
			} else{
				var bodyObj = JSON.parse(body)
				let name = bodyObj.first_name
				if (event.message && event.message.text) {
					let text = event.message.text
					if(text == "Hi" || text == "Hello") {
						sendTextMessage(sender, "Hi");
						sendTextMessage(sender, name);
						sendTextMessage(sender, "Whatsup?");
						var query = client.query("INSERT INTO userData(firstname) values($1)", [name]);
					}
				}
			}
		})
	}
	res.sendStatus(200)
})

const token = process.env.FB_PAGE_ACCESS_TOKEN

function sendTextMessage(sender, text) {
	let messageData = { text:text }
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}



// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})