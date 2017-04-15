var express = require('express');
var http = require('http');
var app = express();
var parseString = require("xml2js").parseString;
var request = require('request');
var handlebars = require('express-handlebars').create({
    default: 'main'
});
var db = null;


app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//set port
var port = (process.env.PORT || 8010);
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
            
            //Insert values needed to dipslay into an array.
            values.push(currentGlucose);
            values.push(currentDirection);
            values.push(dateOfReading);
            
            console.log("inside func " + values);
            console.log("up " + val);
            
//            var test = val.concat(values);
//            
//            console.log("test " + test);
            
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




//Select all attributes from form
app.get('/display', function (req, res, next) {
    var context = {};
    context.sentData = req.query;
    
    console.log(context.sentData.current);
    console.log(context.sentData.target);
    console.log(context.sentData.sensitivity);
    console.log(context.sentData.carbratio);

    
    
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
    
    var nSkittles = Math.round((target - current) / ((inSensitivy/carbRatio) * 0.88));
    
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

//Select all attributs from Leads Table and displays it in a Table
app.get('/search-leads', function (req, res, next) {
    var context = {};
    context.sentData = req.query;
    //Query to select all attributes mysql syntax
    mysql.pool.query("Select * from danielleads", function (err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        context.results = JSON.stringify(rows);
        //Puts all rows in an array (leads)
        var leads = [];
        for (var i = 0, len = rows.length; i < len; i++) {
            leads.push(rows[i]);
        }
        //We pass the array to handlebars and display it.
        context.results = leads;
        res.render('leads', context);
    });
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