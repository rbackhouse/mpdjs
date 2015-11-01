#!/bin/bash

rm -r ./mpdjs/www/*
cp -r ../resources/* ./mpdjs/www
cd ./mpdjs/jsbuild
node r.js -o build.js optimize=uglify2
cd ..
cordova prepare ios
cordova compile ios
cd ..
