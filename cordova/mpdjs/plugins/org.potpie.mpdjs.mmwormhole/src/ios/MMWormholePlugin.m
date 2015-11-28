/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Richard Backhouse
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

#import "Cordova/CDV.h"
#import "Cordova/CDVViewController.h"
#import "MMWormholePlugin.h"
#import "MMWormhole.h"
#import "MMWormholeSession.h"

@interface MMWormholePlugin ()

@property (nonatomic, strong) MMWormhole* wormhole;
@property (nonatomic, strong) MMWormholeSession* wormholeSession;

@end

@implementation MMWormholePlugin

- (void) init:(CDVInvokedUrlCommand*)command {
    NSMutableDictionary *args = [command.arguments objectAtIndex:0];
    NSString *appGroupId = [args objectForKey:@"appGroupId"];

    self.wormholeSession = [MMWormholeSession sharedListeningSession];
    
    self.wormhole = [[MMWormhole alloc] initWithApplicationGroupIdentifier:appGroupId optionalDirectory:nil transitingType:MMWormholeTransitingTypeSessionContext];
    
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:appGroupId];

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];    
}

- (void)sendMessage:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *args = [command.arguments objectAtIndex:0];
    NSString *queueName = [args objectForKey:@"queueName"];
    NSString *msg = [args objectForKey:@"msg"];

    [self.wormhole passMessageObject:@{@"selectionString" : msg} identifier:queueName];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)listen:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *args = [command.arguments objectAtIndex:0];
    NSString *queueName = [args objectForKey:@"queueName"];

    [self.wormholeSession listenForMessageWithIdentifier:queueName listener:^(id message) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:message];
        [pluginResult setKeepCallbackAsBool:YES];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
    
    [self.wormholeSession activateSessionListening];
}


@end
