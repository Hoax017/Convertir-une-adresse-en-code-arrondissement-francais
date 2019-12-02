// Imports
const opencage = require('opencage-api-client');
const https = require('https');
const fs = require('fs');

// Routing
const businessUnitCtrl = {
	async addressToBusinessUnit(req) { // required parameters: address
		const address = req.body.address ? req.body.address : // body parameter
							( req.query.address ? req.query.address : null);  // url parameter
		if (!address) {
			throw "the parameter 'address' is missing";
		}
		const coordsInformation = await businessUnitCtrl.addressToCoordinate(address).catch(() => {
			throw "Can't find coordinates for your address"
		});
		const addressInformation = await businessUnitCtrl.coordinateToAddressInformation(coordsInformation.geometry).catch(() => {
			throw "Can't find information for your address. Is it in France ?"
		});

		let businessUnits;
		// get BU information from file
		try {
			const businessUnitsJson = fs.readFileSync('businessUnits.json');
			businessUnits = JSON.parse(businessUnitsJson);
		} catch (msg) {
			throw "businessUnits.json is invalid";
		}
		const ret = { // Default return
			address: coordsInformation.formatted,
			businessUnit: 'Autre',
			codeArrondissement: parseInt(addressInformation.code_arrondissement)
		};
		const currentBusinessUnit = businessUnits.find((bu) => bu.arrondissements.includes(ret.codeArrondissement)); // if code find in BU file, BU returned

		if (currentBusinessUnit) {
			ret.businessUnit = currentBusinessUnit.name; // erase name by find BU's name
		}


		return ret;
	},
	addressToCoordinate (address)  {
		return new Promise((resolve, reject) => {
			opencage.geocode({q: address}).then(data => { // api to convert address to coords
				if (data.status.code === 200) { // everything is ok
					if (
						data.results.length > 0 &&
						data.results[0].geometry &&
						data.results[0].geometry.lng &&
						data.results[0].geometry.lat &&
						data.results[0].formatted
					) {
						resolve(data.results[0])
					} else {
						reject() // no result found
					}
				} else if (data.status.code === 402) {
					console.error('hit free-trial daily limit');
					reject()
				} else {
					// other possible response codes:
					// https://opencagedata.com/api#codes
					console.error(data.status.message);
					reject()
				}
			}).catch(error => {
				console.error(error.message);
				reject()
			});
		});
	},
	coordinateToAddressInformation(coords) {
		return new Promise((resolve, reject) => {
			let url = `https://data.opendatasoft.com/api/records/1.0/search/?dataset=contours-geographiques-des-arrondissements-departementaux-2019%40public&rows=1&facet=nom_de_l_arrondissement&geofilter.distance=${coords.lat}%2C${coords.lng}`;
			https.get(url, (resp) => {
				let data = '';
				// A chunk of data has been received.
				resp.on('data', (chunk) => { data += chunk; });

				// The whole response has been received. resolve the result.
				resp.on('end', () => {
					let apiParsedResponse;
					try{
						apiParsedResponse = JSON.parse(data);
					} catch (msg) {
						reject();
						return console.log("JSON.parse fail")
					}
					if (apiParsedResponse.nhits) { // if we get result
						resolve(apiParsedResponse.records[0].fields);
					} else {
						console.log("Invalid address");
						reject();
					}
				});
			}).on("error", (error) => {
				console.error(error.message);
				reject()
			});
		});
	}
};

module.exports = businessUnitCtrl;