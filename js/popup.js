let protocol = "http://";
let domain = "";

let startUrl = "";
let tab = null;
let lastPage = null;

let options = {
    'localizeAllStyles': 'false',
    'localizeAllScripts': 'false',
    'autoSortLinks': 'true',
    'startAtRoot': 'true',
    'crawlOnOpen': 'false',
    'askWhereDownload': 'true'
};

document.addEventListener('DOMContentLoaded', function () {
    $(document).tooltip();
    console.log("Ready");
    setup();

    chrome.tabs.query(
        {
            active: true,
            currentWindow: true
        },
        currentTab => {
            tab = currentTab;
            setupGlobalEvents();
            loadStorageOptions(() => {

                Object.keys(options).forEach(item => setRadioButtonSelected(item, options[item]));

                loadStorage([
                    "crawledSite",
                    "allCrawledLinks",
                    "allImages",
                    "allLinks",
                    "savedScripts",
                    "savedStyles",
                    "linkLocations",
                    "imageLocations"
                ], saved => {

                    if (saved && saved["crawledSite"] && saved["crawledSite"].length > 0) {

                        isSameDomainAsStorage((result, storageDomain) => {
                            if (result) {
                                console.log("Loaded Site");
                                domain = storageDomain;

                                storage.crawledSite = saved["crawledSite"];
                                storage.allCrawledLinks = saved["allCrawledLinks"];
                                storage.allLinks = saved["allLinks"];
                                storage.allImages = saved["allImages"];
                                storage.savedScripts = saved["savedScripts"];
                                storage.savedStyles = saved["savedStyles"];
                                storage.linkLocations = saved["linkLocations"];
                                storage.imageLocations = saved["imageLocations"];
                                console.log(storage.linkLocations);

                                hideLoading();
                                updateMainHtml();
                            } else
                                init();
                        });

                    } else
                        init();

                });
            });
        });
});

function setup() {
    setupGlobalEvents();
    setupMainEvents();
    setupMenuEvents();
    setupMoreEvents();

    showLoading();
    hideMenu();
    showMain();
}

function init() {

    showLoading();


    storage.crawledSite = [];
    storage.allCrawledLinks = [];
    storage.allLinks = [];
    storage.allImages = [];
    storage.linkLocations = {};
    storage.imageLocations = {};

    let url = new URL(tab[0].url);
    domain = url.origin;

    saveStorage("domain", domain);
    saveStorage("crawledSite", null);

    //Determine the protocol
    if (domain.indexOf(protocol) === -1)
        protocol = 'https://';

    createContainerBase(url, (finalItem) => {
        $("#loadingOverlay").hide();
        if (finalItem) {
            addToCrawledSite(null, finalItem);
            updateMainHtml();

            if (options.crawlOnOpen == 'true') {
                recursiveCrawl(storage.crawledSite, 2, true, () => {
                    updateMainHtml();

                }, () => {
                    saveStorage("crawledSite", storage.crawledSite);

                    if (options.autoSortLinks == 'true') {
                        storage.crawledSite = sortSite(storage.crawledSite);
                    }
                });
            } else
                hideLoading();
        }
    });
}

