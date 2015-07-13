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

    @IBOutlet weak var playingLabel: WKInterfaceLabel!
    
    override func awakeWithContext(context: AnyObject?) {
        super.awakeWithContext(context)
        let wormhole = MMWormhole(applicationGroupIdentifier: "group.org.potpie.mpdjs", optionalDirectory: nil)
        
        self.wormhole = wormhole
        self.wormhole.listenForMessageWithIdentifier("mpdjsStatus", listener: { (messageObject) -> Void in
            if let strmsg: String = messageObject as? String {
                let data = strmsg.dataUsingEncoding(NSUTF8StringEncoding)
                var jsonError: NSError?
                let json = NSJSONSerialization.JSONObjectWithData(data!, options: nil, error: &jsonError) as! NSDictionary
                self.playingLabel.setText(json.valueForKeyPath("playing") as? String)
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
