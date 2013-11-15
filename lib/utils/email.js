
var winston = require("winston");
var nodemailer = require("nodemailer");
var _ = require("underscore");
var fs = require("fs");
var path = require("path");
var log = require("./logger");
var logger= null;
var transport = null;
var TEMPLATE_DIR=null;
var errorOpts = null;

exports.init = function(conf){
  log.init(conf,"email",true);
  logger=log.getLogger();  
  logger.trace("emailer init call started");
  var emailConf = conf.email;
  if(emailConf){ //configure email in configuration present
    transport = nodemailer.createTransport("SMTP",{
      host:emailConf.host,
      port:emailConf.port,
      auth:emailConf.auth,
      debug:(conf.mode === "dev" && conf.logger && conf.logger.level && conf.logger.level === "debug") // in dev mode output email sent to console 
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
    if(err) logger.critical("error sending email ",err);
    else logger.debug("email sent");
  });

 logger.trace("send mail call ended");
};


exports.reportError= function(msg,obj){
 var opts = clone(errorOpts);
 msg = (msg) ? msg : "";
 obj = (obj) ? obj : "";
 var txt = (typeof msg === "string") ? msg : JSON.stringify(msg);
 txt += "\n Stack trace: \n";
 opts.text = (typeof obj === "string") ? txt+obj : txt + JSON.stringify(obj);

 transport.sendMail(opts,function(err,resp){
   if(err) logger.critical("failure in email error report",err);
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