function createContainerBase(url, callback) {
    let current = url.href;
    if (current.lastIndexOf('/') === current.length - 1)
        current = current.substr(0, url.href.length - 1);
    let startAtRoot = options.startAtRoot == 'true';
    startUrl = (startAtRoot ? domain : current);

    storage.allCrawledLinks.push(startUrl);
    if (startUrl === domain) {
        storage.allCrawledLinks.push(domain);
        storage.allCrawledLinks.push(domain + '/');
    }
    if (startUrl === current) {
        console.log("Injecting for Information");
        chrome.tabs.executeScript([0].id, {
            code: 'var temp = ' +
            '{title: document.getElementsByTagName("title")[0].innerHTML, ' +
            'html: document.documentElement.innerHTML, ' +
            'allLinks: Array.from(document.getElementsByTagName("a")).map(a => a.href), ' +
            'images: Array.from(document.getElementsByTagName("img")).map(a => a.src)}; ' +
            'temp'
        }, result => {
            let tempItem = result[0];
            tempItem.$html = $(tempItem.html);
            createItemWithoutRequest(current, tempItem, finalItem => {

                if (callback)
                    callback(finalItem);
            });

        });
    } else {
        console.log("Requesting for Information");
        $.get(startUrl)
            .done(data => {
                let $data = $(data);

                let links = Array.from($data.find('a').map(function () {
                    let href = $(this).attr('href');

                    href = externalizeLink(href);
                    return href;
                }));
                let tempItem = {
                    html: data,
                    $html: $data,
                    title: $data.filter('title').text(),
                    allLinks: links
                };


                createItemWithoutRequest(startUrl, tempItem, finalItem => {

                    if (callback)
                        callback(finalItem);

                });

            }).fail(() => {

            if (callback)
                callback(null);
            console.log('Unable to reach')
        });
    }
}

// ----------------- GLOBAL -----------------
function setupGlobalEvents() {

    $("form").submit(function (e) {
        e.preventDefault();
    });
}

function updateGlobalEvents() {

    $(".item-broken").off().on('click', function (event) {
        event.preventDefault();
    });

    $(".checkbox span").off().on("click", function (e) {
        let checkbox = $(this).prev();
        let check = !checkbox.is(':checked');
        let item = $(this).parent().parent();
        if(e.shiftKey) {
            let children = item.parent().find(".checkbox input").slice(1);

            children.prop("checked", check);
        }
    });
}

function updateGlobalHtml() {

}

// ----------------- MORE -----------------
function setupMoreEvents() {
    let $more = $("#more"),
        $moreLinks = $("#more-links"),
        $moreImages = $("#more-images");

    $more.find(".more-back").off().on('click', function () {
        showMain();
    });

    $more.find(".more-links").off().on('click', function () {
        $more.find(".active").removeClass("active");
        $(this).addClass("active");
        showMoreLinks();
    });

    $more.find(".more-images").off().on('click', function () {
        $more.find(".active").removeClass("active");
        $(this).addClass("active");
        showMoreImages();
    });

    $moreLinks.find(".all-test").on('click', function () {
        let items = $moreLinks.find(".item-test");
        if ($moreLinks.find(".checkbox input:checked").length > 0) {
            items = items.filter(function () {
                return $(this).parent().parent().children(":first").children(":first").is(":checked");
            });
        }
        items.click();
    });

    $moreLinks.find(".all-select").off().on('click', function (event) {
        event.preventDefault();
        let items = $moreLinks.find(".checkbox");
        items.click();
    });
    $moreLinks.find(".all-download").on('click', function () {
        let items = $moreLinks.find(".item-download");
        if ($moreLinks.find(".checkbox input:checked").length > 0) {
            items = items.filter(function () {
                return $(this).parent().parent().children(":first").children(":first").is(":checked");
            });
        }

        // let i = 0;
        // items.forEach(function(item){
        //     if(i++ > 0)
        //         askForSaveLocation = false;
        //     this.click();
        // });
        // askForSaveLocation = true;
        items.click();
    });
    $moreImages.find(".all-download").on('click', function () {
        let items = $moreImages.find(".item-download");
        console.log(items);
        if ($moreImages.find(".checkbox input:checked").length > 0) {
            items = items.filter(function () {
                return $(this).parent().parent().children(":first").children(":first").is(":checked");
            });
        }

        // let i = 0;
        // items.forEach(function(item){
        //     if(i++ > 0)
        //         askForSaveLocation = false;
        //     this.click();
        // });
        // askForSaveLocation = true;
        items.click();
    });

    $moreImages.find(".all-select").off().on('click', function (event) {
        event.preventDefault();
        let items = $moreImages.find(".checkbox");
        items.click();
    });
}

