var stackoverflow = require('../stackoverflow.js');

var chai = require('chai');
chai.use(require('chai-spies'));
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

			crawler.getHtml(onResponse);

			expect(onResponse).to.have.been.called();
		});
	});
});
