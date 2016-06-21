var mongodb_url = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost:27017/';


var app_url
var app_port
var app_env
var app_ip

if(process.env.NODE_PORT)
{
	app_env = "openshift"
	app_port = process.env.NODE_PORT
	app_url = "http://nodejs-ankity10.rhcloud.com/"
	app_ip = process.env.NODE_IP
}
else
{
	app_env = "localhost"
	app_port = 3001
	app_url = "http://localhost"
	app_ip = "localhost"
}



module.exports = {
	secret:  	"thisismysecretkey",
	db:mongodb_url+"nodejs",
	sparkpost_api_key: "ffec16a9e59be5c6e1d7aecccf5db6724d72eb6d",
	emailFrom: "contact@siteflu.com",
	app_ip: app_ip,
	app_url: app_url,
	app_port: app_port,
	app_env: app_env
}