/**
 * Crawl through recursivly
 * @param list of parents
 * @param levels
 * @param crawlDeeper
 * @param singleCallback
 * @param allCallback
 */
function recursiveCrawl(list, levels, crawlDeeper, singleCallback, allCallback) {
    let count = 0;
    console.log("Crawl List");
    console.log(list);

    list.forEach(item => {

        crawl(item, 1, (item, level) => {
            count -= 1;
            if (singleCallback)
                singleCallback(item);

            if (count === 0 && level === 1 && allCallback) {
                allCallback();
            }
        });
    });

    function crawl(item, level, callback) {
        console.log("Crawl Item");
        console.log(item);
        count += 1;


        if (callback)
            callback(item, level);

        if (item.children && item.children.length > 0) {
            crawl(item.children, level + 1, callback);
        }

        if (crawlDeeper && item.childrenLinks && item.childrenLinks.length > 0) {

            crawlDeeper(item, function (items) {
                items.forEach(item => {
                    if (level + 1 < levels)
                        crawl(item, level + 1, callback);
                });
            });

        }

    }
}

function recursiveAsListCopy(baseList) {
    let finalList = [];
    baseList.forEach(item => {
        addToList(item);
    });

    function addToList(item) {
        if (!item)
            return;

        finalList.push(item);
        item.children.forEach(item => {
            addToList(item);
        });
    }

    return finalList;
}

function crawlDeeper(parent, callback) {
    createItems(parent.childrenLinks, item => {
        addToCrawledSite(parent, item);
    }, (items) => {
        parent.childrenLinks = [];
        if (callback)
            callback(items);
        saveStorage("crawledSite", storage.crawledSite);
        saveStorage("allCrawledLinks", storage.allCrawledLinks);
        saveStorage("allLinks", storage.allLinks);
        saveStorage("allImages", storage.allImages);
    })
}

/**
 * Find Link item that has matching link
 * @param crawledSite
 * @param link
 * @returns {*}
 */
function findItem(crawledSite, link) {

    let finalItem = null;
    look(crawledSite, link);

    return finalItem;

    function look(items, link) {
        items.forEach(item => {
            if (item.link === link) {
                finalItem = item;
                return item;
            } else {
                look(item.children, link);
            }

        });
    }
}

/**
 * Make sure all link items are in the right location in the structure
 * @param siteStructure
 * @param callback
 */
function sortSite(siteStructure, callback) {
    let removeFromMaster = [];
    let newStructure = [];
    let masterList = [];

    let loopChange = false;
    masterList = recursiveAsListCopy(siteStructure);
    masterList.forEach(item => {
        item.children = [];
    });

    while (masterList.length !== 0) {
        loopChange = false;
        masterList.forEach(item => {

            if (item.link === startUrl) {
                newStructure.push(item);
                removeFromMaster.push(item);
                loopChange = true;
            }
            else {
                let parentItem = findItem(newStructure, item.parentPath);
                if (parentItem) {
                    parentItem.children.push(item);
                    removeFromMaster.push(item);
                    loopChange = true;
                }
            }
        });
        removeFromMaster.forEach(item => {
            masterList.splice(masterList.indexOf(item), 1);
        });


        removeFromMaster = [];

        if (!loopChange)
            break;
    }

    try {
        masterList.forEach(item => {
            newStructure[0].push(item);
        });
    } catch (error) {

        newStructure = newStructure.concat(masterList);
    }
    masterList = [];
    return newStructure;
}

/**
 * Create a list of items
 * @param urlList
 * @param singleCallback
 * @param allCallback
 */
function createItems(urlList, singleCallback, allCallback) {
    let itemList = [];
    //Have to use created, as number 3 can get finished before number 1
    let created = 0;
    urlList.forEach(item => {
        createItem(item, finalItem => {
            created += 1;
            if (finalItem) {
                itemList.push(finalItem);
                if (singleCallback)
                    singleCallback(finalItem);
            }
            if (created === urlList.length) {

                if (allCallback)
                    allCallback(itemList);
            }
        });
    });
}

/**
 * Add Item to the crawledSite
 * @param parent
 * @param item (Single)
 */
function addToCrawledSite(parent, item) {
    if (parent)
        parent.children.push(item);
    else {
        storage.crawledSite.push(item);
    }
}

