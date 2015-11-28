#!/bin/bash

if [ ! -d ./mpdjs/www ]; then
	mkdir ./mpdjs/www
fi
rm -r ./mpdjs/www/*
cp -r ../resources/* ./mpdjs/www
cd ./mpdjs/jsbuild
node r.js -o build.js optimize=uglify2
cd ..
cordova build ios
cd ..
