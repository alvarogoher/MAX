'use strict';

var Alexa = require('alexa-sdk');
var accountSid = 'AC6dd7881f47154c6fe6934fbcf67c32c2';
var authToken = '6a2e9b5cf042341397d15735b922fff8';
var client = require('twilio')(accountSid, authToken);
const SORRY_MSG = "Sorry, I didn't get that. Please speak loudly and clear. ";
const CALLING_MSG = "Calling... Calling... ";
const CALLING_HELLO_MSG = "Hello, this is an automated call to report an emergency. This device belongs to ";
const CALLING_LIVES_MSG = "and this person lives in ";
const CALLING_BYE_MSG = ". Please, send inmediately an emergency unit, the life of this person might be in danger!";
const RECORDED_CALLING_MSG = "I just made the call!";
const WELCOME_MSG = "Welcome to Max, your Emergency Assistant! ";
const OPTIONS_MSG = "Would you like to set up, delete your information or make a call";
const SET_UP_MSG = "Say 'SET UP' to set up your information";
const NEED_SET_UP_MSG = "You need to set your information up. ";
const NAME_MSG = "Say your name";
const OKAY_MSG = "Okay! ";
const CITY_MSG = "Tell me the name of the city where you live";
const DELE_OR_CALL_MSG = "Now, would you like delete your information or make a call";
const DELETED_MSG = "I have deleted all your personal information. ";
const BYE_MSG = "Alright, bye!";
const TALK_AGAIN_BYE_MSG = "Ok, let\'s talk again soon. Bye!";
const PERMISSIONS_MSG = "Please grant skill permissions to access your device address. "; 
const ADDRESS_MSG = "Say 'find my address' if you want me to find out your address from your Amazon account. ";
const YOU_ARE_IN_MSG = "Your address is: ";
const IM_SORRY_MSG = "I\'m sorry. Something went wrong";
const NO_ADDRESS_MSG = "There is not an input address in your Amazon account";

var handlers = {
    'LaunchRequest': function() {
        var name = this.attributes['name'];
        var message1 = "";
        var message2 = "";
        if (hasValue(name)){
            message1 = WELCOME_MSG + " Are you " + name + " ?";
            message2 = SORRY_MSG + " Are you " + name + " ?";
        } else {
            message1 = WELCOME_MSG + NEED_SET_UP_MSG + SET_UP_MSG;
            message2 = SORRY_MSG + NEED_SET_UP_MSG + SET_UP_MSG;
        }
        this.response.speak(message1)
            .listen(message2);
        this.emit(':responseReady');
    },

    'KnownUserIntent': function() {
        var answer = this.event.request.intent.slots.answer.value;
        var name = this.attributes['name'];
        var messagge1 = "";
        var messagge2 = SORRY_MSG + OPTIONS_MSG;
        if (answer === "yes" || 
            answer === "yup" ||
            answer === "I am" ||
            answer === "confirm" ||
            answer === "sure"){
            messagge1 = OKAY_MSG + " " + "Welcome back " + name + "! " + OPTIONS_MSG;

        } else {
            this.attributes['name'] = "";
            this.attributes['address'] = "";
            messagge1 = OKAY_MSG + NAME_MSG;
        }
        this.response.speak(messagge1)
            .listen(messagge2);
        this.emit(':responseReady');
    },

    'SetUpIntent': function() {
        var set_up_command = this.event.request.intent.slots.set_up_command.value;
        if (set_up_command === "set up"){
            this.response.speak(OKAY_MSG + NAME_MSG)
                .listen(SORRY_MSG + NAME_MSG);
        } else {
            this.response.speak(BYE_MSG);
        }
        this.emit(':responseReady');
    },

    'NameIntent': function() {
        const name = this.event.request.intent.slots.name.value;
        this.attributes['name'] = name;
        this.response.speak(OKAY_MSG + name + ", now: " + ADDRESS_MSG)
             .listen(SORRY_MSG + ADDRESS_MSG);
        this.emit(':responseReady');
    },
  
    'DeviceAddressIntent': function () {
        console.log(JSON.stringify(this.event));
        if (this.event.context.System.user.permissions) {
            const token = this.event.context.System.user.permissions.consentToken;
            const apiEndpoint = this.event.context.System.apiEndpoint;
            const deviceId = this.event.context.System.device.deviceId;
            const das = new Alexa.services.DeviceAddressService();
            das.getFullAddress(deviceId, apiEndpoint, token)
            .then((data) => {
                this.response.speak('<address information>');
                console.log('Address get: ' + JSON.stringify(data));
                var myAddress = "";
                var myMessage = "";
                myAddress = concatenateString (myAddress, data.addressLine1);
                myAddress = concatenateString (myAddress, data.addressLine2);
                myAddress = concatenateString (myAddress, data.addressLine3);
                myAddress = concatenateString (myAddress, data.districtOrCounty);
                myAddress = concatenateString (myAddress, data.city);
                myAddress = concatenateString (myAddress, data.countryCode);
                myAddress = concatenateStringFinal (myAddress, "Postal code: " + data.postalCode);
                this.attributes['myAddressLine1'] = blanckReplacement(data.addressLine1);
                this.attributes['myAddressLine2'] = blanckReplacement(data.addressLine2);
                this.attributes['myAddressLine3'] = blanckReplacement(data.addressLine3);
                this.attributes['mydistrictOrCounty'] = blanckReplacement(data.districtOrCounty);
                this.attributes['myCity'] = blanckReplacement(data.city);
                this.attributes['myCountryCode'] = blanckReplacement(data.countryCode);
                this.attributes['myPostalCode'] = blanckReplacement(data.postalCode);
                if (myAddress == "(Postal code: ." || data.addressLine1 == null || !hasValue(myAddress)){
                    myMessage = NO_ADDRESS_MSG;
                } else {
                    myMessage = YOU_ARE_IN_MSG + myAddress;
                    this.attributes['address'] = myAddress;
                }
                this.response.speak(myMessage + "Now: " + OPTIONS_MSG).listen(SORRY_MSG + OPTIONS_MSG);
                this.emit(':responseReady');
            })
            .catch((error) => {
                this.response.speak(IM_SORRY_MSG);
                this.emit(':responseReady');
                console.log(error.message);
            });
        } else {
            this.response.speak(PERMISSIONS_MSG);
            const permissions = ['read::alexa:device:all:address'];
            this.response.askForPermissionsConsentCard(permissions);
            console.log("Response: " + JSON.stringify(this.response));
            this.emit(':responseReady');
        }
    },
    
    'CallIntent': function() {
        if (Object.keys(this.attributes).length === 0) {
            this.response.speak(NEED_SET_UP_MSG + SET_UP_MSG).listen(SORRY_MSG + SET_UP_MSG);
        } else {
            var name = this.attributes['name'];
            var address = this.attributes['address'];
            var myname = hasValue(name);
            var myaddress = hasValue(address);
            if (myname && myaddress){
 /*               this.response.speak(CALLING_MSG + 
                    CALLING_HELLO_MSG + 
                    name + " " +
                    CALLING_LIVES_MSG + 
                    address + 
                    CALLING_BYE_MSG);*/
                placeCall(this.attributes['name'], 
                	this.attributes['myAddressLine1'],
                	this.attributes['myAddressLine2'],
                	this.attributes['mydistrictOrCounty'],
                	this.attributes['myCity'],
                	this.attributes['myCountryCode'],
                	this.attributes['myPostalCode'],
                	this.attributes['address']);
                this.response.speak(RECORDED_CALLING_MSG);
            } else {
                this.response.speak(NEED_SET_UP_MSG + SET_UP_MSG)
                    .listen(SORRY_MSG + SET_UP_MSG);
            }
        }
        this.emit(':responseReady');
    },

    'DeleteIntent': function() {
        this.attributes['name'] = null;
        this.attributes['address'] = null;
        this.response.speak(DELETED_MSG + "Now: " + NEED_SET_UP_MSG + SET_UP_MSG)
            .listen(SORRY_MSG + OPTIONS_MSG);
        this.emit(':responseReady');
    },

    'AMAZON.StopIntent': function() {
        this.response.speak(TALK_AGAIN_BYE_MSG);
        this.emit(':responseReady');
    },

    'AMAZON.CancelIntent': function() {
        this.response.speak(TALK_AGAIN_BYE_MSG);
        this.emit(':responseReady');
    },

    'SessionEndedRequest': function() {
        console.log('session ended!');
        this.emit(':saveState', true);
    }
};

