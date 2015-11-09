mocha := $(CURDIR)/node_modules/mocha/bin/mocha

test:
	$(mocha) tests
.PHONY: test