function updateMoreEvents() {

    let $moreLinks = $("#more-links"),
        $moreImages = $("#more-images");

    $moreLinks.find(".item-test").off().on('click', function (e) {
        e.preventDefault();
        testLink($(this));
    });
    $moreLinks.find(".item-download").off().on('click', function (e) {
        e.preventDefault();
        chrome.downloads.download({url: this.href, saveAs: options.askWhereDownload == 'true'});
    });
    $moreImages.find(".item-download").off().on('click', function (e) {
        e.preventDefault();
        chrome.downloads.download({url: this.href, saveAs: options.askWhereDownload == 'true'});
    })
}

function updateMoreHtml(item) {
    let linksHtml = "",
        imagesHtml = "";

    if (item) {
        item.otherLinks.forEach(link => linksHtml += createMoreLinksHtml(link));
        item.images.forEach(link => imagesHtml += createMoreImagesHtml(link));

        $("#more-links").find(".content").html(linksHtml);
        $("#more-images").find(".content").html(imagesHtml);

        let $more = $("#more");
        $more.find(".pageTitle").text(item.title);
        $more.find(".pageLink").html(item.link);

        setTimeout(function () {
            updateGlobalEvents();
            updateMoreEvents();
        }, 100);
    }
}

function createMoreLinksHtml(link) {
    let htmlString =
        '<div class="item-wrapper">' +
        '<div class="item"  data-link="' + link + '">' +
        '<label class="checkbox">' +
        '<input type="checkbox"/>' +
        '<span >' +
        '<i class="fa fa-check"></i>' +
        '</span>' +
        '</label>' +
        '<div class="icon">' +
        '<h4 class="item-icon">' + getLinksIcon(link) + '</h4>' +
        '</div>' +
        '<div class="path wrap-text">' +
        '<p><a href="' + link + '" target="_blank">' + link + '</a></p>' +
        '</div>' +
        '<div class="options">\n';
    if (getLinksIcon(link).indexOf('file') >= 0)
        htmlString += '<a class="item-download" title="Download File" href="' + link + '" download>' + iconDownload + '</a>&nbsp;|&nbsp;';

    if (getLinksIcon(link).indexOf('envelope') === -1)
        htmlString += '<a class="item-test" title="Test Link" href="#" >' + iconQuestion + '</a>';
    htmlString += '</div>' +
        '</div>' +
        '</div>';
    return htmlString;
}

function createMoreImagesHtml(link) {

    return '<div class="item-wrapper">' +
        '<div class="item" data-link="' + link + '">' +
        '<label class="checkbox">' +
        '<input type="checkbox"/>' +
        '<span >' +
        '<i class="fa fa-check"></i>' +
        '</span>' +
        '</label>' +
        '<div class="image">' +
        '<img src="' + link + '" style="width:100%"/>' +
        '</div>' +
        '<div class="path wrap-text">' +
        '<p><a href="' + link + '" target="_blank">' + link + '</a></p>' +
        '</div>' +
        '<div class="options" >' +
        '<a class="item-download" title="Download File" href="' + link + '" download>' + iconDownload + '</a>' +
        '</div>' +
        '</div>' +
        '</div>';
}

// ----------------- MENU -----------------
function setupMenuEvents() {

    $("#menu-recrawl").off().on('click', function () {
        $("#menu-toggle").click();
        init();
    });

    $("#menu-toggle").on('click', function () {
        let menuOpen = $(this).hasClass('open');
        $(this).toggleClass('open');
        if (menuOpen) {
            hideMenu();
        } else {
            showMenu();
        }
    });

    Object.keys(options).forEach(item => {
        $("#" + item).off().on("input", function () {
            saveStorageOptions(item, $('input[name=' + item + ']:checked').val());
        })
    });
}

function updateMenuEvents() {

}

function updateMenuHtml() {

}

