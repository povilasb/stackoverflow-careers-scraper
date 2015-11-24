=====
About
=====

.. image:: https://travis-ci.org/povilasb/stackoverflow-careers-scraper.svg?branch=master

This tool scrapes companies from Stackoverflow careers site.


Setup database
==============

MongoDB is used for company information storage. To setup database in
MongoDB open `mongo` CLI tool and type::

	> db.companies.createIndex({company: 1}, {unique: true})
