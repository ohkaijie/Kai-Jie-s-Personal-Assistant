var token = "ENTER_FACEBOOK_PAGE_ACCESS_TOKEN_HERE"
var apiAiToken = "ENTER_API.AI_CLIENT_ACESS_TOKEN_HERE"

var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
//Include Api.AI API NPM
var apiai = require('apiai');

//Include User library
var userscript = require('./userscript');

//Include Api.API API library
//var apiaiIndex = require('./apiaiIndex');
//Not used for now

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am an AI created by Kai Jie')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
		console.log('sender id: '+sender);
        if (event.message && event.message.text) {
            text = event.message.text
            if (text === 'Generic') {
                sendGenericMessage(sender)
                continue
            }else if (text === 'Button') {
				sendButtonMessage(sender)
                continue
			}else if (text === 'Image') {
				sendImageMessage(sender)
                continue
			}else if (text === 'Test') {
				ReplyMsg = userscript.processtext(1);
				sendTextMessage(sender, ReplyMsg);
				continue
			}else {
				//ReplyMsg = apiaiIndex.apiAiQuery(text);
				//sendTextMessage(sender,ReplyMsg);
				//Not Working!
				
				//Integrate to api.ai API 
				var app = apiai(apiAiToken);
				var apiAiRequest = app.textRequest(text);
				apiAiRequest.on('response', function(response) {
					console.log(response.result.fulfillment.speech);
					sendTextMessage(sender, response.result.fulfillment.speech.substring(0, 300)); //String Limit - because length of param message [text] send to messenger must be less than or equal to 320
					if(response.result.fulfillment.speech.length>300)
						sendTextMessage(sender, response.result.fulfillment.speech.substring(300, 600));
					if(response.result.fulfillment.speech.length>600)
						sendTextMessage(sender, response.result.fulfillment.speech.substring(600, 1200));
				});
				apiAiRequest.on('error', function(error) {
					console.log(error);
				});
				apiAiRequest.end()
				continue
			}
			
            sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));
        }
        if (event.postback) {
            text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
            continue
        }
    }
    res.sendStatus(200)
})



function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
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

function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
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

function sendButtonMessage(sender) {
    messageData = {
		"attachment":{
		"type":"template",
		"payload":{
			"template_type":"button",
			"text":"What do you want to do next?",
			"buttons":[
			  {
				"type":"web_url",
				"url":"https://petersapparel.parseapp.com",
				"title":"Show Website"
			  },
			  {
				"type":"postback",
				"title":"Start Chatting",
				"payload":"USER_DEFINED_PAYLOAD"
			  }]
			}
		}
	}
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

function sendImageMessage(sender) {
    messageData = {
		"attachment":{
		"type":"image",
		"payload":{
        "url":"https://petersapparel.parseapp.com/img/shirt.png"
		}
		}
	}
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


    
