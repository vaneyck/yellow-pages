const cheerio = require('cheerio')
const axios = require("axios")
const fs = require("fs")

let myData = []

let findChildByClass = function (object, clazz) {
    return object.children.find(t => {
        if (typeof t.attribs !== 'undefined' && typeof t.attribs.class !== 'undefined') {
            return (t.attribs.class.indexOf(clazz) > -1)
        } else {
            return false
        }
    })
}

let pullPage = async function (url) {
    console.log("# Getting", url)
    let fx = function (response) {
        const $ = cheerio.load(response.data, { decodeEntities: true, xmlMode: true })
        $('#search-results-items > li').each(function (index, content) {
            // console.log(index, ">>>>>> Getting for list item", content.name)
            let resultsToDisplay = content.children.find(c => {
                if (typeof c.attribs !== 'undefined') {
                    return (c.attribs.class.indexOf("results-display") > -1)
                } else {
                    return false
                }
            })
            // console.log(index, ">>>>>> Getting results to display", resultsToDisplay.attribs.class)
            let data = findChildByClass(findChildByClass(resultsToDisplay, "row"), "infoarea")
            //resultsToDisplay.children[1].children[1]

            let address = cheerio.load(cheerio.html(findChildByClass(data, 'streetaddress'))).text()
            let category = cheerio.load(cheerio.html(findChildByClass(data, 'categorybiz').children.find(t => { return t.name == "a" }))).text()
            let telephone = cheerio.load(cheerio.html(findChildByClass(data, 'business-cta').children.find(t => { return t.name == "span" }))).text()
            let website, w = findChildByClass(findChildByClass(data, 'business-cta'), 'bizwebsite')
            if (typeof w !== 'undefined') { website = w.attribs.href } else { website = '' }
            let name = cheerio.load(cheerio.html(data.children[1].children[0])).text()

            let compiledData = {
                name: name.trim(),
                address: address.trim(),
                category: category.trim(),
                telephone: telephone.trim(),
                website: website.trim()
            }
            myData.push(compiledData)
        })
        console.log("Finished Pulling")
    }
    await axios.get(url).then(fx);
    console.log("Finished FX")
}

let doStuff = async function () {
    let start = 0;
    let max = 3741;
    for (var t = start; t <= max; t++) {
        myData = []
        
        // Searching text
        // await pullPage(`https://yellowpageskenya.com/search-results?what=NGO&where=Nairobi&page=${t}`)

        // Kenya
        await pullPage(`https://yellowpageskenya.com/search-results?what=Non-Governmental%20Organizations&where=Nairobi&page=${t}`)

        const { Parser } = require('json2csv')
        const fields = ['name', 'address', 'telephone', 'category', 'website']
        const opts = { fields }

        try {
            const parser = new Parser(opts);
            let csv = parser.parse(myData);
            if (true) {
                let allLines = csv.split("\n")
                let withoutTitle = allLines.slice(1, allLines.length);
                csv = withoutTitle.join("\n") + "\n";
            }
            fs.appendFileSync("ouput.csv", csv)
        } catch (err) {
            console.error(err);
        }
    }
}

doStuff()

// To see categories : https://yellowpageskenya.com/business-categories-diverse-groups-related-businesses-listings?title=