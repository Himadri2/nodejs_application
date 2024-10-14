require('dotenv').config(); // Load environment variables from .env file
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var indexRouter = require('./routes/index');
var axios = require('axios');

var app = express();

// Middleware for logging
app.use(logger('dev'));

// Middleware for session management
app.use(session({
    secret: 'your_secret_key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS in production
}));

// Middleware to make session available in views
app.use((req, res, next) => {
    res.locals.session = req.session; // Make the session available to all views
    next();
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set path for static assets
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);

// Callback route for Cognito authentication
app.get('/callback', async (req, res) => {
    const code = req.query.code; // Get the authorization code from the query

    // Exchange the code for tokens
    try {
        const response = await axios.post(`https://${process.env.COGNITO_DOMAIN}/oauth2/token`, null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.COGNITO_APP_CLIENT_ID,
                code: code,
                redirect_uri: 'https://app.hitch.zone/callback'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Store tokens in session
        req.session.isAuthenticated = true;
        req.session.idToken = response.data.id_token; // You can also store the access token if needed

        // Redirect to the main application (e.g., home page)
        return res.redirect('/');
    } catch (error) {
        console.error('Token exchange failed:', error);
        return res.status(500).send('Authentication failed');
    }
});

// Logout route (trigger signout from app)
app.get('/logout', (req, res) => {
    // Clear the session
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
        }
        // Redirect to Cognito logout URL
        const logoutUrl = `https://${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_APP_CLIENT_ID}&logout_uri=https://app.hitch.zone/signout`;
        res.redirect(logoutUrl);
    });
});

// Signout route (after Cognito redirect)
app.get('/signout', (req, res) => {
    // This route will be called after Cognito logs the user out
    // You can redirect them to the login page or show a sign-out confirmation message
    return res.redirect(`https://${process.env.COGNITO_DOMAIN}/login?client_id=${process.env.COGNITO_APP_CLIENT_ID}&response_type=code&redirect_uri=https://app.hitch.zone/callback`);
});

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', { status: err.status, message: err.message });
});

module.exports = app;

