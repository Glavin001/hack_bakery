function(uri, done) {
	
	var jsdom = require('jsdom'),
		request = require('request');
	
	request({uri:uri}, function(err, response, body) {
		console.log("Finished request");

		// Basic error checking
		if (err && response.statusCode !== 200) {
			console.log('Request error.');
		}

		jsdom.env({html:body, scripts:['http://code.jquery.com/jquery.js']}, function(err, window) {
			var $ = window.jQuery;
			var text = $('body').text();
			var words = {};
			
			function handleWord(word) {
				// Increment the word count
				(words[word] && words++) || (words[word] = 1);
			}

			var startIndex = 0, length = 0;
			for (var i = 0; i < text.length; i++) {
				// White space is space ASCII 0x20 and anything less "control codes"
				if (text.charCodeAt(i) <= 0x20) {
					// If we had been counting length, pull out the string
					if (length > 0)
						handleWord(text.substr(startIndex, length));
						// Start processing within quoatations
						startIndex = i + 1;
						length = 0;
				} else
					// Keep increasing the length so we can read this out at the next break
					length++;
			}
			// if we were counting characters, but did not extract them because of unhandled termiantion, let's extract them as the last item
			if (length > 0)
				handleWord(text.substr(startIndex, length));

			done();
		});

	});

}