// ----------------- MAIN -----------------
function setupMainEvents() {
    let $main = $("#main"),
        $mainWebsite = $main.find("#main-website"),
        $mainLinks = $main.find("#main-links"),
        $mainImages = $main.find("#main-images");

    $mainWebsite.find(".all-crawl").off().on('click', function (event) {
        event.preventDefault();
        let items = $mainWebsite.find(".item-crawl");
        if ($mainWebsite.find(".checkbox input:checked").length > 0) {
            items = items.filter(function () {
                return $(this).parent().parent().children(":first").children(":first").is(":checked");
            });
        }
        items.click();
    });
    $mainWebsite.find(".all-download").off().on('click', function (event) {
        event.preventDefault();
        let items = $mainWebsite.find(".item-download");
        if ($mainWebsite.find(".checkbox input:checked").length > 0) {
            items = items.filter(function () {
                return $(this).parent().parent().children(":first").children(":first").is(":checked");
            });
        }
        // let i = 0;
        // items.each(function(){
        //     askForSaveLocation = false;
        //     this.click();
        // });
        // askForSaveLocation = true;
        items.click();
    });
    $mainLinks.find(".all-select").off().on('click', function (event) {
        event.preventDefault();
        let items = $mainLinks.find(".checkbox");
        items.click();
    });

    $mainLinks.find(".all-test").off().on('click', function (event) {
        console.log(1);
        event.preventDefault();
        let items = $mainLinks.find(".item-test");
        if ($mainLinks.find(".checkbox input:checked").length > 0) {
            items = items.filter(function () {
                return $(this).parent().parent().children(":first").children(":first").is(":checked");
            });
        }
        items.click();
    });
    $mainLinks.find(".all-download").off().on('click', function (event) {
        event.preventDefault();
        let items = $mainLinks.find(".item-download");
        if ($mainLinks.find(".checkbox input:checked").length > 0) {
            items = items.filter(function () {
                return $(this).parent().parent().children(":first").children(":first").is(":checked");
            });
        }
        //
        // let i = 0;
        // items.each(function(){
        //     if(i++ > 0)
        //         askForSaveLocation = false;
        //     this.click();
        // });
        // askForSaveLocation = true;
        // items.each(function () {
        //     this.click();
        // });
        items.click();
    });

    $mainImages.find(".all-download").off().on('click', function (event) {
        event.preventDefault();
        let items = $mainImages.find(".item-download");
        if ($mainImages.find(".checkbox input:checked").length > 0) {
            items = items.filter(function () {
                return $(this).parent().parent().children(":first").children(":first").is(":checked");
            });
        }
        // let i = 0;
        // items.each(function(item){
        //     if(i++ > 0)
        //         askForSaveLocation = false;
        //     this.click();
        // });
        // askForSaveLocation = true;
        // items.each(function () {
        //     this.click();
        // });
        items.click();
    });
    $mainImages.find(".all-select").off().on('click', function (event) {
        event.preventDefault();
        let items = $mainImages.find(".checkbox");
        items.click();
    });
}

