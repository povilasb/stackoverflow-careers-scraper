var stackoverflow = require('../stackoverflow.js');

var chai = require('chai');
chai.use(require('chai-spies'));
chai.use(require('chai-string'));

var expect = chai.expect;

describe('StackoverflowCrawler', function() {
	var http_mock = {
		request: function(params, callback) {
			callback();
		}
	};
	var crawler = new stackoverflow.Crawler('http://dummy_url/',
		http_mock);

	describe('.getHtml', function() {
		it('should call on response when finished', function() {
			var onResponse = chai.spy();

			crawler.getHtml('dummy_uri', onResponse);

			expect(onResponse).to.have.been.called();
		});
	});

	describe('.exec', function() {
		it('should call .getHtml', function(done) {
			var getHtmlCalled = false;

			crawler.getHtml = function(uri, callback) {
				getHtmlCalled = true;

				callback(null, null, null);
			};
			crawler.parseHtml = function(resp, body, callback) {
				callback(null, null);
			};
			crawler.saveCompanies = function(scrapedAds, callback) {
				callback(null);
			};
			crawler.onDone = function (){
				expect(getHtmlCalled).to.be.true;

				done();
			};

			crawler.exec();
		});

		it(
			'should call .getHtml with target URI ending with ' +
			'search keyword',
			function(done) {
				var htmlUriUsed = null;

				crawler.getHtml = function(uri, callback) {
					htmlUriUsed = uri;

					callback(null, null, null);
				};
				crawler.parseHtml = function(resp, body, callback) {
					callback(null, null);
				};
				crawler.saveCompanies = function(scrapedAds, callback) {
					callback(null);
				};
				crawler.onDone = function (){
					expect(htmlUriUsed).to
						.endsWith('search_keyword');

					done();
				};

				crawler.exec('search_keyword');
		});
	});
});
