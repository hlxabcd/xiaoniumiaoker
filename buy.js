var querystring = require('querystring');
var http = require('http');
var util = require('util');
var fs= require('fs');
var cheerio = require('cheerio');
var zlib = require('zlib');

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
		var tmpFormData = $('.tenderForm').serializeArray();
		var formData = {};
		for (var key in tmpFormData)
		{
			formData[tmpFormData[key].name]=tmpFormData[key].value;
		}
		
		userInfo.formData = formData;
		// 投标
		buy(function(resData){
			util.log(resData);
		});
	});
}, 1);

function buy(callback) {
	var method = 'POST';
	var path = '/product/trade/buy';
	var postData = userInfo.formData;
  postData.buyAmount = userInfo.buyAmount;
	util.log('buy Data:'+util.inspect(postData));
	//request(method, path, postData, function(res){console.log("buy Response:"+res);});
}

function buyPage(callback) {
	var method = 'GET';
	var path = '/product/planning/detail/'+userInfo.productId;
	var postData = {};
	request(method, path, postData, callback);
}

function request(method, path, postData, callback) {
	var options = {
			hostname : 'www.xiaoniu88.com',
			port : 80,
			path : path,
			method : method,
			headers : {
      }
		};
		options.headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
		options.headers['Accept-Encoding'] = 'gzip, deflate, sdch';
		options.headers['Accept-Language'] = 'zh-CN,zh;q=0.8,en;q=0.6,ja;q=0.4';
		options.headers['Cache-Control'] = 'max-age=0';
		options.headers['Connection'] = 'keep-alive';
		options.headers['Host'] = 'www.xiaoniu88.com';
		options.headers['Upgrade-Insecure-Requests'] = '1';
		options.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36';
	
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

//		res.setEncoding('utf8');
		var resData = '';
		var len = 0;
    var chunks = [];

		res.on('data', function(chunk) {
        chunks.push(chunk);
        len += chunk.length;
		});
		res.on('end', function() {
			if (res.headers['set-cookie'] != undefined) {
				var cookieinfo = res.headers['set-cookie'][0].split(";");
				userInfo.cookie = cookieinfo[0];
			}

	util.log('buy Data:'+util.inspect(chunks));
      var buffer = Buffer.concat(chunks,len);
      var encoding = res.headers['content-encoding'];
      if (encoding == 'gzip') {
        zlib.gunzip(buffer, function(err, decoded) {
          callback(decoded && decoded.toString());
        });
      } else if (encoding == 'deflate') {
        zlib.inflate(buffer, function(err, decoded) {
          callback(decoded && decoded.toString());
        })
      } else {
        callback(buffer.toString());
      }
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
