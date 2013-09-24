

exports.getJoinFlag = function(row,join,delim){
	var output = new Array();
	for(var j in join)	output.push(row[join[j]]);
	return output.join(delim);//TODO have this delimiter customizable through application.conf
}