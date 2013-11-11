
/*
 * IMPERATIVE EXAMPLE ANALOGUS TO DECLARATIVE APPROACH USED IN sampleDeclarative.js
 This is a sample js  model heavily commented  to help you get started.
 models and app.js are the two main things you need to work with to build reports.
 easyrep works in both declarative and impreative approach. 
 models are js files where you declare or program  the following:
  1) what params you expect in you get request which of them are mandatory.
  2) what table/s you need to query and what fields you need / based on request params.
  3) how do you wish to display your report data. 

  Point 1) is specified in field "request"
  Point 2) is specified in the field "query"
  Point 3 is specified in field "display"
  
 Below model works with two tables described below.. 

 mysql> desc easyrep_sample_logs
 +---------+--------------+------+-----+---------+----------------+
 | Field   | Type         | Null | Key | Default | Extra          |
 +---------+--------------+------+-----+---------+----------------+
 | id      | int(11)      | NO   | PRI | NULL    | auto_increment |
 | user_id | int(11)      | NO   |     | NULL    |                |
 | daydate | date         | NO   |     | NULL    |                |
 | action  | varchar(100) | YES  |     | NULL    |                |
 +---------+--------------+------+-----+---------+----------------+
  
 mysql> desc easyrep_sample_users;
 +-------+--------------+------+-----+---------+----------------+
 | Field | Type         | Null | Key | Default | Extra          |
 +-------+--------------+------+-----+---------+----------------+
 | id    | int(11)      | NO   | PRI | NULL    | auto_increment |
 | name  | varchar(100) | NO   |     | NULL    |                |
 | role  | varchar(100) | NO   |     | NULL    |                |
 | email | varchar(100) | NO   |     | NULL    |                |
 +-------+--------------+------+-----+---------+----------------+

 Note: After configuring your database use "easyrep testdata" to load data for the above table and check this model in action

 The strategry of the model below is to not do the join in mysql but makes an hashjoin in easyrep, this is done just to explain easyrep's features.
 
 The model below creates and fires 2 queries one for the main table easyrep_sample_logs and the other for easyrep_sample_users.
 Both outputs are used to build the final report json based on the field "display"
*/


// BELOW IS AN EXAMPLE OF A IMPERATIVE MODEL
var app = require("../app.js");// business logic file
module.exports= function(){
	return  {
    // all get/post request params are passed in as params this can be validated for manadtory params,filtered (to modify the params before sending them query processing logic and sensible defautls could be added"
    request:{
      // mandatory fields expected in web request

      mandatory:function(params){
        var msg = new Array();
        if(!params.sdate) msg.push(" sdate not defined");
        if(!params.edate) msg.push(" edate not defined");
        if(msg.length === 0) return null;
        else return msg.join(' ');
      },
      defaults:{ // default params used in query i.e. in absence of query params from web request
        
        orderBy:"daydate", 
        dir:"desc" ,
        page:0, 
        rowsPerPage:20
      }
      /*
       * filter:function(params){
       *   //format params
       *
       *   return params;
       * }
       */
    },

    query:{ 
    /* dynamic query is built here in build function using javascript constructs
    note: page & rowsPerPage are hardcoded params used in server for pagination. These should not be specified. 
    */

      build: function(params){
        var query = new Array();
        query.push("select id as id, user_id as user_id, daydate as day_date, action as action from easyrep_sample_logs ");
        if(p.sdate && p.edate) query.push(" where daydate between "+p.escape("sdate")+" and "+p.escape("edate")+ " ");
        if(p.orderBy) query.push(" order by "+p.orderBy+" "+p.dir);
        return query.join("");
      }
      joins:{ // An alternative approach to using sql join statments is to excute the other query in parallel and use hashmap join
        user:{ //name of the alternate query.. note this is used in display to refer to this queries output 
          on:["user_id"], // join field.. key to hashmap used in building the join. (note user_id alias should be present both in main query and join query
          build: function(params){
            return  "select id as user_id, name as name, email as email  from easyrep_sample_users" // join query 

          }
      }
        
    },
    /* display - defines  output table json..
       build display of each row from args

       Note: format function is defined as 
       function(row,results,val,key,cache,callback)
        row - raw row object from sql query
        results: is high level object with mappings to joins.. you can acces join result (this would be changed to joins holidng join rows)
        val: value of the column given in key - null if no key is specified
        key: key of the column called
        cache: object refrence to memcache if defined else null
        callback: - callback function used to send the result back in a nonblocking mode

      Check app.js for the implementation of capitalize
     */
    display:function(params,row,joins,joinMap,callback){

      return {
        name: (row.name)? row.name.toUppercase(): row.name,
        email: row.email,
        action : row.action,
        daydate: row.daydate
      }
    },
    header: { name: "Name", email:"Email", action:"Action", daydate:"Date"}// declared exclusively as display is imperative
  }
};