/**
 * Gets if the link was already crawled, then adds it to the list
 * @param link
 * @returns {boolean}
 */
function isAlreadyCrawled(link) {
    let found = storage.allCrawledLinks.includes(link);
    if (!found) {
        storage.allCrawledLinks.push(link);
    }
    return found;
}

/**
 *
 * @param link
 * @param defaultItem
 * @param callback
 */
function createItemWithoutRequest(link, defaultItem, callback) {
    let baseLink = link;

    let allLinks = [];
    let childrenLinks = [];
    let otherLinks = [];
    let images = [];
    let item = {
        link: link,
        path: link === domain ? '' : link.substr(link.lastIndexOf('/'), link.length),
        parentPath: link === domain ? domain : link.substr(0, link.lastIndexOf('/')),
        isBroken: false,
        children: [],
        childrenLinks: [],
        otherLinks: [],
        images: []
    };
    $.extend(true, item, defaultItem);

    item.allLinks.forEach(link => {
        link = externalizeLink(link);
        if (link) {
            if (onSameDomain(link))
                link = updateProtocol(link);
            if (!allLinks.includes(link)) {
                allLinks.push(link);
                if (isDomainBasedLink(link) && !isAlreadyCrawled(link) && isValidHTMLFileURL(link))
                    childrenLinks.push(link);
                else if (!otherLinks.includes(link) && !storage.allCrawledLinks.includes(link))
                    otherLinks.push(link);
                if (!storage.allLinks.includes(link))
                    storage.allLinks.push(link);

                addLinkLocation(link, baseLink);
            }
        }
    });

    item.images.forEach(link => {
        link = externalizeLink(link);
        if (link) {
            if (onSameDomain(link))
                link = updateProtocol(link);
            if (!images.includes(link))
                images.push(link);

            if (!storage.allImages.includes(link))
                storage.allImages.push(link);
            addImageLocation(link, baseLink);
        }

    });
    item.images = images.sort(sortLinkFileTypes);
    item.allLinks = allLinks;
    item.childrenLinks = childrenLinks;
    item.otherLinks = otherLinks.sort(sortLinkFileTypes);


    if (callback)
        callback(item);
}

/**
 * Create a link item
 * @param link
 * @param callback
 */
function createItem(link, callback) {
    let item = {
        link: link,
        path: link === domain ? '' : link.substr(link.lastIndexOf('/'), link.length),
        parentPath: link === domain ? domain : link.substr(0, link.lastIndexOf('/')),
        isBroken: false,
        children: [],
        childrenLinks: [],
        allLinks: [],
        otherLinks: [],
        images: []

    };
    $.get(link)
        .done(data => {
            let $data = $(data);

            $data.find('a').each(function () {
                let href = $(this).attr('href');
                href = externalizeLink(href);
                if (href) {
                    if (onSameDomain(href))
                        href = updateProtocol(href);
                    if (!item.allLinks.includes(href))
                        item.allLinks.push(href);

                    if (isDomainBasedLink(href) && !isAlreadyCrawled(href) && isValidHTMLFileURL(href))
                        item.childrenLinks.push(href);
                    else if (!item.otherLinks.includes(href) && !storage.allCrawledLinks.includes(href))
                        item.otherLinks.push(href);
                    if (!storage.allLinks.includes(href))
                        storage.allLinks.push(href);
                    addLinkLocation(href, link);
                }
            });
            $data.find('img').sort(sortLinkFileTypes).each(function () {
                let img = $(this).attr('src');
                img = externalizeLink(img);
                if (onSameDomain(img))
                    img = updateProtocol(img);
                if (!item.images.includes(img))
                    item.images.push(img);
                if (!storage.allImages.includes(img))
                    storage.allImages.push(img);
                addImageLocation(img, link);
            });
            item.images = item.images.sort(sortLinkFileTypes);
            item.otherLinks = item.otherLinks.sort(sortLinkFileTypes);

            item.title = $data.filter('title').text();
            item.html = data;
            item.$html = $data;

        }).fail(() => {
        item.title = "Broken Link";
        item.isBroken = true;
    }).always(() => {

        if (callback)
            callback(item);
    });
}
