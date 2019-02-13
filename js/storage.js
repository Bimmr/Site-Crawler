let storage = {
    crawledSite: [],
    allCrawledLinks: [],
    allImages: [],
    allLinks: [],
    savedScripts: {},
    savedStyles: {},
    linkLocations: {},
    imageLocations: {}
};

// ----------------- STORAGE -----------------
function loadStorageOptions(callback) {
    chrome.storage.local.get(Object.keys(options), result => {

        Object.keys(result).forEach(item => {
            options[item] = result[item];
        });

        if (callback)
            callback();
    });
}

function loadStorage(key, callback) {
    if (!(key instanceof Array))
        key = [key];

    chrome.storage.local.get(key, result => {
        let value = result ? Object.keys(result).length > 1 ? result : result[key] : null;

        if (callback)
            callback(value);
    });
}

function saveStorage(key, value) {
    console.log(key);
    console.log(value);
    console.log("-----");
    chrome.storage.local.set({[key]: value});
}

function saveStorageOptions(item, value) {
    options[item] = value;
    let temp = {};
    temp[item] = value;
    chrome.storage.local.set({[item]: value});
}