const axios = require('axios');
const s = require('node-schedule')
const querystring = require('querystring');
const accountSid = //
const authToken = //
const client = require('twilio')(accountSid, authToken);
const Redis = require('ioredis')
const redis = new Redis(/* */)

var subscribed = [
    "+353121231234"
]

var imAliveList = [
    "+353121231234"
]

var CSRF = ""
var JSESSIONID = ""
var GCLB = ""

const request = async () => {
    var f = await axios.get('https://www.smythstoys.com/ie/en-ie/')
    var t = f.headers["set-cookie"][0].split(';')
        var tt = t[0].split("=")
    var l = f.headers["set-cookie"][3].split(';')
        var ll = l[0].split("=")
    var e = f.data.search("ACC.config.CSRFToken");
    var w = f.data.substring(e+24,e+24+36)
    CSRF = w
    JSESSIONID = tt[1]
    GCLB = ll[1]
}

const recon_de = async () => {
    var reconData;
    var f = await axios.post('https://www.smythstoys.com/ie/en-ie/store-pickup/191430/pointOfServices', querystring.stringify({
        cartPage: false, entryNumber: 0, latitude: "", longitude: "", searchThroughGeoPointFirst: false, xaaLandingStores: false, CSRFToken: CSRF
    }), {
        headers: {
            "authority": "www.smythstoys.com",
            "accept": "*/*",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "origin": "https://www.smythstoys.com",
            "sec-fetch-site": "same-origin",
            "sec-fetch-mode": "cors",
            "sec-fetch-dest": "empty",
            "referer": "https://www.smythstoys.com/ie/en-ie/video-games-and-tablets/playstation-5/playstation-5-consoles/playstation-5-digital-edition-console/p/191430",
            "accept-language": "en-US,en;q=0.9",
            "cookie": "siteVisited=false; JSESSIONID="+JSESSIONID+"; GCLB="+GCLB+"; locationCookie=_; recentlyBrowsedProducts=191430"
        }
    })
    reconData = f.data
    return reconData
}

const recon_nde = async () => {
    var reconData;
    var f = await axios.post('https://www.smythstoys.com/ie/en-ie/store-pickup/191259/pointOfServices', querystring.stringify({
        cartPage: false, entryNumber: 0, latitude: "", longitude: "", searchThroughGeoPointFirst: false, xaaLandingStores: false, CSRFToken: CSRF
    }), {
        headers: {
            "authority": "www.smythstoys.com",
            "accept": "*/*",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "origin": "https://www.smythstoys.com",
            "sec-fetch-site": "same-origin",
            "sec-fetch-mode": "cors",
            "sec-fetch-dest": "empty",
            "referer": "https://www.smythstoys.com/ie/en-ie/video-games-and-tablets/playstation-5/playstation-5-consoles/playstation-5-digital-edition-console/p/191430",
            "accept-language": "en-US,en;q=0.9",
            "cookie": "siteVisited=false; JSESSIONID="+JSESSIONID+"; GCLB="+GCLB+"; locationCookie=_; recentlyBrowsedProducts=191430"
        }
    })
    reconData = f.data
    return reconData
}


const parse = async (json,type) => {
    var availableList = []
    for await(const t of json){
        if(t.stockLevelStatusCode !== "outOfStock"){
            availableList.push({
                "model": type,
                "addr":{
                    "name": t.displayName,
                    "address": t.line1 + ", " + t.line2 + " | " + (t.line3.length ? t.line3 : t.postalCode),
                    "latLong": t.storeLatitude + "," + t.storeLongitude,
                    "eircode": t.postalCode
                }
            })
        }
    }
    return availableList
}

const determineNotification = async(results) => {
    var f = await redis.get('misc-ps5')
    if(results.length && f === "no"){
        console.log("[IMS] Condition Met, sending SMS.")
        var format = []
        results.forEach(element => format.push(["[ " + element.addr.eircode + " | " + element.model + " ]"]))
        for(const t of subscribed){
            client.messages.create({
                body:  "[IMS] New PS5 Stock has been found at Smyths. Eircode/Edition: -- "+[...format],
                to: t,
                from: '+353121231234' 
            }).then((message) => console.log(message.sid)); 
        }
        redis.set('misc-ps5', 'yes')
    }else{
        console.log("[IMS] Condition Not Met.")
    }
}

const heartbeat = async () => {
    console.log("[IMS] Sending HB.")
    for(const t of imAliveList){
        client.messages.create({
            body:  "[IMS] IMS Service is alive. This concludes daily heartbeat.",
            to: t,
            from: '+353121231234' 
        }).then((message) => console.log(message.sid));
    }    
}


s.scheduleJob('*/60 * * * * *', async () => {
    console.log("Running")
    request().then(k => {
        var t1 = recon_de()
        var t2 = recon_nde()
        var t = Promise.all([t1,t2])
        return t
    }).then(k => {
        var t1 = parse(k[0].data,"Digital Edition")
        var t2 = parse(k[1].data,"Disk Edition")
        var t = Promise.all([t1,t2])
        return t   
    }).then(k => {
        console.log("[IMS] Running Task.")
        var masterObj = []
        k[0].length ? masterObj.push(...k[0]) : false
        k[1].length ? masterObj.push(...k[1]) : false
        determineNotification(masterObj)
    }).catch(k => {
               
    })    
})

s.scheduleJob('*/23 * * *', async () => {
    //heartbeat()
})