var hasValue = function(value) {
    if (value != null && value != "") {
        return true;
    } else {
        return false;
    }
};

var concatenateString = function(stringResult, stringX) {
    if (stringX == null || stringX == "") {
        return stringResult;
    } else {
        return stringResult + stringX + ", ";
    }
};

var concatenateStringFinal = function(stringResult, stringX) {
    if (stringX == null || stringX == "") {
        return stringResult + ".";
    } else {
        return stringResult + stringX + ".";
    }
};

var blanckReplacement = function (myString) {
	if (hasValue(myString)){
		return myString.replace(/ /g, "_");
	} else {
		return myString;
	}
};

/*
// STANDARD PHONE FUNCTION
var placeCall = function(name, line1, line2, district, city, country, postalcode, address){
	// PHONE CALL
	var messageURL1 = "https://handler.twilio.com/twiml/EHf5da94075bd705e48b82c268498dd463";
	var messageURL2 = 'https://handler.twilio.com/twiml/EH60a4d72c16f15fb933fedced6cf11661?Name='+name+'&Line1='+line1+'&Line2='+line2+'&District='+district+'&City='+city+'&Country='+country+'&Postal='+postalcode;
	client.calls.create({
		url: messageURL2,
		to: '+16302929417',
		from: '+13126266543'
	}), function(err, call){
		if(err){
			console.log(err);
		} else {
			console.log(call.sid);
		}
	}


	// DEMO 2 calls
	client.calls.create({
		url: messageURL2,
		to: '+17735587866',
		from: '+13126266543'
	}), function(err, call){
		if(err){
			console.log(err);
		} else {
			console.log(call.sid);
		}
	}


	// SMS + DEMO
	var bodyMessage = 'Hello, this is an automated message to report an emergency. This device belongs to '+
	name+
	' and this person lives in '+
	address+
	' Please, send inmediately an emergency unit, the life of this person might be in danger!';
	client.messages
      .create({from: '+13126266543', body: bodyMessage, to: '+16302929417'})
      .then(message => console.log(message.sid))
      .done();


	client.messages
      .create({from: '+13126266543', body: bodyMessage, to: '+17735587866'})
      .then(message => console.log(message.sid))
      .done();

};*/

// SIP CALL FUNCTION
var placeCall = function(name, line1, line2, district, city, country, postalcode, address){
	client.calls.create({
		url: 'https://handler.twilio.com/twiml/EH60a4d72c16f15fb933fedced6cf11661?Name='+name+'&Line1='+line1+'&Line2='+line2+'&District='+district+'&City='+city+'&Country='+country+'&Postal='+postalcode,
		to: 'sip:2001@64.131.109.38',
		from: '1001'
	})
	  .then(call => console.log(call.sid))
	  .done();
};

exports.handle = function(event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.dynamoDBTableName = 'UserInfoTable';
    alexa.registerHandlers(handlers);
    alexa.execute();
};