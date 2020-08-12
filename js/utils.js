/**
 * link doesn't contain a .pdf, .doc, javascript:, #
 * @param link
 * @returns {boolean}
 */
function isValidHTMLFileURL(link) {
    return link && link.indexOf('javascript:') === -1 && link.indexOf('#') === -1 && getFileTypeId(link) == 98;
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

function getFileName(url){
  let parts =  url.split("/");
  let name = parts[parts.length -1];
  for(let i = parts.length -1; i > 2; i--)
    if(parts[i].indexOf(".") >= 0)
    {
      name = parts[i];
      break;
    }
  if(name.indexOf(".") === -1)
    name = name + ".jpg";
  return name;
}

/**
 * Link is a special link
 * @param link
 * @returns {*|boolean|Number|number}
 */
function isSpecialLink(link) {
    return link && (link.indexOf('mailto:') >= 0 || link.indexOf('tel:') >= 0);
}

function setOptions(name, value){
  if($('input[name=' + name + ']')[0].type === 'radio')
    setRadioButtonSelected(name, value)
  else if($('input[name=' + name + ']')[0].type === 'text')
    setTextInput(name, value);
}

/**
 * Set input text
 * @param name
 * @param value
 */
function setTextInput(name, value){
    $('input[name="' + name + '"]').val(value);
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


        if (!isSpecialLink(link) && !hasProtocol(link) && link.indexOf(domain)<0)
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
}

    function getFileTypeId(file) {
        if (file && file.length > 0){
            file = file.toLowerCase();
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
            else if (file.indexOf('.webp') !== -1)
                return 6;
            else if (file.indexOf('mailto:') >= 0 || file.indexOf('tel:') >= 0)
                return 99;
            else
                return 98;
              }
        else
            return 0;
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
            $e.prop('title', e);
        } else {
            $e.html(iconBroken);
            $e.prop("title",  e);
        }
    });


    function test(link, callback) {
      fetch(link).then(res => {return res;})
      .then(res =>{
      if(res.status == 200 || res.redirected)
          callback(true, res.statusText);
        else
          callback(false, res.statusText);
      }).catch(e=>{
        fetch(byPassCORS(link)).then(res => {return res;})
        .then(res =>{
          if(res.status != 400 && res.status != 404)
            callback(true, res.statusText);
          else
            callback(false, res.statusText);
        }).catch(e=>{
          callback(false, "Unable to reach");
        });
      });
    }
}
function updateProgress(percent){
  let $prog = $(".progress");
  let $bar = $prog.find(".progress-bar");
  let barTransition = $bar.css("transition");
  if($bar.css("width") > percent)
    $bar.css("transition", "none");

  $bar.css("width", percent+"%");
  $bar.css("transition", barTransition);
  if(percent >= 100)
    $prog.hide();
  else
    $prog.show();
}
function byPassCORSIfNeeded(url){
  if(!onSameDomain(url))
    return byPassCORS(url);
  return url;
}
function byPassCORS(url) {
    return "https://cors-anywhere.herokuapp.com/" + url;
}
//delay and wait when typing
function delay(callback, ms) {
  var timer = 0;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback.apply(context, args);
    }, ms || 0);
  };
}
