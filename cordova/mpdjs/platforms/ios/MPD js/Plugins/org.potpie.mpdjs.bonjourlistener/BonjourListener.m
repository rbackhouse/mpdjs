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
#import <arpa/inet.h>

@implementation BonjourListener

- (void)pluginInitialize {
    self.services = [[NSMutableArray alloc] init];
	self.serviceBrowser = [[NSNetServiceBrowser alloc] init];
	[self.serviceBrowser setDelegate:self];
    [self.serviceBrowser scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
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
    [aNetService resolveWithTimeout:5.0];
    [self.services addObject:aNetService];
    [aNetService scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    
    if (self.listenerCommand != nil) {
        NSMutableDictionary *jsonObj = [NSMutableDictionary dictionaryWithCapacity:2];
        [jsonObj setObject:@"discover" forKey:@"type"];
        [jsonObj setObject:[aNetService name] forKey:@"name"];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary : jsonObj];
        [pluginResult setKeepCallbackAsBool:true];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.listenerCommand.callbackId];
    }
}

- (void)netServiceBrowser:(NSNetServiceBrowser *)browser didRemoveService:(NSNetService *)aNetService moreComing:(BOOL)moreComing {
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
        NSMutableDictionary *jsonObj = [NSMutableDictionary dictionaryWithCapacity:5];
        [jsonObj setObject:@"add" forKey:@"type"];
        [jsonObj setObject:[aNetService name] forKey:@"name"];
        [jsonObj setObject:[aNetService hostName] forKey:@"hostname"];
        [jsonObj setObject:[NSNumber numberWithInteger:aNetService.port] forKey:@"port"];
        NSString * ipAddress = [self findIPAddress:[aNetService addresses]];
        if (ipAddress != nil) {
            [jsonObj setObject:ipAddress forKey:@"ipAddress"];
        }
        [self.services removeObject:aNetService];
        [aNetService removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
        [aNetService stop];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary : jsonObj];
        [pluginResult setKeepCallbackAsBool:true];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.listenerCommand.callbackId];
    }
}

- (void)netService:(NSNetService *)netService didNotResolve:(NSDictionary *)errorDict {
    
}

- (NSString*)findIPAddress:(NSArray<NSData *> *)addresses {
    char addressBuffer[INET6_ADDRSTRLEN];
    
    for (NSData *data in addresses) {
        memset(addressBuffer, 0, INET6_ADDRSTRLEN);
        
        typedef union {
            struct sockaddr sa;
            struct sockaddr_in ipv4;
            struct sockaddr_in6 ipv6;
        } ip_socket_address;
        
        ip_socket_address *socketAddress = (ip_socket_address *)[data bytes];
        
        if (socketAddress && (socketAddress->sa.sa_family == AF_INET || socketAddress->sa.sa_family == AF_INET6)) {
            const char *addressStr = inet_ntop(socketAddress->sa.sa_family,
                                               (socketAddress->sa.sa_family == AF_INET ? (void *)&(socketAddress->ipv4.sin_addr) : (void *)&(socketAddress->ipv6.sin6_addr)),
                                               addressBuffer,
                                               sizeof(addressBuffer));
            return [NSString stringWithUTF8String:addressStr];
        }
    }
    return nil;
}

@end
