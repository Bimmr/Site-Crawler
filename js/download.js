function localizeFile(html, callback) {
    console.log("Starting Localization");
    localizeStyles(html, html1 => {
        saveStorage("savedStyles", storage.savedStyles);
        console.log("Localized Styles");
        baseImages(html1, html2 => {
            console.log("Based Images");
            baseBackgroundUrl(html2, html3 => {
                console.log("Based Background urls");
                localizeScripts(html3, html4 => {
                    console.log("Localized Scripts");
                    saveStorage("savedScripts", storage.savedScripts);
                    if (callback)
                        callback(html4);
                });
            });
        });
    });
}

function localizeScripts(html, callback) {
    html = html.replaceAll('&quot;', '"');
    html = html.replaceAll('"//', '"'+protocol);

    //Turn all local scripts to external scripts
    let scripts = html.match(regexScript);

    if (options.localizeAllScripts == 'false')
        scripts = filterForDomainBased(scripts);


    if (!scripts || scripts.length === 0) {
        if (callback)
            callback(html);
    } else {
        let count = 0;
        getScriptsLocal((original, item, scriptString) => {
            if (scriptString) {
                scriptString = scriptString.replace(/\$/g, '$$$$');
                let replace = new RegExp('(<[^>]+src\\s{0,2}=\s{0,2}[\"\']{0,1}' + original + '[^>]*><\/script>)|(<[^>]+src\\s{0,2}=\\s{0,2}[\"\']{0,1}' + original + '[^>]*>)<\/script>', 'g');
               console.log(replace);
               console.log(scriptString);
                html = html.replace(replace, scriptString);
            }

            count += 1;
            if (count === scripts.length)
                callback(html);
        });


        function getScriptsLocal(callback) {
            scripts.forEach(item => {
                let original = item;

                item = externalizeLink(item);

                if (options.localizeAllScripts == 'true' && !isDomainBasedLink(item))
                    item = byPassCORS(item);

                if (storage.savedScripts[item]) {

                    if (callback)
                        callback(original, item, storage.savedScripts[item]);

                } else {
                    let string = null;
                    $.get(item)
                        .done(data => {
                            data = data.replace(/\r?\n|\r/g, "");
                            string = '<script data-crawledLink="' + item + '">' + data + '</script>';
                            storage.savedScripts[item] = string;

                        })
                        .fail((e) => {
                        }).always(() => {

                        if (callback)
                            callback(original, item, string);
                    });
                }
            });
        }
    }
}

function baseBackgroundUrl(html, callback) {

    html = html.replaceAll('&quot;', '"');
    //Turn all url links to external links
    let urls = html.match(regexUrl);


    if (!urls || urls.length === 0) {
        if (callback)
            callback(html);
    } else {
        urls.forEach(item => {
            html = html.replace(item, externalizeLink(item));
        });

        //Get the url links again, as they just changed
        urls = html.match(regexUrl);

        let counted = 0;


        urls.forEach(item => {
            if (!isDomainBasedLink(item))
                item = byPassCORS(item);
            toDataUrl(item, base64 => {
                counted += 1;
                if (base64) {
                    html = html.replace(item, base64);
                }
                if (counted === urls.length) {
                    if (callback)
                        callback(html);
                }
            })
        });
    }
}

function baseImages(html, callback) {

    html = html.replaceAll('&quot;', '"');
    //Turn all image links to external links
    let imgs = html.match(regexImg);

    if (!imgs || imgs.length === 0) {
        if (callback)
            callback(html);
    } else {
        imgs.forEach(item => {
            html = html.replace(item, externalizeLink(item));
        });

        //Get the image links again, as they just changed
        imgs = html.match(regexImg);

        let counted = 0;

        imgs.forEach(item => {

            if (!isDomainBasedLink(item))
                item = byPassCORS(item);
            toDataUrl(item, base64 => {
                counted += 1;
                if (base64) {
                    html = html.replace(item, base64);
                }
                if (counted === imgs.length) {
                    if (callback)
                        callback(html);
                }
            })
        });
    }
}

function byPassCORS(url) {
    return "https://cors-escape.herokuapp.com/" + url;
}

function toDataUrl(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
        let reader = new FileReader();
        reader.onloadend = function () {
            if (callback)
                callback(reader.result);
        };
        reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = function () {
        if (callback)
            callback(null);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
}

function localizeStyles(html, callback) {

    html = html.replaceAll('&quot;', '"');
    //Turn all local style links to external links
    let styles = html.match(regexStyle);

    if (options.localizeAllStyles == 'false')
        styles = filterForDomainBased(styles);

    if (!styles || styles.length === 0) {
        if (callback)
            callback(html);
    } else {

        styles.forEach(item => {
            html = html.replace(item, externalizeLink(item));
        });

        //Get the style links again, as they just changed
        styles = html.match(regexStyle);
        if (options.localizeAllStyles == 'false')
            styles = filterForDomainBased(styles);

        let count = 0;

        getStylesheetsLocal((original, item, styleString) => {
            if (styleString) {

                let replace = new RegExp('(<[^>]+([^>]+stylesheet[^>]+)[^>]+href\\s{0,2}=\\s{0,2}["\']{0,1})(' + original + ')([^&?]["\']*[^>]*>)|(<[^>]+href\\s{0,2}=\\s{0,2}["\']{0,1})(' + original + ')([^&?]["\']*[^>]+stylesheet[^>]*>)');
                html = html.replace(replace, styleString);
            }

            count += 1;
            if (count === styles.length)
                callback(html);
        });

        function getStylesheetsLocal(callback) {


            styles.forEach(item => {
                let original = item;

                if (options.localizeAllStyles == 'true' && !isDomainBasedLink(item))
                    item = byPassCORS(item);

                if (storage.savedStyles[item]) {

                    if (callback)
                        callback(item, storage.savedStyles[item]);

                } else {
                    let string = null;
                    $.get(item)
                        .done(data => {
                            data = data.replace(/\r?\n|\r/g, "");
                            string = '<style data-crawledLink="' + item + '">' + data + '</style>\n';
                            storage.savedStyles[item] = string;
                        })
                        .fail((e) => {
                        }).always(() => {
                        if (callback)
                            callback(original, item, string);
                    });
                }
            });
        }

    }
}

function saveData(blob, fileName) {
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    let url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 *Filter list if based on domain
 *@param list
 */
function filterForDomainBased(list) {
    let finalList = [];
    if (list)
        list.forEach(item => {
            if (isDomainBasedLink(item)) {
                finalList.push(item);

            }
        });
    return finalList;
}