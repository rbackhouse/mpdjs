/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Richard Backhouse
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

#import "BonjourListener.h"

@implementation BonjourListener

- (void)pluginInitialize {
    self.services = [[NSMutableArray alloc] init];
	self.serviceBrowser = [[NSNetServiceBrowser alloc] init];
	[self.serviceBrowser setDelegate:self];
}

- (void)listen:(CDVInvokedUrlCommand*)command {
    self.listenerCommand = command;
    NSString* strType = [command.arguments objectAtIndex:0];
    NSString* strDomain = [command.arguments objectAtIndex:1];

    [self.serviceBrowser searchForServicesOfType:strType inDomain:strDomain];
}

- (void)netServiceBrowserWillSearch:(NSNetServiceBrowser *)browser {
}
 
- (void)netServiceBrowserDidStopSearch:(NSNetServiceBrowser *)browser {
}
 
- (void)netServiceBrowser:(NSNetServiceBrowser *)browser didNotSearch:(NSDictionary *)errorDict {
}
 
- (void)netServiceBrowser:(NSNetServiceBrowser *)browser didFindService:(NSNetService *)aNetService moreComing:(BOOL)moreComing {
    [aNetService setDelegate:self];
    [aNetService resolveWithTimeout:0.0];
    [self.services addObject:aNetService];
}

- (void)netServiceBrowser:(NSNetServiceBrowser *)browser didRemoveService:(NSNetService *)aNetService moreComing:(BOOL)moreComing {
    [self.services removeObject:aNetService];
    if (self.listenerCommand != nil) {
        NSMutableDictionary *jsonObj = [NSMutableDictionary dictionaryWithCapacity:2];
        [jsonObj setObject:@"remove" forKey:@"type"];
        [jsonObj setObject:[aNetService name] forKey:@"name"];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary : jsonObj];
        [pluginResult setKeepCallbackAsBool:true];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.listenerCommand.callbackId];
    }
}

- (void)netServiceDidResolveAddress:(NSNetService *)aNetService {
    if (self.listenerCommand != nil) {
        NSMutableDictionary *jsonObj = [NSMutableDictionary dictionaryWithCapacity:4];
        [jsonObj setObject:@"add" forKey:@"type"];
        [jsonObj setObject:[aNetService name] forKey:@"name"];
        [jsonObj setObject:[aNetService hostName] forKey:@"hostname"];
        [jsonObj setObject:[NSNumber numberWithInteger:aNetService.port] forKey:@"port"];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary : jsonObj];
        [pluginResult setKeepCallbackAsBool:true];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.listenerCommand.callbackId];
    }
    
}

- (void)netService:(NSNetService *)netService didNotResolve:(NSDictionary *)errorDict {
    
}

@end