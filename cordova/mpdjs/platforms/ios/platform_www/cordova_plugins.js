cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-console/www/console-via-logger.js",
        "id": "cordova-plugin-console.console",
        "pluginId": "cordova-plugin-console",
        "clobbers": [
            "console"
        ]
    },
    {
        "file": "plugins/cordova-plugin-console/www/logger.js",
        "id": "cordova-plugin-console.logger",
        "pluginId": "cordova-plugin-console",
        "clobbers": [
            "cordova.logger"
        ]
    },
    {
        "file": "plugins/cordova-plugin-device/www/device.js",
        "id": "cordova-plugin-device.device",
        "pluginId": "cordova-plugin-device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
        "id": "cordova-plugin-statusbar.statusbar",
        "pluginId": "cordova-plugin-statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    },
    {
        "file": "plugins/org.potpie.mpdjs.socketconnection/www/SocketConnection.js",
        "id": "org.potpie.mpdjs.socketconnection.SocketConnection",
        "pluginId": "org.potpie.mpdjs.socketconnection",
        "clobbers": [
            "window.SocketConnection"
        ]
    },
    {
        "file": "plugins/org.potpie.mpdjs.mmwormhole/www/MMWormholePlugin.js",
        "id": "org.potpie.mpdjs.mmwormhole.MMWormhole",
        "pluginId": "org.potpie.mpdjs.mmwormhole",
        "clobbers": [
            "window.MMWormhole"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-console": "1.0.2",
    "cordova-plugin-device": "1.1.0",
    "cordova-plugin-statusbar": "2.0.0",
    "org.potpie.mpdjs.socketconnection": "1.0.0",
    "org.potpie.mpdjs.mmwormhole": "1.0.0"
}
// BOTTOM OF METADATA
});