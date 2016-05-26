var strEnc = require('./modules/des').strEnc;
var querystring = require('querystring');
var http = require('http');
var util = require('util');
var fs= require('fs');

if (process.argv.length != 3) {
    console.log("Usage: node flushUser.js hlx.json\n");
    process.exit(0);
}
var configFile = process.argv[2];

var key1 = 'R6NWAk7KDBexXM7';
var key2 = 'U8m29Ur68IydKVL';
var key3 = 'fglQRcv4Kxtcb4d';

var userInfo = JSON.parse(fs.readFileSync(configFile));

flushCookie(function(){
	login(function() {
		getRed(function(resData){
				
				var redInfo = JSON.parse(resData).pageData.result;
				
			    var asc = function(obj1, obj2){
			    	var timestamp1 = Date.parse(new Date(obj1.overdueTime));
			    	var timestamp2 = Date.parse(new Date(obj2.overdueTime));
			        return timestamp1 - timestamp2;
			    };
			    // 排序好，过期早的排在上面
			    userInfo.redInfo = redInfo.sort(asc);
			    
				util.log(util.inspect(userInfo));
				fs.writeFileSync(configFile,JSON.stringify(userInfo,null,4));
			});
	});
});

function flushCookie(callback)
{
	var method = 'GET';
	var path = '/account/getUserInfo.shtml';
	var postData = {
	};
	request(method, path, postData, callback);
}

function getRed(callback)
{
	var method = 'POST';
	var path = '/account/getRedDataList.shtml';
	var postData = {
		status : '0'
	};
	request(method, path, postData, callback);
}


function login(callback) {
	var method = 'POST';
	var path = '/doLogin/sureLogin.shtml?timestamp=' + new Date().getTime();
	var postData = {
		loginName : userInfo.loginName,
		password : strEnc(userInfo.password, key1, key2, key3)
	};
	request(method, path, postData, callback);
}

function request(method, path, postData, callback) {
	var options = {
			hostname : 'www.dabaimoney.cn',
			port : 80,
			path : path,
			method : method,
			headers : {}
		};
	
	if(method == 'POST')
	{
		var postData = querystring.stringify(postData);
		options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		options.headers['Content-Length'] = postData.length;
	}
	else
	{
		
	}
	
	if(userInfo.cookie != undefined)
	{
		options.headers.Cookie = userInfo.cookie;
	}
	//console.log('reuqest header:' + util.inspect(options.headers));

	var req = http.request(options, function(res) {
		//console.log('STATUS: ' + res.statusCode);
		//console.log('HEADERS: ' + JSON.stringify(res.headers));

		res.setEncoding('utf8');
		var resData = '';
		var len = 0;

		res.on('data', function(chunk) {
			resData = resData + chunk;

		});
		res.on('end', function() {
			//console.log('HEADERS: ' + JSON.stringify(res.headers));

			if (res.headers['set-cookie'] != undefined) {
				var cookieinfo = res.headers['set-cookie'][0].split(";");
				userInfo.cookie = cookieinfo[0];
				
			}

			util.log('response:' + resData);
			callback(resData);
		});
	});

	req.on('error', function(e) {
		//console.log('problem with request: ' + e.message);
	});
	if(method == 'POST')
	{
		req.write(postData);
	}
	req.end();
}