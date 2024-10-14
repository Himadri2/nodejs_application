var express = require('express');
var axios = require('axios'); // Ensure you have axios installed
var router = express.Router();

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next(); // Proceed to the next middleware/route if authenticated
    } else {
        // Redirect to Cognito login if not authenticated
        const cognitoLoginURL = `https://${process.env.COGNITO_DOMAIN}/login?response_type=code&client_id=${process.env.COGNITO_APP_CLIENT_ID}&redirect_uri=https://app.hitch.zone/callback`;
        return res.redirect(cognitoLoginURL);
    }
}

/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next) {
    res.render('index', { page: 'Home', menuId: 'home' });
});

router.get('/about', isAuthenticated, function(req, res, next) {
    res.render('about', { page: 'About Us', menuId: 'about' });
});

router.get('/contact', isAuthenticated, function(req, res, next) {
    res.render('contact', { page: 'Contact Us', menuId: 'contact' });
});

// Export the router
module.exports = router;

