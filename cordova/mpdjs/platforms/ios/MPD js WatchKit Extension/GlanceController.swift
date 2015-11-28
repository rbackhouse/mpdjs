//
//  GlanceController.swift
//  MPD js WatchKit Extension
//
//  Created by Richard Backhouse on 7/4/15.
//
//

import WatchKit
import Foundation


class GlanceController: WKInterfaceController {
    var wormhole: MMWormhole!

    @IBOutlet weak var timeLabel: WKInterfaceLabel!
    @IBOutlet weak var titleLabel: WKInterfaceLabel!
    @IBOutlet weak var albumLabel: WKInterfaceLabel!
    @IBOutlet weak var artistLabel: WKInterfaceLabel!
    override func awakeWithContext(context: AnyObject?) {
        super.awakeWithContext(context)
        let wormhole = MMWormhole(applicationGroupIdentifier: "group.org.potpie.mpdjs2", optionalDirectory: nil)
        
        self.wormhole = wormhole
        self.wormhole.listenForMessageWithIdentifier("mpdjsStatus", listener: { (messageObject) -> Void in
            if let strmsg: String = messageObject as? String {
                let data = strmsg.dataUsingEncoding(NSUTF8StringEncoding)
                let json = (try! NSJSONSerialization.JSONObjectWithData(data!, options: [])) as! NSDictionary
                self.artistLabel.setText(json.valueForKeyPath("currentSong.artist") as? String)
                self.albumLabel.setText(json.valueForKeyPath("currentSong.album") as? String)
                self.titleLabel.setText(json.valueForKeyPath("currentSong.title") as? String)
                self.timeLabel.setText(json.valueForKeyPath("time") as? String)
            }
        })
        
    }

    override func willActivate() {
        super.willActivate()
    }

    override func didDeactivate() {
        super.didDeactivate()
    }

}
