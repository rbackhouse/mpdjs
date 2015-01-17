//
//  SocketConnector.h
//  MPD js
//
//  Created by Richard Backhouse on 1/13/15.
//
//

#import <Cordova/CDV.h>

@interface SocketConnection : CDVPlugin<NSStreamDelegate> 

- (void)connect:(CDVInvokedUrlCommand*)command;
- (void)disconnect:(CDVInvokedUrlCommand*)command;
- (void)writeMessage:(CDVInvokedUrlCommand*)command;
- (void)listen:(CDVInvokedUrlCommand*)command;

@property (strong, nonatomic) CDVInvokedUrlCommand* connectCommand;
@property (strong, nonatomic) CDVInvokedUrlCommand* listenerCommand;
@property (strong, nonatomic) NSInputStream	*inputStream;
@property (strong, nonatomic) NSOutputStream *outputStream;

@end