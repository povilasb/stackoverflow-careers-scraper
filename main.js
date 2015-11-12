#!/usr/bin/nodejs

var request = require('request');

var stackoverflow = require('./stackoverflow.js');

var stackoverflowBaseUrl = 'http://careers.stackoverflow.com';
var searchBaseUrl = stackoverflowBaseUrl + '/jobs?searchTerm=';

function main() {
	http = {
		request: request,
	};
	var crawler = new stackoverflow.Crawler(searchBaseUrl, http);
	crawler.exec();
}

main()
