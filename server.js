var express = require('express');
var http = require('http');
var app = express();
var parseString = require("xml2js").parseString;
var request = require('request');
var handlebars = require('express-handlebars').create({
    default: 'main'
});

var dateFormat = require('dateformat');

var accountSid = 'AC3192baa49f03c13e114699766cc7a7b9';
var authToken = '6e9df1ea3aa70727c2442aec5fd244f7';
var client = require('twilio')(accountSid, authToken);


app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//set port
var port = (process.env.PORT || 8000);
//Allows me to use stylesheets in handlebars.
app.use(express.static('public'));


//HOME PAGE
app.get('/', function (req, res) {
        
  res.render('home');

});


//Calculator
app.get('/display', function (req, res) {    
    var context = {};
    var val = [];
    
    request('https://daccarett93.herokuapp.com/api/v1/profile.json', function (error, responses, body) {
        if (!error && responses.statusCode == 200) {  
            var results = JSON.parse(body);
            
            //Variables for ratio & sensitivity
            var carbratio = results[0].store.Default.carbratio[0].value;
            var insulin_sensitivity = results[0].store.Default.sens[0].value;
            console.log("carb-ratio: " + carbratio);
            console.log("sensitivity: " + insulin_sensitivity);
            
            //Insert values needed to dipslay into an array.
            val.push(carbratio);
            val.push(insulin_sensitivity);
            getNS();
            console.log("insidedasdas " + context.results);
            
        }
    });
    
    function getNS() {
    var context = {};
    var values = []; 
    request('https://daccarett93.herokuapp.com/api/v1/entries.json?count=1', function (error, responses, body) {
        if (!error && responses.statusCode == 200) {  
            var entries = JSON.parse(body);
            
            //variables for current level
            var currentGlucose = entries[0].sgv;
            var currentDirection = entries[0].direction;
            var dateOfReading = entries[0].dateString;
            console.log("current: " + currentGlucose);
            console.log("direction: " + currentDirection);
            console.log("date of reading: " + dateOfReading);
            var dateTime = dateFormat(dateOfReading, "m/d/yy, h:MM TT");
            console.log("dateTime : " + dateTime);
            //Insert values needed to dipslay into an array.
            
//↑	\u2191 SingleUp
//→	\u2192 Flat
//↓	\u2193 SingleDown
//↗ \x2197 FortyFiveUp
//↘ \x2198 FortyFiveDown
//⇈ \x21c8 DoubleUp
//⇊ \x21cA DoubleDown                
    if(currentDirection === 'Flat'){
        currentDirection = '→';
    }
    if(currentDirection === 'SingleUp'){
        currentDirection = '↑';
    }
        if(currentDirection === 'SingleDown'){
            currentDirection = '↓';
    }
        if(currentDirection === 'FortyFiveUp'){
            currentDirection = '↗';
    }
        if(currentDirection === 'FortyFiveDown'){
            currentDirection = '↘';
    }
        if(currentDirection === 'DoubleUp'){
            currentDirection = '⇈';
    }
        if(currentDirection === 'DoubleDown'){
            currentDirection = '⇊';
    }
         if(currentDirection === 'NONE'){
            currentDirection = '';
    }
            values.push(currentGlucose);
            values.push(currentDirection);
            values.push(dateTime);
            
            console.log("inside func " + values);
            console.log("up " + val);
        
            
            if(val.length != 0){
                var test = val.concat(values);
                console.log("test " + test);
                context.results = test;
                res.render('display', context);
            }
            

            
        }
        console.log("out func " + values);
        return values;
    });
};

});



app.get('/displayguest', function (req, res) {    
    res.render('displayguest');
});


//API RESULTS (FORM AND MYSQL MANIPULATION)
app.get('/eval', function (req, res) {
    var context = {};
    var levels = [];
    
    context.sentData = req.query;
    var current = context.sentData.current;
    var target = context.sentData.target;
    var inSensitivy = context.sentData.sensitivity;
    var carbRatio = context.sentData.carbratio;
    var latitude = context.sentData.lat;
    var longitude = context.sentData.long;
    
    var nSkittles = Math.round((target - current) / ((inSensitivy/carbRatio) * 0.88));
    
    //get geolocation
    console.log(latitude + ' ' + longitude);
    
    var location = 'https://www.google.com/maps?q=' + latitude + ',' + longitude;
    
    //Sends SMS Text If Sugar gets to low
            console.log("current glucose: " + current);
            if(current <= 40){
                
                client.sendMessage({
                   to: '+12095059520',
                  from: '+12092088147',
                  body: 'glucose level is: ' + current + ' location is: ' + location    
                }, function(err, message){
                    if(err) {
                        console.log(err);
                    } else {
                        console.log(message.sid);
                    }
                });
            }
    
    levels.push(current);
    levels.push(target);
    levels.push(nSkittles);
    context.results = levels;
    //Display and render api selected values to be displayed.
    console.log(context.sentData.current);
    console.log(context.sentData.target);
    console.log(nSkittles);
    res.render('results', context);
                
});



//NOT FOUND
app.use(function (req, res) {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
});
//SERVER ERROR
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.send('500 - Server Error');
});
app.listen(port, function () {
    console.log("app running")
});