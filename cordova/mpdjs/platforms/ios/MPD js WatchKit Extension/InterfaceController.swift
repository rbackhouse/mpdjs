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
    @IBOutlet weak var artistLabel: WKInterfaceLabel!
    @IBOutlet weak var timeLabel: WKInterfaceLabel!
    @IBOutlet weak var titleLabel: WKInterfaceLabel!
    var wormhole: MMWormhole!
    var currentState: String!
    var pauseImage: UIImage!
    var playImage: UIImage!
    var volumeSet: Bool!
    
    override init() {
        super.init()
        NSLog("%@ init", self)
        self.pauseImage = UIImage(named: "pause")
        self.playImage = UIImage(named: "play")
        self.currentState = "pause"
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
                let json = (try! NSJSONSerialization.JSONObjectWithData(data!, options: [])) as! NSDictionary
                self.artistLabel.setText(json.valueForKeyPath("currentSong.artist") as? String)
                self.timeLabel.setText(json.valueForKeyPath("time") as? String)
                self.titleLabel.setText(json.valueForKeyPath("currentSong.title") as? String)
                self.currentState = (json.valueForKeyPath("state") as? String)!
                if (self.currentState == "play") {
                    self.playPauseButton.setBackgroundImage(self.pauseImage)
                } else {
                    self.playPauseButton.setBackgroundImage(self.playImage)
                }
                let vol = (json.valueForKeyPath("volume") as? Float)
                
                if (self.volumeSet == false &&  vol > -1) {
                    NSLog("set volume %f", vol!)
                    self.volumeSet = true;
                    self.volume.setValue(vol!)
                }
            }
        })
    }

    override func willActivate() {
        super.willActivate()
        NSLog("%@ will activate", self)
        self.volumeSet = false;
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
