//
//  InterfaceController.swift
//  MPD js WatchKit Extension
//
//  Created by Richard Backhouse on 7/4/15.
//
//

import WatchKit
import Foundation

class InterfaceController: WKInterfaceController {

    @IBOutlet weak var volume: WKInterfaceSlider!
    @IBOutlet weak var playPauseButton: WKInterfaceButton!
    @IBOutlet weak var playingLabel: WKInterfaceLabel!
    var wormhole: MMWormhole!
    var currentState: String!
    
    override init() {
        super.init()
        NSLog("%@ init", self)
    }
    
    override func awakeWithContext(context: AnyObject?) {
        super.awakeWithContext(context)
        NSLog("%@ awakeWithContext", self)
        
        let wormhole = MMWormhole(applicationGroupIdentifier: "group.org.potpie.mpdjs", optionalDirectory: nil)
        
        self.wormhole = wormhole
        self.wormhole.listenForMessageWithIdentifier("mpdjsStatus", listener: { (messageObject) -> Void in
            if let strmsg: String = messageObject as? String {
                let data = strmsg.dataUsingEncoding(NSUTF8StringEncoding)
                var jsonError: NSError?
                let json = NSJSONSerialization.JSONObjectWithData(data!, options: nil, error: &jsonError) as! NSDictionary
                self.playingLabel.setText(json.valueForKeyPath("playing") as? String)
                self.currentState = (json.valueForKeyPath("state") as? String)!
                if (self.currentState == "play") {
                    if let image = UIImage(named: "pause") {
                        self.playPauseButton.setBackgroundImage(image)
                    }
                } else {
                    if let image = UIImage(named: "play") {
                        self.playPauseButton.setBackgroundImage(image)
                    }
                }
            }
        })
    }

    override func willActivate() {
        super.willActivate()
        NSLog("%@ will activate", self)
    }

    override func didDeactivate() {
        NSLog("%@ did deactivate", self)
        super.didDeactivate()
    }

    @IBAction func playPause() {
        if (self.currentState == "play") {
            self.wormhole.passMessageObject(["command": "pause"], identifier: "mpdjsCommand")
        } else {
            self.wormhole.passMessageObject(["command": "play"], identifier: "mpdjsCommand")
        }
    }

    @IBAction func stop() {
        self.wormhole.passMessageObject(["command": "stop"], identifier: "mpdjsCommand")
    }
    
    @IBAction func previous() {
        self.wormhole.passMessageObject(["command": "previous"], identifier: "mpdjsCommand")
    }

    @IBAction func next() {
        self.wormhole.passMessageObject(["command": "next"], identifier: "mpdjsCommand")
    }
    
    @IBAction func volumeChange(value: Float) {
        self.wormhole.passMessageObject(["command": "changeVolume", "value": value], identifier: "mpdjsCommand")
    }
}
