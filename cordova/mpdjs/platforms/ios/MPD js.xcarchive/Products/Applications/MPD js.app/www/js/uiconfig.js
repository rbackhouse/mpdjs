define(function() {
	var connections = [];
	var discoveredList = [];
	var randomPlaylistConfig = {};
	var selectedIndex = -1;
	var discoveredIndex = -1;
	var isDirect = false;
	var discoverListeners = [];
	
	if (window.cordova) {
		var connectionsStr = localStorage["mpdjs.connections"];
		if (connectionsStr) {
			var connectionsData = JSON.parse(connectionsStr);
			connections = connectionsData.connections;
			connections.forEach(function(connection) {
				if (!connection.streamingport) {
					connection.streamingport = "";
				}
			});
			selectedIndex = connectionsData.selectedIndex;
		}
		isDirect = true;
		require(['deviceReady!'], function() {
			BonjourListener.listen('_mpd._tcp.', 'local.', function(result) {
				console.log(JSON.stringify(result));
				
				if (result.type === 'add' && result.ipAddress) {
					var connection = {
						host: result.ipAddress,
						port: result.port,
						streamingport: "",
						name: result.name
					}
					var add = true;
					discoveredList.forEach(function(discovered) {
						if (discovered.host === result.ipAddress && discovered.port === result.port) {
							add = false;
						}
					});
					if (add) {
						discoveredList.push(connection);
						var added = {added: connection};
						discoverListeners.forEach(function(listener) {
							listener(added);
						});
					}
				} else if (result.type === 'remove') {
					for (var i = discoveredList.length - 1; i >= 0; i--) {
						if (discoveredList[i].name === result.name) {
							var conns = discoveredList.splice(i, 1);
							var removed = {removed: conns[0]};
							discoverListeners.forEach(function(listener) {
								listener(removed);
							});
						}
					}
				}
			});
		});	
	} else {
		connections[0] = {
			host: ".",
			port: "0"
		}
	}
	var randomPlaylistConfigStr = localStorage["mpdjs.randomPlaylistConfig"];
	if (randomPlaylistConfigStr) {
		randomPlaylistConfig = JSON.parse(randomPlaylistConfigStr);
	} else {
		randomPlaylistConfig = {
			enabled: false,
			type: "",
			typevalue: ""
		};
	}

	return {
		getBaseUrl: function() {
			if (connections[0].host === ".") {
				return ".";
			} else {
				return "http://"+connections[0].host +":"+connections[0].port;
			}
		},
		getWSUrl: function() {
			if (connections[0].host === ".") {
				return 'ws://' + window.location.host;
			} else {
				return 'ws://'+connections[0].host +":"+connections[0].port;
			}
		},
		getConnection: function() {
			return connections[selectedIndex];
		},
		getDiscovered: function() {
			return discoveredList[discoveredIndex];
		},
		promptForConnection: function() {
			return window.cordova && connections.length === 0 && discoveredList.length === 0 ? true : false;
		},
		isDirect: function() {
			return isDirect;
		},
		getConnections: function() {
			return connections;
		},
		getDiscoveredList: function() {
			return discoveredList;
		},
		addConnection: function(host, port, streamingport, pwd) {
			var connection = {
				host: host,
				port: port,
				streamingport: streamingport,
				pwd: pwd
			}
			var index = connections.push(connection) - 1;
			var connectionsStr = JSON.stringify({ connections: connections, selectedIndex: selectedIndex });
			localStorage["mpdjs.connections"] = connectionsStr;
			return index;
		},
		removeConnection: function(index) {
			connections.splice(index, 1);
			if (index === selectedIndex) {
				selectedIndex = 0;
			}
			var connectionsStr = JSON.stringify({ connections: connections, selectedIndex: selectedIndex });
			localStorage["mpdjs.connections"] = connectionsStr;
		},
		getSelectedIndex: function() {
			return selectedIndex;
		},
		setSelectedIndex: function(index) {
			selectedIndex = index;
			var connectionsStr = JSON.stringify({ connections: connections, selectedIndex: selectedIndex });
			localStorage["mpdjs.connections"] = connectionsStr;
		},
		getDiscoveredIndex: function() {
			return discoveredIndex;
		},
		setDiscoveredIndex: function(index) {
			discoveredIndex = index;
		},
		getConnectionConfig: function() {
			if (selectedIndex !== -1) {
				return connections[selectedIndex];
			} else if (discoveredIndex  !== -1) {
				return discoveredList[discoveredIndex];
			} else if (connections.length > 0) {
				this.setSelectedIndex(0);
				return connections[0];
			} else if (discoveredList.length > 0) {
				this.setDiscoveredIndex(0);
				return discoveredList[0];
			}
		},
		getRandomPlaylistConfig: function() {
			return randomPlaylistConfig;
		},
		setRandomPlaylistConfig: function(newRandomPlaylistConfig) {
			randomPlaylistConfig = newRandomPlaylistConfig;
			var randomPlaylistConfigStr = JSON.stringify(newRandomPlaylistConfig);
			localStorage["mpdjs.randomPlaylistConfig"] = randomPlaylistConfigStr;
		},
		getStartPage: function() {
			var startPage = localStorage["mpdjs.startPage"];
			if (!startPage) {
				if (window.cordova) {
					startPage = "connections";
				} else {
					startPage = "playlist";
				}
				this.setStartPage(startPage);
			}
			return startPage;
		},
		setStartPage: function(startPage) {
			localStorage["mpdjs.startPage"] = startPage;
		},
		getVersionNumber: function() {
			return "2.5";
		},
		setSongToPlaylist: function(songToPlaylist) {
			localStorage["mpdjs.songToPlaylist"] = songToPlaylist;
		},
		isSongToPlaylist: function() {
			var songToPlaylist = localStorage["mpdjs.songToPlaylist"];
			if (!songToPlaylist) {
				songToPlaylist = "true";
				this.setSongToPlaylist(songToPlaylist);
			}
			return songToPlaylist === "true" ? true : false;
		},
		addDiscoverListener: function(listener) {
			discoverListeners.push(listener);
		},
		removeDiscoverListener: function(listener) {
			var index = discoverListeners.indexOf(listener);
			if (index > -1) {
				discoverListeners.splice(index, 1);
			}
		}
	}
});