var mongodb_url = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost:27017/';
module.exports = {
	secret:"thisismysecretkey",
	db:mongodb_url+"nodejs"
}