easyrep
========

A nodejs based reporting framework.

easyrep is an ideal framework to build RESTful Web Services over Datatstores.
easyrep primarily outputs JSON which integrates easily with existing Javascirpt Grid, Data Visualization API's. 
It forms an abstract layer over mysql and mongo datasources and provides easy to use wrappers over cache, email and logging.

easyrep as the name says is super easy.. you can get up an running with reports in 10 minutes.

#Disclaimer
The API is currently in beta stage.. I will try best not to make changes to established interfaces for model's and cron files, unless they are very much required.   

##Why use easyrep?? 
 - easyrep makes it easy to dyamically build queries from request params (Get or Post), execute them and format results  as required. 
 - write only the business logic leave rest of the processing to easyrep.
 - easyrep wraps over both mysql and mongo datasources.
 - easyrep renders only JSON output currently, but future release would provide CSV,XML responses. 
 - easyrep is self monitoring and provides email services that report failure along with stacktrace.                    
 - easyrep provides background job runner (cron) that enables running background ETL scripts as a separate process and yes these are also monitored.
 - easyrep lets you debug your code from the browser.
 - easyrep exploits nonblocking approach to request processing and is fast. It uses the cluster api to spawn childprocess to provide better scalability.

##How it works:

easyrep comprise of two independent components:
 - Http Server - Web server used to process request and parse it to models.
 - Cron Schedule Server - Independent Cron Process that creates and destroys child threads to process cron jobs.

The HTTP server process the request in waterfall mode, the following are the stages :
- validate (validate params, format params, apply defaults to params)
- build-query (build dynamic query from request params)
- execute-query (execute query in the datastore mysql/mongo)
- format (formats response from query results to desired format)

Each of the stages in this approach invoke methods or read attributes of user defined models.
Such models are declared in models folder.. see sampleDeclarative.js

The model simplifies developer task into 3 buckets 
  - request (pre processing of params)
  - query (dynamic query building)
  - display(dynamic dispaly formatting)

###Model Structure
TODO


# CronServer
The Cron server provides interface to run background jobs, All utilites such as DB connection pools to mysql and monog, logging, emailing and caching are available to cron as in http models. 
utils and rawUtils are the two variables injected into cron script function,

```json
  cron:{
      path:"cron", // relative folder path to cron scripts
      scripts:{ 
        "loadOnceAtStart":{"loadOnStart":true, "monitor":false}, //start once during server startup
        "periodicLoader":{ "interval":3000, "loadOnStart":false, "monitor":false},// dont start at startup run ever 50min
        "cacheData":{ "interval":600, "loadOnStart":`, "monitor":false} // start at startup and run every 10min
     }   
    }, 
```

The above configuration acitivates the 3 js flies loadOnceAtStart.js, periodicLoader.js and cacheData.js in cron dierctory given by path.

loadOnStart - if set to true starts this js file on cron server start.
interval - takes integer that specifies interval duration in seconds.
monitor - if set to true will issue an email updating success or failure of the cron execution based on email configuration in config.js



## Cron Job files structure: 
TODO


#Quick Start (HTTP Server)

##Install
```bash
npm install -g easyrep
````
Its recomended to use -g option so that easyrep is added to you /usr/bin directory.

Create new project 
```bash
$ easyrep new
````
All configurations can be made in config.js
Configure your databse connections: 
(Note: default name is mandatory for one datasource connection)
Other datasources can be refred by name.
(Note: This is applies to monog and cache as well)


```json
"db": {
        default:{
            "host": "localhost",
            "user": "root",
            "password": "mysql",
            "database": "easyrep"
         }..
    },
```


Load test data to work with.
> Note: This will create two sample tables in your databse and load data to them.
      These tables would map to the  model sample.json (models/sample.json)
      To know more on check sample.json in your models.

```bash
easyrep testdata
```

Run server 
> Note:  easyrep start could be used to start server in a seprate background process while easyrep run starts the server in the current process which enables you to see the logs.

```bash
easyrep run
```

In another terminal or browser make an http request to your server
```bash
curl "http://localhost:8080/"
{"status":"error","type":"validator","message":"Error: Not action path specified"}
```

If you get the above response your sever is running and you just need to point to your model.


```bash
$ curl "http://localhost:8080/sample.json?sdate=2013-09-28&edate=2013-09-28"
{"status":"success","message":"Data Fetched Successfully","table":[{"name":"BOND","email":"007@gmail.com","actio.....
```

Thats it and your ready to go.


## Development Tips

Easyrep was built to make developers life easy.
The following steps would illustrate the way to about building a report.

First get your model ready.
An easy way to go about this to copy sample.json and change the query, join and display options as per your use case.

### Step 1 Validate your model
Validate your model using validate prefix as shown below for sample.json
```bash
curl "http://localhost:8080/validate.sample.json"
{"status":"error","type":"validator","message":"Error: Mandatory parameter sdate,edate missing from query string"}
```

Above response indicates the missing of mandatory fields declared in sample.json model. 
Add them to your request to get your response.

### Step 2 Build your query from the model declaration
Add sdate and edate params to your request and use build prefix to verify the dynamic sql built from your request.
> Note the response below for sample.json model

```bash
 curl "http://localhost:8080/build.sample.json?sdate=2013-09-28&edate=2013-09-28"
{"status":"notification","type":"builder","message":[{"type":"main","query":" select id as id, user_id as user_id, daydate  as daydate, action as action................
```
sql's generted could be verfied at this stage from the response json.

### Step 3 Execute your queries and verify raw results
Add execute. prefix to your request to verify the raw response of the qureires built.
> Eg for sample.json is shown below. 

```bash
$ curl "http://localhost:8080/execute.sample.json?sdate=2013-09-28&edate=2013-09-28"
{"status":"notification","type":"executor","message":{"main":[{"id":49,"user_id":1,"daydate":"2013-09-28T00:00:00.000Z","action":"Logged in"}.............
```

### Step 4 Remove all prefixes and verify if the format and translation logics work as expected.
```bash
$ curl "http://localhost:8080/sample.json?sdate=2013-09-28&edate=2013-09-28"
{"status":"success","message":"Data Fetched Successfully","table":[{"name":"BOND","email":"007@gmail.com","actio.....
```

## Next Steps
Try running server on prod mode. (clusters)


## NOTICE
This documenation is WIP. will be udpating with other refrences shortly
For clarifications mail to gokulvanan@gmail.com