function updateMainEvents() {
    let $main = $("#main"),
        $mainWebsite = $main.find("#main-website"),
        $mainLinks = $main.find("#main-links"),
        $mainImages = $main.find("#main-images");

    $main.find(".main-website").off().on('click', function () {
        $main.find(".active").removeClass("active");
        $(this).addClass("active");
        showMainWebsite();
    });
    $main.find(".main-links").off().on('click', function () {
        $main.find(".active").removeClass("active");
        $(this).addClass("active");
        showMainLinks();
    });
    $main.find(".main-images").off().on('click', function () {
        $main.find(".active").removeClass("active");
        $(this).addClass("active");
        showMainImages();
    });

    $mainWebsite.find(".item-more").off().on('click', function (event) {
        event.preventDefault();

        let $a = $(this);
        let itemLink = $a.parent().parent().attr('data-link');
        let item = findItem(storage.crawledSite, itemLink);

        showMore(item);
    });
    $mainWebsite.find(".item-crawl").off().on('click', function (event) {
        event.preventDefault();

        let $a = $(this);
        $a.removeClass('itemCrawl');
        $a.html(iconLoading);

        let link = $a.parent().parent().attr('data-link');
        let parent = findItem(storage.crawledSite, link);
        crawlDeeper(parent, () => {

            if (options.autoSortLinks == 'true') {
                storage.crawledSite = sortSite(storage.crawledSite);
            }
            updateMainHtml();
        });

    });
    $mainWebsite.find(".item-download").off().on('click', function (event) {
        event.preventDefault();
        let $a = $(this);
        $a.removeClass('itemDownload');
        $a.html(iconLoading);

        let link = $a.parent().parent().attr('data-link');
        let parent = findItem(storage.crawledSite, link);
        localizeFile(parent.html, html => {
            let file = new Blob([html], {type: "html"});
            $a.html(iconDownload);
            if(options.askWhereDownload == 'true') {
                let url = URL.createObjectURL(file);
                chrome.downloads.download({url: url, filename: parent.title + ".html", saveAs: options.askWhereDownload == 'true'});
            }else
                saveData(file, parent.title + ".html");

            $a.addClass('itemDownload');
        });
    });

    $mainLinks.find(".item-test").off().on('click', function (e) {
        e.preventDefault();
        testLink($(this));
    });
    $mainLinks.find(".item-download").off().on('click', function (e) {
        e.preventDefault();
        chrome.downloads.download({url: this.href, saveAs: options.askWhereDownload == 'true'});
    });
    $mainImages.find(".item-download").off().on('click', function (e) {
        e.preventDefault();
        chrome.downloads.download({url: this.href, saveAs: options.askWhereDownload == 'true'});
    });

}

function updateMainHtml() {
    let websiteHtml = "",
        linksHtml = "",
        imagesHtml = "";

    storage.crawledSite.forEach(item => websiteHtml += createMainWebsiteHtml(item));

    storage.allLinks = storage.allLinks.sort(sortLinkFileTypes);
    storage.allLinks.forEach(item => linksHtml += createMainLinksHtml(item));

    storage.allImages = storage.allImages.sort(sortLinkFileTypes);
    storage.allImages.forEach(item => imagesHtml += createMainImagesHtml(item));

    $("#main-website").find(".content").html(websiteHtml);
    $("#main-links").find(".content").html(linksHtml);
    $("#main-images").find(".content").html(imagesHtml);

    setTimeout(function () {
        updateGlobalEvents();
        updateMainEvents();
    }, 100);
}

function createMainWebsiteHtml(item) {
    let htmlString =

        '<div class="item-wrapper">' +
        '<div class="item" data-link="' + item.link + '">' +
        '<label class="checkbox">' +
        '<input type="checkbox"/>' +
        '<span >' +
        '<i class="fa fa-check"></i>' +
        '</span>' +
        '</label>' +
        '<div class="info">' +
        '<div class="title wrap-text">' +
        '<h4>' + item.title + '</h4>' +
        '</div>' +
        '<div class="path wrap-text">' +
        '<p><a href="' + item.link + '" target="_blank"  title="Found on:\n' + getLinks("linkLocations", item.link) + '">' + item.path + '</a></p>' +
        '</div>' +
        '</div>' +
        '<div class="options">\n';
    if (item.childrenLinks.length > 0)
        htmlString += '<a href="#" title="Crawl Deeper" class="item-crawl">' + iconCrawl + '</a>&nbsp;|&nbsp;';
    if (!item.isBroken) {
        htmlString += '<a class="item-download" title="Download File" href="#" >' + iconDownload + '</a>';
    } else
        htmlString += '<a href="#" class="item-broken">' + iconBroken + '</a>';
    htmlString += '&nbsp;|&nbsp;<a class="item-more" title="More" href="#" >' + iconMore + '</a>' +
        '</div>' +
        '</div>';
    if (item.children.length > 0) {
        htmlString += '<div class="children">';
        for (let i = 0; i < item.children.length; i++)
            htmlString += createMainWebsiteHtml(item.children[i]);
        htmlString += '</div>';
    }
    htmlString += '</div>';
    return htmlString;
}

