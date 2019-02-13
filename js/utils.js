/**
 * link doesn't contain a .pdf, .doc, javascript:, #
 * @param link
 * @returns {boolean}
 */
function isValidHTMLFileURL(link) {
    return link && link.indexOf('javascript:') === -1 && link.indexOf('#') === -1 && link.indexOf(".pdf") === -1 && link.indexOf(".doc") === -1;
}

/**
 * Update Protocol for link
 * @param link
 * @returns {*}
 */
function updateProtocol(link) {
    if (link)
        link = link.replace('http://', protocol);
    if (link && link.indexOf("//") === 0)
        link = link.replace("//", protocol);
    return link;
}

/**
 * Link is a special link
 * @param link
 * @returns {*|boolean|Number|number}
 */
function isSpecialLink(link) {
    return link && (link.indexOf('mailto:') >= 0 || link.indexOf('tel:') >= 0);
}

/**
 * Set Checked radio button
 * @param name
 * @param value
 */
function setRadioButtonSelected(name, value) {
    let radios = $('input[name="' + name + '"]');
    radios.each(function () {
        if ($(this).prop('value') === value) {
            $(this).click();
        }
    });
}
/**
 * Replace all instances in string
 * @param str
 * @param find
 * @param replace
 * @returns {string|*|void|XML}
 */
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function hasProtocol(link) {
    return link && link.indexOf('//') > 0;
}

function onSameDomain(link) {
    try {
    return link && new URL(updateProtocol(link)).origin === updateProtocol(domain);
    }catch(err){
        return false;
    }
}

/**
 * Turn local link into external link
 * @param link
 * @returns {*}
 */
function externalizeLink(link) {
    if (link) {

        if (hasProtocol(link) && onSameDomain(link))
            link = updateProtocol(link);

        if (link.indexOf('../') === 0)
            link = link.substr(2, link.length);
        if (link.indexOf('./') === 0)
            link = link.substr(1, link.length);
        if (link.lastIndexOf('/') === link.length - 1)
            link = link.substr(0, link.length - 1);

        if (!isSpecialLink(link) && !hasProtocol(link))
            if (link.indexOf('/') === 0 || link.indexOf('#') === 0)
                link = domain + link;
            else
                link = domain + '/' + link;
    }
    return link;
}

function isSameDomainAsStorage(callback) {
    loadStorage("domain", result => {
        domain = result;
        let url = new URL(tab[0].url);
        if (callback)
            callback(url.origin === result, result);
    });
}

/**
 * Gets if the domain is from the main site
 * @param link
 * @returns {boolean}
 */
function isDomainBasedLink(link) {
    return link.indexOf(domain) === 0
        || (link.indexOf('/') === 0 && link.indexOf('//') !== 0)
        || link.indexOf('./') === 1
        || link.indexOf('./') === 0;
}


function getLinksIcon(link) {

    if (link.indexOf('.pdf') !== -1)
        return iconPDF;

    else if (link.indexOf('.doc') !== -1)
        return iconWord;

    else if (isSpecialLink(link))
        return iconEnvelope;

    else
        return iconLink;
}

function sortLinkFileTypes(x, y) {
    let fileX = getFileTypeId(x);
    let fileY = getFileTypeId(y);

    return fileX - fileY;

    function getFileTypeId(file) {
        if (file && file.length > 0)
            if (file.indexOf('.pdf') !== -1)
                return 1;
            else if (file.indexOf('.doc') !== -1)
                return 2;
            else if (file.indexOf('.png') !== -1)
                return 3;
            else if (file.indexOf('.gif') !== -1)
                return 4;
            else if (file.indexOf('.jpg') !== -1 || file.indexOf('.jpeg') !== -1)
                return 5;
            else if (file.indexOf('mailto:') >= 0 || file.indexOf('tel:') >= 0)
                return 99;
            else
                return 98;
        else
            return 0;
    }
}

function addLinkLocation(link, location) {
    if (storage.linkLocations[link]) {
        if (!storage.linkLocations[link].includes(location)) {
            storage.linkLocations[link].push(location);

            saveStorage("linkLocations", storage.linkLocations);
        }
    } else {
        storage.linkLocations[link] = [];
        storage.linkLocations[link].push(location);

        saveStorage("linkLocations", storage.linkLocations);
    }
}
function addImageLocation(link, location) {
    if (storage.imageLocations[link]) {
        if (!storage.imageLocations[link].includes(location)) {
            storage.imageLocations[link].push(location);

            console.log(storage.imageLocations);
            saveStorage("imageLocations", storage.imageLocations);
        }
    } else {
        storage.imageLocations[link] = [];
        storage.imageLocations[link].push(location);
        saveStorage("imageLocations", storage.imageLocations);
    }
}

function testLink($e) {
    $e.html(iconLoading);
    let link = $e.parent().parent().attr('data-link');

    test(link, (success, e) => {
        if (success) {
            $e.html(iconCheck);
            $e.prop('title', "Success");
        } else {
            $e.html(iconBroken);
            $e.prop("title", e);
            console.log(e);
        }
    });

    function test(link, callback) {
        $.get(link)
            .done((result) => {
                callback(true, result);
            })
            .fail((xhr, textStatus, errorThrown) => {
            console.log(xhr);
                console.log('STATUS: '+textStatus+'\nERROR THROWN: '+errorThrown);
                callback(false, errorThrown);
            });
    }
}