var async = require('async');
var _ = require('underscore');

var Xray = require('x-ray');
var xray = Xray();

var MongoClient = require('mongodb').MongoClient;

// TODO: move to config.
var mongoDbAddr = 'localhost';
var proxy = {
	user: 'proxy_user',
	password: 'proxy_password',
	url: 'http://proxy.com:8080',
};

var stackoverflowBaseUrl = 'http://careers.stackoverflow.com';

function Crawler(searchBaseUrl, http) {
	this.searchBaseUrl = searchBaseUrl;

	/**
	 * Retrieve HTML page by the specified URI.
	 */
	this.getHtml = function(uri, onResponse) {
		http.request({
			uri: uri,
			headers: {
				'Proxy-Authorization':
					makeProxyBasicAuthHeader(proxy.user, proxy.password),
				'User-Agent':
					'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
			},
			proxy: proxy.url,
		}, onResponse);
	};

	this.parseHtml = function(resp, body, onParsed) {
		xray(body, '.-job', [{
			company: '.employer',
			// Sometimes class names start with '-'.
			company_: '.-employer',
			link: 'a.job-link@href',
		}])(onParsed);
	};

	this.saveCompanies = function (scrapedJobs, callback) {
		jobs = makeJobRecords(scrapedJobs, stackoverflowBaseUrl);

		console.log('Job ads:', jobs);
		saveCompanies(jobs);

		// success
		callback(null);
	};

	this.onDone = function(err) {
		if (err) {
			console.log('Failed to scrape companies:', err);
		} else {
			console.log('Successfully scraped companies.');
		}
	};

	self = this;

	/**
	 * Executes the scraper.
	 *
	 * @param searchKeyword search stackoverflow careers with this keyword.
	 */
	this.exec = function(searchKeyword) {
		var uri = makeSearchUrl(self.searchBaseUrl, searchKeyword)
		async.waterfall([
			function (callback) {
				callback(null, uri);
			},
			this.getHtml,
			this.parseHtml,
			this.saveCompanies,
		], this.onDone);
	};
}
exports.Crawler = Crawler;

/**
 * Returns an array of job records with time when job ad was found appended.
 *
 * @param scrapedJobs array of scraped jobs. It is not mutated.
 * @return new array of job ads.
 */
function makeJobRecords(scrapedJobs, baseLinkUrl) {
	var jobRecords = scrapedJobs.slice();

	_.each(jobRecords, function(element, index, list) {
		if ('company' in element) {
			list[index]['company'] = element['company'].trim();
		} else if ('company_' in element) {
			list[index]['company'] = element['company_'].trim();
			delete list[index]['company_'];
		}

		if ('link' in list[index]) {
			list[index]['link'] = baseLinkUrl + element['link'];
		}

		list[index]['found_at'] = new Date();
	});

	return jobRecords;
}
exports.makeJobRecords = makeJobRecords;

function makeSearchUrl(searchBaseUrl, keyword) {
	return searchBaseUrl + keyword;
}

function makeProxyBasicAuthHeader(username, password) {
	return 'Basic ' + new Buffer(username + ':' + password).toString('base64');
}

/**
 * Stores scraped companies to mongo db.
 */
function saveCompanies(companies) {
	var url = 'mongodb://' + mongoDbAddr + ':27017/scraping_companies';

	async.waterfall([
		function(callback) {
			MongoClient.connect(url, callback);
		},
		function(db, callback) {
			db.collection('companies').insert(
				companies,
				{ keepGoing: true },
				function(err, insertedRecords) {
					callback(err, db, insertedRecords);
				}
			);
		}
	], function(err, db, records) {
		if (err && err.code != 11000) {
			console.log('Failed to store scraped companies to DB:',
				err);
		} else {
			console.log('Companies saved in DB');
		}

		db.close();
	});
}