function createMainLinksHtml(link) {
    let htmlString =
        '<div class="item-wrapper">' +
        '<div class="item"  data-link="' + link + '">' +
        '<label class="checkbox">' +
        '<input type="checkbox"/>' +
        '<span >' +
        '<i class="fa fa-check"></i>' +
        '</span>' +
        '</label>' +
        '<div class="icon">' +
        '<h4 class="item-icon">' + getLinksIcon(link) + '</h4>' +
        '</div>' +
        '<div class="path wrap-text">' +
        '<p><a href="' + link + '" target="_blank" title="Found on:\n' + getLinks("linkLocations", link) +
        '">' + link + '</a></p>' +
        '</div>' +
        '<div class="options">\n';
    if (getLinksIcon(link).indexOf('file') >= 0)
        htmlString += '<a class="item-download" title="Download File" href="' + link + '" download>' + iconDownload + '</a>&nbsp;|&nbsp;';

    if (getLinksIcon(link).indexOf('envelope') === -1)
        htmlString += '<a class="item-test" title="Test Link" href="#" >' + iconQuestion + '</a>';
    htmlString += '</div>' +
        '</div>' +
        '</div>'
    ;
    return htmlString;
}

function getLinks(location, link) {
    let string = "";
    if (storage[location][link])
        storage[location][link].forEach(item => {
            console.log(item);
            string += '- ' + item + "\n";
        });
    return string;
}

function createMainImagesHtml(link) {

    return '<div class="item-wrapper">' +
        '<div class="item" data-link="' + link + '">' +
        '<label class="checkbox">' +
        '<input type="checkbox"/>' +
        '<span >' +
        '<i class="fa fa-check"></i>' +
        '</span>' +
        '</label>' +
        '<div class="image">' +
        '<img src="' + link + '" style="width:100%"/>' +
        '</div>' +
        '<div class="path wrap-text">' +
        '<p><a href="' + link + '" target="_blank" title="Found on:\n' + getLinks("imageLocations", link) +
        '">' + link + '</a></p>' +
        '</div>' +
        '<div class="options" >' +
        '<a class="item-download" title="Download File" href="' + link + '" download>' + iconDownload + '</a>' +
        '</div>' +
        '</div>' +
        '</div>';
}

// ----------------- DISPLAYS -----------------

// ----- MAIN -----
function showMain(update) {

    $(".checkbox input").prop("checked", false);

    if (update === undefined || update)
        updateMainHtml();
    $(".page").hide();
    let page = $("#main");
    page.show();
    if (!page.find(".sub-page").is(":visible"))
        page.find("#main-website").show();
}

function showMainWebsite() {
    showMain(false);
    let page = $("#main");
    page.find(".sub-page").hide();
    page.find("#main-website").show();
}

function showMainLinks() {
    showMain(false);
    let page = $("#main");
    page.find(".sub-page").hide();
    page.find("#main-links").show();
}

function showMainImages() {
    showMain(false);
    let page = $("#main");
    page.find(".sub-page").hide();
    page.find("#main-images").show();
}

// ----- MORE -----
function showMore(item, update) {
    if (update === undefined || update)
        updateMoreHtml(item);
    $(".page").hide();
    let page = $("#more");
    page.show();
    if (!page.find(".sub-page").is(":visible"))
        page.find("#more-links").show('puff', null, 250);
}

function showMoreLinks(item) {
    showMore(item, false);
    let page = $("#more");
    page.find(".sub-page").hide();
    page.find("#more-links").show();
}

function showMoreImages(item) {
    showMore(item, false);
    let page = $("#more");
    page.find(".sub-page").hide();
    page.find("#more-images").show()
}

// ----- MENU -----
function showMenu(update) {
    if (update === undefined || update)
        updateMenuHtml();

    lastPage = $(".page:visible");
    $(".page").hide();
    $("#menu").show('puff', null, 250);
}

function hideMenu() {
    $("#menu").hide('puff', null, 250);
    if (lastPage)
        lastPage.show();
}

// ----- LOADING -----
function showLoading() {
    $("#loadingOverlay").show();
}

function hideLoading() {
    $("#loadingOverlay").hide();
}


String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
RegExp.quote = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};