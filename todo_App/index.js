var express = require('express');
var app = express();
var mongoose = require('mongoose');

var uristring = process.env.MONGOLAB_URI ||
		process.env.MONGOHQ_URI ||
		'mongodb://localhost/todo';

var port = process.env.PORT || 5000;

mongoose.connect(uristring, function (err, res) {
	if (err) {
		console.log('ERROR connecting to: ' + uristring + '. ' + err);
	}
	else {
		console.log('Succeed connected to: ' + uristring);
	}
});

app.configure(function() {
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
});

//define model
var Todo = mongoose.model('Todo', {text : String});

//routes
app.get('/api/todos', function(req, res) {
	Todo.find(function(err, todos) {
		if (err) {
			res.send(err);
		}
		res.json(todos);
	});
});

app.post('/api/todos', function(req, res) {
	Todo.create({
		text : req.body.text,
		done : false
	}, function(err, todo) {
		if (err) {
			res.send(err);
		}
		Todo.find(function(err, todos) {
			if (err) {
				res.send(err);
			}
			res.json(todos);
		});
	});
});

app.delete('/api/todos/:todo_id', function(req, res) {
	Todo.remove({_id : req.params.todo_id}, function(err, todo) {
		if (err) {
			res.send(err);
		}
		Todo.find(function(err, todos) {
			if (err) {
				res.send(err);
			}
			res.json(todos);
		});
	});
});

app.get('*', function(req, res) {
	res.sendfile('./public/index.html');
});


app.listen(port);
console.log('App listening on port ' + port);


