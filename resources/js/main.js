var zazlConfig = {
	baseUrl: 'js/',
	directInject: true,
	paths: {
		jquery: '../lib/jquery/jquery-1.8.2',
		jquerymobile: '../lib/mobile/jquery.mobile-1.2.0',
		underscore: '../lib/underscore/underscore',
		backbone: '../lib/backbone/backbone',
		text: '../lib/requirejs/text',
		templates: '../templates'
	},
	shim: {
		'backbone' : {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},
		'underscore' : {
			exports: '_'
		}
	}
};

require(['app']);
