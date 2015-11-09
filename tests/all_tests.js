var app = require('../main.js');

var expect = require('chai').expect;

describe('makeJobRecords', function() {
	it('should return array of job ads', function() {
		var scrapedJobs = [{company: 'dummy company'}];

		var jobs = app.makeJobRecords(scrapedJobs);

		expect(jobs).to.be.an('array');
	});

	it('should return a copy of provided array', function() {
		var scrapedJobs = [{company: 'dummy company'}];

		var jobs = app.makeJobRecords(scrapedJobs);

		expect(jobs).not.to.equal(scrapedJobs);
	});

	it('should add found_at field to all records', function() {
		var scrapedJobs = [{company: 'dummy company'}];

		var jobs = app.makeJobRecords(scrapedJobs);

		expect(jobs[0]).to.have.property('found_at');
	});

	it('should append base url to record links', function() {
		var scrapedJobs = [{company: 'dummy company', link: 'ad-link'}];

		var jobs = app.makeJobRecords(scrapedJobs, 'http://ads.com/');

		expect(jobs[0]).to.have.property('link')
			.and.equal('http://ads.com/ad-link');;
	});
});
