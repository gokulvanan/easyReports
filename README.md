easyrep
========

A nodejs based reporting framework

##Install
```bash
npm install -g easyrep
````
Its recomended to use -g option so that easyrep is added to you /usr/bin directory.

##Quick Start

Create new project and run easyrep server
```bash
$ easyrep new
Enter name of you project testProj
Yo.. project testProj is up and ready
If your a first time user, follow these steps:
1) cd into your project. cd testProj
2) Modify your config.json to point to your mysql database
3) use 'easyrep testdata' to load test data t tables to your database
4) user 'easrep run' to run the server
Thats it now access this using http://localhost:8080/sample.json&sdate=2013-09-28&edate=2013-09-28
Find out more @  https://github.com/gokulvanan/easyReports
````

Configure your databse connections:
"db": {
        "host": "localhost",
        "user": "root",
        "password": "mysql",
        "database": "easyrep"
    },

```bash
cd testProj
vim config.json
```

Load test data to work with existing sample.json model
Note: this will create two dummy tables on your databse. to know more on what type of tables check sample.json in your models.

```bash
easyrep testdata
```

Run server in dev mode
```bash
easyrep run
```

In another terminal or browser make http request to your server
```bash
curl "http://localhost:8080/"
{"status":"error","type":"validator","message":"Error: Not action path specified"}
```

If you get the above response your good.. 
check
Now to test sample.json model 
```bash
curl "http://localhost:8080/validate.sample.json"
{"status":"error","type":"validator","message":"Error: Mandatory parameter sdate,edate missing from query string"}
```
If you get the above response your doing better.. 
Above response indicates the mandatory param validation declared in sample.json model is working

Now add sdate and edate params and check if dynamic sql generated from your reuest to sample.json
```bash
 curl "http://localhost:8080/build.sample.json?sdate=2013-09-28&edate=2013-09-28"
{"status":"notification","type":"builder","message":[{"type":"main","query":" select id as id, user_id as user_id, daydate  as daydate, action as action................
```
If you get the above response your now rocking.. 
Above response indicates the dynamic query that was build from your request params. 
If you want to you could test this out by loggin into mysql client and trying out the qureies. 
Dont worry about the other attributes in response like type etc.. for now

Now to verify if easyrep can execute the built queries 
```bash
$ curl "http://localhost:8080/execute.sample.json?sdate=2013-09-28&edate=2013-09-28"
{"status":"notification","type":"executor","message":{"main":[{"id":49,"user_id":1,"daydate":"2013-09-28T00:00:00.000Z","action":"Logged in"}.............
```
If you get the above response your almost on you way to become an easyrep user.. 

Now to check if you get the response json with the format logic and joins in place 
```bash
$ curl "http://localhost:8080/sample.json?sdate=2013-09-28&edate=2013-09-28"
{"status":"success","message":"Data Fetched Successfully","table":[{"name":"BOND","email":"007@gmail.com","actio.....
```

The above reponse makes you and easyrep user.. congrats.. :)
check out sample.json model to understand how to make your own models for your databsae schema.
try running server on prod mode. (clusters)

##Introduction
easyrep  is the reports developing framework on nodejs. 
Its built with objective of boosting productive in building reports.
easyrep is built to enhance declarative programing. 
It requires you delcare:
  databse/cache configuration (config.js)
  models  (json files -check sample.json)
  format behavriour (app.js)

The rest of massage code (process request params, execute quereies, build joins, format output form key val pairs, etc.  is left to easyrep. 


This documenation is WIP. will be udpating with other refrences shortly
For clarifications mail to gokulvanan@gmail.com






