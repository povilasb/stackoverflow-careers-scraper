#!/usr/bin/nodejs

var request = require('request');
var _ = require('underscore');

var stackoverflow = require('./stackoverflow.js');

var stackoverflowBaseUrl = 'http://careers.stackoverflow.com';
var searchBaseUrl = stackoverflowBaseUrl + '/jobs?searchTerm=';
var searchKeywords = [
	'scrape',
	'scraping',
	'crawling',
];

function main() {
	http = {
		request: request,
	};
	var crawler = new stackoverflow.Crawler(searchBaseUrl, http);

	_.each(searchKeywords, function (keyword, index, list) {
		crawler.exec(keyword);
	});
}

main()
