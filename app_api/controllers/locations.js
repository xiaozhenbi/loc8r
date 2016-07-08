var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var theEarth = (function () {
    var earthRadius = 6371; // km, miles is 3959 // Define fixed value for radius of Earth

    var getDistanceFromRads = function (rads) {
        return parseFloat(rads * earthRadius);
    };

    var getRadsFromDistance = function (distance) {
        return parseFloat(distance / earthRadius);
    };

    return {
        getDistanceFromRads: getDistanceFromRads,
        getRadsFromDistance: getRadsFromDistance
    }
})();

var sendJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
}

module.exports.locationsListByDistance = function (req, res) {
    var lng = parseFloat(req.query.lng);
    var lat = parseFloat(req.query.lat);
    var point = {
        type: "Point",
        coordinates: [lng, lat]
    };
    var geoOptions = {
        spherical: true,
        // Create options object, including setting maximum distance to 20km
        maxDistance: theEarth.getRadsFromDistance(20),
        num: 10
    };
    // Check lng and lat query parameters exist in right format; return a 404 error
    // and message if not
    if (!lng || !lat) {
        sendJsonResponse(res, 404, {
            "message": "lng and lat query parameters are required"
        });
        return;
    }
    // Update geoNear function to use geoOptions object
    Loc.geoNear(point, geoOptions, function (err, results, stats) {
        var locations = [];
        if (err) {
            sendJsonResponse(res, 404, err);
        } else {
            results.forEach(function (doc) {
                locations.push({
                    distance: theEarth.getDistanceFromRads(doc.dis),
                    name: doc.obj.name,
                    address: doc.obj.address,
                    rating: doc.obj.rating,
                    facilities: doc.obj.facilities,
                    _id: doc.obj._id
                });
            });
            sendJsonResponse(res, 200, locations);
        }
    });
};

module.exports.locationsCreate = function (req, res) {
    Loc.create({
        name: req.body.name,
        address: req.body.address,
        facilities: req.body.facilities.split(","),
        coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
        openingTimes: [{
            days: req.body.days1,
            opening: req.body.opening1,
            closing: req.body.closing1,
            closed: req.body.closed1,
        }, {
            days: req.body.days2,
            opening: req.body.opening2,
            closing: req.body.closing2,
            closed: req.body.closed2,
        }]
    }, function (err, location) {
        if (err) {
            sendJsonResponse(res, 400, err);
        } else {
            sendJsonResponse(res, 201, location);
        }
    });
};

module.exports.locationsReadOne = function (req, res) {
    // Error trap 1: check that locationid exists in request parameters
    if (req.params && req.params.locationid) {
        Loc.findById(req.params.locationid)
            .exec(function (err, location) {
                // Error trap 2: if Mongoose doesn't return a location, send
                // 404 message and exit function scope using return statement.
                if (!location) {
                    sendJsonResponse(res, 404, {"message": "locationid not found"});
                    return;
                } else if (err) {
                    // Error trap 3:if Mongoose returned an error, send it as 404
                    // response and exit controller using return statement
                    sendJsonResponse(res, 404, err);
                    return;
                }
                // If Mongoose didn't error, continue
                // as before and send location object in a
                // 200 response
                sendJsonResponse(res, 200, location);
            });
    } else {
        // If request parameters didn't include locationid, send appropriate 404 response.
        sendJsonResponse(res, 404, {
            "message": "No locationid in request"
        });
    }
};

module.exports.locationsUpdateOne = function (req, res) {
    if (!req.params.locationid) {
        sendJsonResponse(res, 404, {
            "message": "Not found, locationid is required"
        });
        return;
    }
    Loc
        .findById(req.params.locationid)
        // retrieve everything except reviews and rating
        .select('-reviews -rating')
        .exec(
            function (err, location) {
                if (!location) {
                    sendJsonResponse(res, 404, {
                        "message": "locationid not found"
                    });
                    return;
                } else if (err) {
                    sendJsonResponse(res, 400, err);
                    return;
                }
                location.name = req.body.name;
                location.address = req.body.address;
                location.facilities = req.body.facilities.split(",");
                location.coords = [parseFloat(req.body.lng),
                    parseFloat(req.body.lat)];
                location.openingTimes = [{
                    days: req.body.days1,
                    opening: req.body.opening1,
                    closing: req.body.closing1,
                    closed: req.body.closed1,
                }, {
                    days: req.body.days2,
                    opening: req.body.opening2,
                    closing: req.body.closing2,
                    closed: req.body.closed2
                }];
                location.save(function (err, location) {
                    if (err) {
                        sendJsonResponse(res, 404, err);
                    } else {
                        sendJsonResponse(res, 200, location);
                    }
                });
            }
        )

    sendJsonReponse(res, 200, {"status": "success"});
};

module.exports.locationsDeleteOne = function (req, res) {
    var locationid = req.params.locationid;
    if (locationid) {
        Loc
            .findByIdAndRemove(locationid)
            .exec(function (err, location) {
                if (err) {
                    sendJsonResponse(res, 404, err);
                    return;
                }
                // no content when succeeding
                sendJsonResponse(res, 204, null);
            });
    } else {
        sendJsonReponse(res, 404, {
            "message": "No locationid"
        });
    }
};