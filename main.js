#!/usr/bin/nodejs

var Xray = require('x-ray');
var xray = Xray();
var _ = require('underscore');
var MongoClient = require('mongodb').MongoClient;
var request = require('request');

var stackoverflowBaseUrl = 'http://careers.stackoverflow.com';
var searchBaseUrl = stackoverflowBaseUrl + '/jobs?searchTerm=';
var mongoDbAddr = 'localhost';
var proxy = {
	user: 'proxy_user',
	password: 'proxy_password',
	url: 'http://proxy.com:8080',
};

function main() {
	console.log('Started');

	request({
		uri: makeSearchUrl('crawler'),
		headers: {
			'Proxy-Authorization':
				makeProxyBasicAuthHeader(proxy.user, proxy.password),
			'User-Agent':
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
		},
		proxy: proxy.url,
	}, function(err, resp, body) {
		if (err) {
			console.log('Failed getting HTML:', err);
			return;
		}

		xray(body, '.-job', [{
			company: '.employer',
			// Sometimes class names start with '-'.
			company_: '.-employer',
			link: 'a.job-link@href',
		}])(onJobsFound);
	});
}

function makeProxyBasicAuthHeader(username, password) {
	return 'Basic ' + new Buffer(username + ':' + password).toString('base64');
}

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

function onJobsFound(err, scrapedJobs) {
	if (err) {
		console.log('Failed to find employers', err);
		return;
	}

	jobs = makeJobRecords(scrapedJobs, stackoverflowBaseUrl);

	console.log('Job ads:', jobs);
	saveCompanies(jobs);
}

function makeSearchUrl(keyword) {
	return searchBaseUrl + keyword;
}

/**
 * Stores scraped companies to mongo db.
 */
function saveCompanies(companies) {
	var url = 'mongodb://' + mongoDbAddr + ':27017/scraping_companies';
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.log('Failed to connect to mongo');
			return;
		}
		console.log("Connected correctly to server.");

		db.collection('companies').insert(
			companies,
			{ keepGoing: true },
			function(err, res) {
				if (err && err.code != 11000) {
					console.log('Failed to insert companies:', err);
				}

				db.close();
			}
		);
	});
}

main()
