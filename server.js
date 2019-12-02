// Imports
const express = require('express');
const businessUnitRouter = require('./route/businessUnitRouter');

// Instance server
const server = express();
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// Routes
server.use('/', (req, res, next) => { // all api return content type json
	res.setHeader('Content-Type', 'application/json');
	res.locals = {}; // returned information
	next()
});

server.use('/business-unit/', businessUnitRouter); // all routes about business unit

// Error
server.use((req, res, next) => {
	if (typeof res.locals.result !== "undefined") {
		return next(); // If we got result we skip error middleware
	}
	if (res.locals.error) {// controller's error
		res.status(500).json({success: false, error: res.locals.error});
	} else { // routing error
		res.status(404).json({success: false});
	}
});

// Success
server.use((req, res) => {
	const ret = {success: true};
	if (res.locals.result) {
		ret.data = res.locals.result;
	}
	res.status(200).json(ret);
});

// Launch server
server.listen('80');
