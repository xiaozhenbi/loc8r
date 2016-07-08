var mongoose = require('mongoose');

var dbURI = 'mongodb://localhost/Loc8r';
if(process.env.NODE_ENV === 'production') {
    dbURI = process.env.MONGOLAB_URI; // fZ1ZbtG3x90ahZlINzTPSvOOz
}
mongoose.connect(dbURI);
mongoose.connection.on('connected', function() {
    console.log('Mongoose connected to ' + dbURI);
});

mongoose.connection.on('error', function() {
    console.log('Mongoose connection error ' + dbURI);
});

mongoose.connection.on('disconnected', function() {
    console.log('Mongoose disconnected ' + dbURI);
});

var gracefulShutdown = function(msg, callback) {
    // Close Mongoose connection, passing through an anonymous function to run when closed
    mongoose.connection.close(function() {
        // Output message and call callback when Mongoose connection is closed.
        console.log('Mongoose disconnected through ' + msg);
        callback();
    });
};

// Listen for SIGUSR2, which is what nodemon uses
process.once('SIGUSR2', function() {
    // Send message to gracefullShutdown and callback to kill process,
    // emitting SIGUSR2 again
    gracefulShutdown('nodemon restart', function() {
        process.kill(process.pid, 'SIGUSR2');
    });
});

// Listen for SIGINT emitted on application termination
process.on('SIGINT', function() {
    gracefullShutdown('app termination', function() {
        process.exit(0);
    });
});

// Listen for SIGTERM emitted when Heroku shuts down process
process.on('SIGTERM', function() {
    gracefulShutdown('Heroku app shutdown', function() {
        process.exit(0);
    });
});

require('./locations');
