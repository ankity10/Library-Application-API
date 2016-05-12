var mongodb_url = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost:27017/';

module.exports = {
	secret:  	"thisismysecretkey",
	db:mongodb_url+"nodejs",
	sparkpost_api_key: "ffec16a9e59be5c6e1d7aecccf5db6724d72eb6d",
	emailFrom: "contact@siteflu.com"
}