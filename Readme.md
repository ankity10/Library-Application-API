#   Mini Project
##### This Application constains two applications
1. Angular app.
2. API app.

## 1. File-Structure
    1 - angular--
                |---assets/  --> for static files like css, img etc.
                |---controllers/ --> for controller logic. 
                |---routes/ --> for client side angular routes.
                |---services/ --> for angular services like factory storage etc.
                |---tests/ --> for tests.
                |---views/ --> client side views (HTML)
                |---bower.json  --> Bower config file, a package manager 
#### **Read more bower Package Manager at [bower.io](http://bower.io/)**

    2 - api --  
                |---controllers/
                |---kerberos/
                |---models/
                |---routes/
                |---tests/
                |---api.js
                |---server.js
                |---package.json

    3 - .gitignore

## 2. Project setup
    > git clone https://gitlab.com/ankitwrk/mini-project.git
    > cd mini-project
    >mini-project > cd api
    >mini-project/api > npm install
        To run the api application
    mini-project/api > node server
##### You coul also use "nodemon server" inside the api folder and this will allow you reload the application automatically if you made any changes to files.
# 3. Project status 
##### As of now 10th May only 2. API app is working.
##### Working routes : 
###### 1. http://localhost:8080/api/register/ with "POST" request
###### 2. http://localhost:8080/api/login/ with "POST" request
###### 3. http://localhost:8080/api/test with "GET" request
###### 4. http://localhost:8080/api/dash route with authentication with "GET" request and "Authentication" header equals to JSON Web Token.

# 4. Note
##### Anyone working on this project please update the readme file after commiting changes.
  
