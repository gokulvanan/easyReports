easyrep
========

A nodejs based reporting framework.
                                                                                                                                                                              
easyrep is an easy to use framework for building reports.
Its built for the use case where the aggreation happens in the database mysql or mongo through group by statements in case of mysql and aggreration pipeline in case of mongo. 
easyrep is an ideal backend for frontend displaying charts and grid using javascript and other data visualization apis;

Why use easyrep?? 
 - easyrep makes it easy to dyamically build these queries from request params (Get or Post), execute them and format them as required. 
 - easyrep works with both mysql and mongo datasources.
 - easyrep renders only JSON output currently, but future release would provide CSV,XML responses and also provide the ability to send email reports for request.
 - easyrep takes care of monitoring through email services that report failure cases along with stacktrace when configured.                                      
 - easyrep provides a scheduler service (cron) that enables running background ETL scripts as a separate process and yes these are also monitored.
 - easyrep exploits nonblocking and is fast as well as scalable. It uses the cluster api to spawn childprocess to provide better scalability.
 - working with easyrep saves time. You can focus on the UI and tweak the queries in your easyrep project at the same time.

Thats not all it can do, some other features are:
 - It simplifies developer task into 3 buckets 
  - request (pre processing of params)
  - query (dynamic query building)
  - display(dynamic dispaly formatting)
 - It takes care of monitoring by reporting failures via  the built in email wrapper. (email ability is also provided to developer building models).
 - It has no routes. The name of the js model file declared is the route.
 - It centralizes all business transformation logic in the form of app.js.
 - Its built similar to play framework to enable to debugg and build reports by looking at responses from the browser without restarting the server.

##Prerequisites
 - node
 - npm
 

##Install
```bash
npm install -g easyrep
````
Its recomended to use -g option so that easyrep is added to you /usr/bin directory.


##(WIP - Some interface has changes. Need to update the Documentation)

##Quick Start (WIP - Some interface has changes. Need to update the Documentation)

Create new project and run easyrep server
```bash
$ easyrep new
````

Configure your databse connections:
```json
"db": {
        "host": "localhost",
        "user": "root",
        "password": "mysql",
        "database": "easyrep"
    },
```
in config.json
```bash
cd testProj
vim config.json
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


## Model JSON Interface (WIP)
The Model json interface is still to be finalized, watch this space for more info on the same


## NOTICE
This documenation is WIP. will be udpating with other refrences shortly
For clarifications mail to gokulvanan@gmail.com






