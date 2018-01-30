function getAllUrlParams (url) {
  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1)

  // we'll store the parameters here
  var obj = {}

  // if query string exists
  if (queryString) {
    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0]

    // split our query string into its component parts
    var arr = queryString.split('&')

    for (var i = 0; i < arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=')

      // in case params look like: list[]=thing1&list[]=thing2
      var paramNum
      var paramName = a[0].replace(/\[\d*\]/, function (v) {
        paramNum = v.slice(1, -1)
        return ''
      })

      // set parameter value (use 'true' if empty)
      var paramValue = typeof (a[1]) === 'undefined' ? true : a[1]

      // (optional) keep case consistent
      paramName = paramName.toLowerCase()
      paramValue = paramValue.toLowerCase()

      // if parameter name already exists
      if (obj[paramName]) {
        // convert value to array (if still string)
        if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]]
        }
        // if no array index number specified...
        if (typeof paramNum === 'undefined') {
          // put the value on the end of the array
          obj[paramName].push(paramValue)
        }
        // if array index number specified...
        else {
          // put the value at that index number
          obj[paramName][paramNum] = paramValue
        }
      }
      // if param name doesn't exist yet, set it
      else {
        obj[paramName] = paramValue
      }
    }
  }

  return obj
}

function setGetParameter (paramName, paramValue) {
  var url = window.location.href
  var hash = location.hash
  url = url.replace(hash, '')
  if (url.indexOf(paramName + '=') >= 0) {
    var prefix = url.substring(0, url.indexOf(paramName))
    var suffix = url.substring(url.indexOf(paramName))
    suffix = suffix.substring(suffix.indexOf('=') + 1)
    suffix = (suffix.indexOf('&') >= 0) ? suffix.substring(suffix.indexOf('&')) : ''
    url = prefix + paramName + '=' + paramValue + suffix
  } else {
    if (url.indexOf('?') < 0) { url += '?' + paramName + '=' + paramValue } else { url += '&' + paramName + '=' + paramValue }
  }
  window.location.href = url + hash
}

function setupBtnClick () {
  let buttons = document.querySelectorAll('.lang-switcher button')
  if (buttons) {
    buttons.forEach(btn => btn.addEventListener('click', updateActiveLang))
  }
}

function setActiveLang (lang) {
  let buttons = document.querySelectorAll('.lang-switcher button')
  if (buttons) {
    buttons.forEach(btn => btn.classList.remove('active'))
  }

  let activeBtn = document.querySelector('.lang-switcher button[data-lang="' + lang + '"]')
  if (activeBtn) {
    activeBtn.classList.add('active')
  }
}

function updateActiveLang (e) {
  let lang = this.getAttribute('data-lang')
  setGetParameter('lang', lang)
}

function displayLang () {
  let lang = getAllUrlParams().lang
  if (!lang) {
    lang = 'eng'
  }

  setupBtnClick()
  setActiveLang(lang)

  return lang
}

export default { displayLang }
