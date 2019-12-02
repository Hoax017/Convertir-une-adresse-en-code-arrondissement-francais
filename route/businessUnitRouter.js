// Imports
const express = require('express');
const router = express.Router();
const businessUnitCtrl = require('../controller/businessUnitCtrl');

// Routing
router.get('/', async (req, res, next) => {
	try {
		res.locals.result = await businessUnitCtrl.addressToBusinessUnit(req);
	} catch (error) {
		res.locals.error = error;
	}
	next()
});

module.exports = router;