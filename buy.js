var querystring = require('querystring');
var http = require('http');
var util = require('util');
var fs= require('fs');
var cheerio = require('cheerio');

if (process.argv.length != 3) {
    console.log("Usage: node flushUser.js hlx.json\n");
    process.exit(0);
}
var configFile = process.argv[2];

var userInfo = JSON.parse(fs.readFileSync(configFile));

setTimeout(function() {
	buyPage(function(res)
	{
		$ = cheerio.load(res);
		var tmpFormData = $('form','.tenderForm').serializeArray();
		var formData = {};
		for (var key in tmpFormData)
		{
			formData[tmpFormData[key].name]=tmpFormData[key].value;
		}
		
		userInfo.formData = formData.availableBalance;
	
		// 投标
		buy(function(resData){
			util.log(resData);
		});
	});
}, 1000);

function buy(callback) {
	var method = 'POST';
	var path = '/product/trade/buy';
	var postData = userInfo.formData;
	postData.buyAmount = userInfo.buyAmount;
	util.log('buy Data:'+util.inspect(postData));
	//request(method, path, postData, callback);
}

function buyPage(callback) {
	var method = 'GET';
	var path = '/product/planning/detail/403586';
	var postData = {};
	request(method, path, postData, callback);
}

function request(method, path, postData, callback) {
	var options = {
			hostname : 'www.xiaoniu88.com',
			port : 80,
			path : path,
			method : method,
			headers : {}
		};
	
	if(method == 'POST')
	{
		var postData = querystring.stringify(postData);
		console.log('postData:' + postData);

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
			//util.log('response:' + resData);
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
