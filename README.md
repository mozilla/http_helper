# http_helper

# OVERVIEW
A simple node.js redirector and proxy application.  Given a config file full of
redirect and proxy mappings, this application will match incoming HOST headers
and take the appropriate action by 301/302 redirecting or proxying.

This is useful for redirecting www to root domains, redirecting old domains
to new domains, proxying for SSL from non-SSL sources on AWS.

# PREREQUISITES
* node.js (v0.10.28 preferred)
* npm (comes with node.js)

# PREFLIGHT
* mv ./config-json.dist to ./config.json
* Update mappings for redirects/proxies based on your needs

As an example, if we wanted to setup a redirect to yourdomain.com
from www.yourdomain.com, we would add the following block in config.json:
    "www.yourdomain.com": {
      "host": "http://yourdomain.com",
      "code": 301,
      "function": "redirect"
      },
(*Note*: The function setting can be either redirect or proxy)


# RUNNING THIS APPLICATION
Simply run node ./bin/server.js


# FURTHER INFORMATION
Author: JP Schneider (Github: jdotpz, jp@mozillafoundation.org)
Bugs/Requests: https://www.github.com/mozilla/http_helper/issues

* New Relic monitoring is written into this application.  Simply provide your own
newrelic.js or config settings and it will just work.

* Messina is an amazing GELF log utility written by Brian Brennan (brianloveswords).  To output
to your own GELF facility, set the following env variables

export GRAYLOG_HOST="address.to_your_logging_server.com"    #defaults to localhost
export GRAYLOG_PORT=12201                    #defaults to 12201
export GRAYLOG_FACILITY="httphelper-production" #defaults to openbadger
export ENABLE_GELF_LOGS=true
