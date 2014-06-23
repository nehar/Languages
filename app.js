var express = require('express');
var app = express();
var partials = require('express-partials')
var path = require('path');
var pg = require('pg');
var connectionString = process.env.DATABASE_URL;

app.configure(function () {
    app.use(partials());
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.use(express.logger('dev'));
    app.use(express.static(path.join(__dirname, '/public')));

    app.use(express.bodyParser());
    app.use(app.router);
});

app.get('/countries', function (req, res) {
  var client = new pg.Client(connectionString);
  client.connect(function(err) {
    if(err) {
      res.render("error", {
      header: "Countries and languages",
      });
	  return console.error('Could not connect to postgres', err);
    } 
    client.query("SELECT country.code, country.name, country.continent, country.population, countryLanguage.language, countryLanguage.isofficial, countryLanguage.percentage FROM countryLanguage  INNER JOIN country ON countryLanguage.countrycode = country.code WHERE isofficial = 'true' ORDER BY country.continent ASC, country.name ASC, countryLanguage.percentage DESC", function (err, result) {
        if(err) {
            return console.error('Error running query', err);
        }
		if (result == undefined) {
            console.log("No results for the query");
        } else {
            res.render("languages", {
                header: "Official languages of countries",
                country: result.rows
            });
        }
        client.end();
    });
  });
});

app.get('/country/:countryCode', function (req, res) {
    var code = req.params.countryCode.substring(1);
    var client = new pg.Client(connectionString);
    client.connect(function(err) {
	if(err) {
          res.render("error", {
          header: "Countries and languages",
          });
          return console.error('Error running query', err);
    }
    client.query("SELECT country.name, country.population, countryLanguage.language, countryLanguage.isofficial, countryLanguage.percentage FROM countryLanguage  INNER JOIN country ON countryLanguage.countrycode = country.code WHERE country.code = '" + code + "'", function (err, result) {
		if(err) {
            return console.error('Error running query', err);
        }
		if (result == undefined) {
            console.log("No results for the query");
        } else {
            res.render("country", {
                header: "Language use in " + result.rows[0].name,
                data: result.rows
            });
        }
        client.end();
    });
  });
});

app.get('/groupedCountries', function (req, res) {
    var client = new pg.Client(connectionString);
    client.connect(function(err) {
	  if(err) {
          res.render("error", {
          header: "Countries and languages",
          });
          return console.error('Error running query', err);
      }
    client.query("SELECT countryLanguage.language, sum(country.population * countryLanguage.percentage / 100) AS population, sum(country.population * countryLanguage.percentage / 100)/(SELECT sum(population) from country)*100 AS percentage  FROM countryLanguage  INNER JOIN country ON countryLanguage.countrycode = country.code GROUP BY countryLanguage.language ORDER BY population DESC, countryLanguage.language ASC", function (err, result) {
		if(err) {
            return console.error('Error running query', err);
        }
		if (result == undefined) {
            console.log("No results for the query");
        } else {
            res.render("groupedCountries", {
                header: "Global Language use",
                data: result.rows
            });
        }
        client.end();
    });
  });
});

app.get('/', function (req, res) {
    res.render("index", {
        header: "Countries and languages"
    });
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});