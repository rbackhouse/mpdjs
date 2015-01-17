//
//  SocketConnector.m
//  MPD js
//
//  Created by Richard Backhouse on 1/13/15.
//
//

#import "SocketConnection.h"

@implementation SocketConnection

- (void)pluginInitialize {
}

- (void)connect:(CDVInvokedUrlCommand*)command {
    self.connectCommand = command;
    NSString* host = [command.arguments objectAtIndex:0];
    NSString* strPort = [command.arguments objectAtIndex:1];
    int port = [strPort intValue];
    
    CFReadStreamRef readStream;
    CFWriteStreamRef writeStream;
    CFStreamCreatePairWithSocketToHost(NULL, (__bridge CFStringRef)host, port, &readStream, &writeStream);
    self.inputStream = (__bridge NSInputStream *)readStream;
    self.outputStream = (__bridge NSOutputStream *)writeStream;
    
    [self.inputStream setDelegate:self];
    [self.outputStream setDelegate:self];
    [self.inputStream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    [self.outputStream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    [self.inputStream open];
    [self.outputStream open];
}

- (void)disconnect:(CDVInvokedUrlCommand *)command {
    [self.inputStream close];
    [self.inputStream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    self.inputStream = nil;

    [self.outputStream close];
    [self.outputStream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    self.outputStream = nil;
}

- (void)writeMessage:(CDVInvokedUrlCommand *)command {
    NSString* message = [command.arguments objectAtIndex:0];
    NSData *data = [[NSData alloc] initWithData:[message dataUsingEncoding:NSUTF8StringEncoding]];
    [self.outputStream write:[data bytes] maxLength:[data length]];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"written"];
    [pluginResult setKeepCallbackAsBool:true];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)listen:(CDVInvokedUrlCommand*)command {
    self.listenerCommand = command;
}

- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)streamEvent {
    switch (streamEvent) {
        case NSStreamEventOpenCompleted: {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"connected"];
            [pluginResult setKeepCallbackAsBool:true];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.connectCommand.callbackId];
            break;
        }
            
        case NSStreamEventHasBytesAvailable:
            if (stream == self.inputStream) {
                uint8_t buffer[1024];
                int len;
                
                while ([self.inputStream hasBytesAvailable]) {
                    len = [self.inputStream read:buffer maxLength:sizeof(buffer)];
                    if (len > 0) {
                        
                        NSString *output = [[NSString alloc] initWithBytes:buffer length:len encoding:NSUTF8StringEncoding];
                        
                        if (output != nil) {
                            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:output];
                            [pluginResult setKeepCallbackAsBool:true];
                            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.listenerCommand.callbackId];
                        }
                    }
                }
            }
            break;
            
            
        case NSStreamEventErrorOccurred: {
            NSError *theError = [stream streamError];
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[theError localizedDescription]];
            [pluginResult setKeepCallbackAsBool:true];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.connectCommand.callbackId];
            break;
        }
            
        case NSStreamEventEndEncountered: {
            [stream close];
            [stream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
            stream = nil;
            
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"disconnected"];
            [pluginResult setKeepCallbackAsBool:true];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.connectCommand.callbackId];
            break;
        }
            
        default:
            break;
    }
}


@end