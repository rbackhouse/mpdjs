//
//  InterfaceController.swift
//  MPD js WatchKit Extension
//
//  Created by Richard Backhouse on 7/4/15.
//
//

import WatchKit
import Foundation
// FIXME: comparison operators with optionals were removed from the Swift Standard Libary.
// Consider refactoring the code to use the non-optional operators.
fileprivate func < <T : Comparable>(lhs: T?, rhs: T?) -> Bool {
  switch (lhs, rhs) {
  case let (l?, r?):
    return l < r
  case (nil, _?):
    return true
  default:
    return false
  }
}

// FIXME: comparison operators with optionals were removed from the Swift Standard Libary.
// Consider refactoring the code to use the non-optional operators.
fileprivate func > <T : Comparable>(lhs: T?, rhs: T?) -> Bool {
  switch (lhs, rhs) {
  case let (l?, r?):
    return l > r
  default:
    return rhs < lhs
  }
}


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
    
    override func awake(withContext context: Any?) {
        super.awake(withContext: context)
        NSLog("%@ awakeWithContext", self)
        
        let wormhole = MMWormhole(applicationGroupIdentifier: "group.org.potpie.mpdjs2", optionalDirectory: nil)
        
        self.wormhole = wormhole
        self.wormhole.listenForMessage(withIdentifier: "mpdjsStatus", listener: { (messageObject) -> Void in
            if let strmsg: String = messageObject as? String {
                let data = strmsg.data(using: String.Encoding.utf8)
                let json = (try! JSONSerialization.jsonObject(with: data!, options: [])) as! NSDictionary
                self.artistLabel.setText(json.value(forKeyPath: "currentSong.artist") as? String)
                self.timeLabel.setText(json.value(forKeyPath: "time") as? String)
                self.titleLabel.setText(json.value(forKeyPath: "currentSong.title") as? String)
                self.currentState = (json.value(forKeyPath: "state") as? String)!
                if (self.currentState == "play") {
                    self.playPauseButton.setBackgroundImage(self.pauseImage)
                } else {
                    self.playPauseButton.setBackgroundImage(self.playImage)
                }
                let vol = (json.value(forKeyPath: "volume") as? Float)
                
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
            self.wormhole.passMessageObject(["command": "pause"] as NSCoding?, identifier: "mpdjsCommand")
        } else {
            self.wormhole.passMessageObject(["command": "play"] as NSCoding?, identifier: "mpdjsCommand")
        }
    }

    @IBAction func stop() {
        self.wormhole.passMessageObject(["command": "stop"] as NSCoding?, identifier: "mpdjsCommand")
    }
    
    @IBAction func previous() {
        self.wormhole.passMessageObject(["command": "previous"] as NSCoding?, identifier: "mpdjsCommand")
    }

    @IBAction func next() {
        self.wormhole.passMessageObject(["command": "next"] as NSCoding?, identifier: "mpdjsCommand")
    }
    
    @IBAction func volumeChange(_ value: Float) {
        self.wormhole.passMessageObject(["command": "changeVolume", "value": value] as NSCoding?, identifier: "mpdjsCommand")
    }
}
