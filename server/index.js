const keys = require("./keys");

// Express App Setup
// (set up libraries)
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Create new express app
// This app is the object that will receive
// and respond to any http requests that
// are coming in or going back to the react application
const app = express();
// wire up cors -> cross origin resource sharing
// allow us to make requests from one domain that
// the application will be running on to a completely
// different domain (or different port in this case)
// that the express api is hosted on
app.use(cors());
// parse incoming requests from the incoming application
// and turn the body of the post request into a json
// value that our express api can easily work with
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
	user: keys.pgUser,
	host: keys.pgHost,
	port: keys.pgPort,
	database: keys.pgDatabase,
	password: keys.pgPassword
});
// listener -> waits for connection before creating table
// anytime you connect to a sql type db you have to create at least one table
pgClient.on("connect", () => {
	pgClient
		.query("CREATE TABLE IF NOT EXISTS values (number INT)")
		.catch(err => console.log(err));
});

// Redis Client Setup
const redis = require("redis");
const redisClient = redis.createClient({
	host: keys.redisHost,
	port: keys.redisPort,
	retry_strategy: () => 1000
});
// Making these duplicates -> according the redis
// documentation for this js library, if we every have a
// client that's listening or publishing information on redis
// we have to make a duplicate connection because when
// a connection is turned into a connection that is going
// to listen, subscribe or publish information if cannot be used
// for other purposes.
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get("/", (req, res) => {
	req.send("Hi");
});

app.get("/values/all", async (req, res) => {
	const values = await pgClient.query("Select * from values");
	// just send back relevant information
	res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
	// get hash
	// redis library for nodeJS doesn't have out of the box
	// promise support which is why we have to use callbacks
	// as opposed to making use of the nice aysych like line 65
	// await syntax
	redisClient.hgetall("values", (err, values) => {
		res.send(values);
	});
});

app.post("/values", async (req, res) => {
	const index = req.body.index;

	if (parseInt(index) > 40) {
		return res.status((422).send("Index too high!"));
	}

	redisClient.hset("values", index, "Nothing yet!");
	// will publish a new insert event for that index
	// be sent over to the worker process
	// wake up the worker process and say it's
	// going to wake up the worker process and
	// say its time to pull out a new value out of
	// redis and start calculating a value for it
	redisPublisher.publish("insert", index);
	pgClient.query("Insert into values(number) VALUES($1)", [index]);

	res.send({ working: true });
});

// The server is watching/listening for traffic on port 5000
app.listen(5000, err => {
	console.log("Listening");
});
