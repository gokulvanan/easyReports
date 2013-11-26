
var winston = require("winston");
var nodemailer = require("nodemailer");
var _ = require("underscore");
var fs = require("fs");
var path = require("path");

var logger= null; // refrence to global logger
var transport = null; //refrence to nodemailer transport
var TEMPLATE_DIR=null; // refrence to dir holding the html templates
var errorOpts = null; // holds the configuration for erro reporting

exports.init = function(conf,log){
  logger=log;
  logger.trace("emailer init call started");
  var emailConf = conf.email;
  if(emailConf){ //configure email if configuration is present
    transport = nodemailer.createTransport("SMTP",{
      host:emailConf.host,
      port:emailConf.port,
      auth:emailConf.auth,
      debug:false
    });
    TEMPLATE_DIR = (emailConf.templates) ? process.cwd()+"/"+emailConf.templates+"/" : process.cwd()+"/templates/";
    errorOpts = emailConf.error;
    logger.debug("email configured");
  }
  logger.trace("emailer init call ended");
};

/**
 * used to send email 
 * opts: from,to,subject
 * msg: String msg or object
 * temp: (optional) if specified it will read this file from templateDirecotry given in conf
 */
exports.send = function(opts,msg,temp){
 if(!transport) { 
   logger.error("email transport not configured"); 
   buildErrorLog("Unabled to send mail as email not configured, msg : "+msg,temp);
   return;
 }
 temp = (TEMPLATE_DIR) ? TEMPLATE_DIR+temp+".html" : temp;
 logger.trace("send mail call started");
 if(temp && fs.existssync(temp) && (typeof msg === "object")){
   var htmltemp = fs.readfilesync(temp).toString();
   var output = _.template(htmltemp,msg);
   logger.debug("email template output ", output);
   opts.html = output;
 }else{
   var output = (typeof msg === "string") ? msg : JSON.stringify(msg);
   logger.debug("email template output ", output);
   opts.text = output;
 }
  transport.sendMail(opts,function(err,resp){
    if(err){
      logger.error("error sending email ",err.stack);
      buildErrorLog(err.stack);
    }else logger.debug("email sent");
  });
 logger.trace("send mail call ended");
};


exports.reportError= function(msg,obj){
 if(!errorOpts) buildErrorLog("Unable to report error as error opts in mail not configured msg "+msg,obj);
 var opts = clone(errorOpts);
 msg = (msg) ? msg : "";
 obj = (obj) ? obj : "";
 var txt = (typeof msg === "string") ? msg : JSON.stringify(msg);
 txt += "\n Stack trace: \n";
 opts.text = (typeof obj === "string") ? txt+obj : txt + JSON.stringify(obj);

 transport.sendMail(opts,function(err,resp){
   if(err) {
     logger.critical("failure in email error report",err.stack);
     buildErrorLog(err.stack);
   }
   else logger.debug("email error report sent");
 });
}

function clone(obj) {
    if (null == obj || "object" != typeof obj ) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function buildErrorLog(msg,obj){
  var logFile = process.cwd()+"/critical.log";
  var output = new Array();
  output.push("Critical error as email is not being sent by the system");
  output.push("Error msg: "+msg);
  output.push("Error object: "+ ((typeof obj === "string") ? obj : JSON.stringify(obj)));
  fs.writeFileSync(logFile,output.join("\n"));
}
