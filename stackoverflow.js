var async = require('async');
var _ = require('underscore');

var Xray = require('x-ray');
var xray = Xray();

var MongoClient = require('mongodb').MongoClient;

// TODO: move to config.
var mongoDbAddr = '172.17.0.1';
var proxy = {
	user: 'povilas',
	password: 'balciunas12',
	url: 'http://entry.shader.io:8081',
};

var stackoverflowBaseUrl = 'http://careers.stackoverflow.com';

function Crawler(searchBaseUrl, http) {
	this.searchBaseUrl = searchBaseUrl;
	this.searchKeyword = 'scraping';

	self = this;
	this.getHtml = function(onResponse) {
		http.request({
			uri: makeSearchUrl(self.searchBaseUrl, self.searchKeyword),
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

	this.exec = function(getHtml, parseHtml, saveCompanies) {
		async.waterfall([
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
