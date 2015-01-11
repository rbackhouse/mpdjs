({
	paths: {
		jquery: '../lib/jquery/jquery-2.0.3',
		jquerymobile: '../lib/mobile/jquery.mobile-1.4.0',
		underscore: '../lib/underscore/underscore-1.5.2',
		backbone: '../lib/backbone/backbone-1.1.0',
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
	},
    name: "app",
    out: "../www/js/app-built.js",
    baseUrl: "../www/js"
})
