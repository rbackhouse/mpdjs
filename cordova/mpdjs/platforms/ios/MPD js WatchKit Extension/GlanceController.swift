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
    override func awake(withContext context: Any?) {
        super.awake(withContext: context)
        let wormhole = MMWormhole(applicationGroupIdentifier: "group.org.potpie.mpdjs2", optionalDirectory: nil)
        
        self.wormhole = wormhole
        self.wormhole.listenForMessage(withIdentifier: "mpdjsStatus", listener: { (messageObject) -> Void in
            if let strmsg: String = messageObject as? String {
                let data = strmsg.data(using: String.Encoding.utf8)
                let json = (try! JSONSerialization.jsonObject(with: data!, options: [])) as! NSDictionary
                self.artistLabel.setText(json.value(forKeyPath: "currentSong.artist") as? String)
                self.albumLabel.setText(json.value(forKeyPath: "currentSong.album") as? String)
                self.titleLabel.setText(json.value(forKeyPath: "currentSong.title") as? String)
                self.timeLabel.setText(json.value(forKeyPath: "time") as? String)
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
