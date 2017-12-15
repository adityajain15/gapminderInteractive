import * as d3 from 'd3'
import * as sidebar from './js/sidebar'
import chart from './js/scatterplot'
import autoComplete from './js/autocomplete'
import './scss/main.scss'

let windowWidth = window.innerWidth
const noUiSlider = require('./js/nouislider')
const yearRange = document.getElementById('year-range')
const searchWarning = d3.select('.search-warning')

let data
let years
let minYear
let maxYear
let currentYear
let axes = ['x', 'y', 'r']
let axisVars = {}
let axesSelect = {}
let ranges = {}
let scaleTypes = ['linear', 'log']

const playBtn = d3.select('#playbtn')
let timer
let playing = false

let currentAxes = {
  x: {
    name: 'GNI per capita',
    scaleType: 'log',
    direction: 'bottom'
  },
  y: {
    name: 'Life Expectancy',
    scaleType: 'linear',
    direction: 'left'
  },
  radius: {
    name: 'Gross Domestic Product (PPP)'
  }
}

const colorValue = 'World Bank Classification'
let scaleC = d3.scaleOrdinal()
let colorDomain = {
  value: colorValue,
  colors: []
}
const COLORS = ['#d3d3d3', '#58a897', '#83badc', '#3b75bb', '#a483a8', '#f7890e', '#ed392a']

function loadData () {
  const dataCSV = require('./data/20171214-data.csv')

  let obj = dataCSV.reduce(function (data, row) {
    data.axisVars = data.axisVars || []
    if (data.axisVars.length == 0) {
      data.axisVars = Object.keys(row)
    }

    // Modify row properties
    row = transformKeys(row)
    row['ISO-Year'] = row.ISO + '-' + row.Year

    // Group Regions
    data.regions = data.regions || {}
    data.regions[row.Region] = data.regions[row.Region] || {}
    data.regions[row.Region][row.ISO] = data.regions[row.Region][row.ISO] || {
      country: row.Country,
      iso: row.ISO
    }

    // Group Years
    data.years = data.years || {}
    data.years[row.Year] = data.years[row.Year] || []
    data.years[row.Year].push(row)
    // data.years[row.Year].sort(dynamicSort('ISO'))

    // Group Countries
    data.countries = data.countries || {}
    data.countries[row.ISO] = data.countries[row.ISO] || {
      country: row.Country,
      iso: row.ISO,
      years: {}
    }
    data.countries[row.ISO].years[row.Year] = data.countries[row.ISO].years[row.Year] || row

    // All data
    data.raw = data.raw || []
    data.raw.push(row)

    return data
  }, {})

  data = obj
  console.log(data)

  setupAxisVars(data.axisVars)

  years = Object.keys(data.years)
  let range = d3.extent(years)
  minYear = range[0]
  maxYear = range[1]
}

function transformKeys (obj) {
  return Object.keys(obj).reduce(function (o, prop) {
    if (isNaN(parseInt(obj[prop]))) {
      var value = obj[prop]
    } else {
      var value = parseFloat(obj[prop])
    }
    var newProp = prop.replace('x_', '').replace('y_', '').replace('r_', '')
    o[newProp] = value
    return o
  }, {})
}

function setupAxisVars (columns) {
  axes.forEach(function (axis) {
    axisVars[axis] = columns.filter(column => column.includes(axis + '_'))
      .map(column => column.split('_').pop())
    calculateRanges(axisVars[axis])
  })
}

function calculateRanges (axis) {
  axis.forEach(function (column) {
    ranges[column] = d3.extent(data.raw.reduce(function (result, value) {
      if (value[column] != '') {
        result.push(parseInt(value[column]))
      }
      return result
    }, []))
  })
}

function calculateColors () {
  return [...new Set(data.raw.map(column => parseInt(column[colorValue]) || 0))].sort()
}

function setupAxisSelect () {
  axes.forEach(function (axis) {
    axesSelect[axis] = d3.select('.filter-axis-' + axis)
      .append('select')
      .attr('name', 'axis-' + axis)
      .attr('class', 'filter-select axis-variable')

    let options = axesSelect[axis]
      .selectAll('option')
      .data(axisVars[axis]).enter()
      .append('option')
        .text(d => d)
        .property('value', d => d)
        .property('selected', d => d === currentAxes[axis])

    if (axis == 'x' || axis == 'y') {
      setupAxisSelctType(axis)
    }

    axesSelect[axis].on('change', function () {
      drawPrimaryChart()
    })
  })
}

function setupAxisSelctType (axis) {
  axesSelect[axis] = d3.select('.filter-axis-' + axis)
    .append('select')
    .attr('name', 'axis-scaleType-' + axis)
    .attr('class', 'filter-select axis-scaleType')

  let options = axesSelect[axis]
    .selectAll('option')
    .data(scaleTypes).enter()
    .append('option')
      .text(d => d.charAt(0).toUpperCase() + d.slice(1))
      .property('value', d => d)
      .property('selected', d => d === currentAxes[axis].scaleType)

  axesSelect[axis].on('change', function () {
    drawPrimaryChart()
  })
  setupAxesDirection()
}

function calculateXSelect () {
  return d3.select('.filter-axis-x .axis-variable').property('value')
}

function calculateYSelect () {
  return d3.select('.filter-axis-y .axis-variable').property('value')
}

function calculateRadiusSelect () {
  return d3.select('.filter-axis-r .axis-variable').property('value')
}

function calculateScaleTypes (axis) {
  return d3.select('select[name="axis-scaleType-' + axis + '"]').property('value')
}

function setupAxesDirection () {
  const axesDirection = d3.select('.filter-swap')
    .on('click', function () {
      // Swap Variables
      let oldX = axisVars.x
      let oldY = axisVars.y
      axisVars.x = oldY
      axisVars.y = oldX
      // Swap Scale Types
      let oldXScaleType = currentAxes.x.scaleType
      let oldYScaleType = currentAxes.y.scaleType
      currentAxes.x.scaleType = oldYScaleType
      currentAxes.y.scaleType = oldXScaleType
      // Remove & Redraw
      d3.selectAll('.axis-variable').remove()
      d3.selectAll('.axis-scaleType').remove()
      setupAxisSelect()
      drawPrimaryChart()
    })
}

function setupRegionFilter () {
  const regionsCont = d3.select('.filter-region')
  const regions = Object.keys(data.regions).sort()

  regions.forEach(function (region) {
    regionsCont.append('h3')
      .attr('class', 'accordion-toggle')
      .text(region)
      .on('click', function () {
        d3.select(this).classed('open', !d3.select(this).classed('open'))
        d3.select(this.nextSibling).classed('collapsed', !d3.select(this.nextSibling).classed('collapsed'))
      })
    let regionCont = regionsCont.append('div')
      .attr('class', 'region-containers accordion-content collapsed')
      .attr('id', 'region-' + region)

    let countries = Object.keys(data.regions[region])
    let options = regionCont.selectAll('.option').data(countries)

    options.enter().append('div')
      .data(countries)
      .attr('class', 'checkbox-container')
      .append('input')
        .attr('name', 'country')
        .attr('class', 'checkboxes')
        .attr('type', 'checkbox')
        .attr('id', d => d)
        .attr('value', d => d)
        .attr('data-country', d => d)
  })

  d3.selectAll('.checkbox-container').append('label')
      .attr('for', d => d)
      .text(d => data.countries[d].country)

  d3.selectAll('input[name="country"]').on('change', function () {
    drawPrimaryChart()
  })

  regionsCont.append('button')
    .attr('class', 'clear-filter')
    .text('Clear selected countries')
    .on('click', function () {
      d3.selectAll('input[name="country"]').property('checked', false)
      drawPrimaryChart()
    })
}

function calculateSelectedCountries () {
  let result = { countries: [] }
  let countries = []
  const checkedBoxes = document.querySelectorAll('input[name="country"]:checked')
  checkedBoxes.forEach(function (country) {
    let iso = country.value
    for (let i = minYear; i <= maxYear; i++) {
      let prevYear = i - 1
      if (i == minYear) {
        prevYear = i
      }

      data.countries[iso].years[i].prevX = data.countries[iso].years[prevYear][currentAxes.x.name] || data.countries[iso].years[i][currentAxes.x.name]
      data.countries[iso].years[i].prevY = data.countries[iso].years[prevYear][currentAxes.y.name] || data.countries[iso].years[i][currentAxes.y.name]
    }
    let countryData = Object.values(data.countries[iso].years)
    countries.push(countryData)
    result.countries.push(iso)
  })
  result.countries.sort()
  result.countriesData = [].concat.apply([], countries)
  showSelectedTooltip(result.countries)
  // d3.selectAll('.tooltip-selected.to-remove').remove()

  return result
}

function showSelectedTooltip (selectedCountries) {
  let tooltips = d3.selectAll('.tooltip-selected').data(selectedCountries, d => d)

  tooltips.transition()
    .duration(1000)
    .style('left', d => checkPos('pageX', 'left', 'scrollX', d) + 'px')
    .style('top', d => checkPos('pageY', 'top', 'scrollY', d) + 'px')

  tooltips.enter().append('div')
    .attr('class', 'tooltip tooltip-selected')
    .attr('data-iso', d => d)
    .html(d => `<p class="tooltip-heading">${data.countries[d].country}</p>`)
    .style('left', d => checkPos('pageX', 'left', 'scrollX', d) + 'px')
    .style('top', d => checkPos('pageY', 'top', 'scrollY', d) + 'px')

  tooltips.exit().remove()

  function checkPos (event, direction, scroll, d) {
    if (d3.event && d3.event.target.__data__.ISO == d) {
      return d3.event[event]
    } else {
      return d3.selectAll('circle[data-iso="' + d + '"][data-year="' + currentYear + '"]').node().getBoundingClientRect()[direction] + window[scroll]
    }
  }
}

function setupYearRange () {
  if (yearRange.noUiSlider != undefined) {
    yearRange.noUiSlider.destroy()
  }

  noUiSlider.create(yearRange, {
    start: [ minYear ],
    connect: true, // Display a colored bar between the handles
    behaviour: 'tap-drag', // Move handle on tap, bar is draggable
    step: 1,
    tooltips: true,
    animate: true,
    range: {
      'min': +minYear,
      'max': +maxYear
    },
    pips: {
      mode: 'count',
      values: 6,
      density: 4
    },
    format: {
      to: function (value) {
        return value
      },
      from: function (value) {
        return value
      }
    }
  })

  yearRange.noUiSlider.on('update', function () {
    drawPrimaryChart()
    if (currentYear == maxYear) {
      stopAnimation(playBtn, timer)
    }
  })

  setupPlayBtn()
}

function calculateYears () {
  return yearRange.noUiSlider.get()
}

function setupColorLegend () {
  const colorLegend = d3.select('.chart-color-legend').append('ul')

  scaleC.domain(colorDomain.colors)
    .range(COLORS)

  // Move No Data to End of list
  colorDomain.colors.push(colorDomain.colors.shift())

  let items = colorLegend.selectAll('li').data(colorDomain.colors)
  items.enter().append('li')
    .attr('class', d => 'color' + d)
    .html(function (d) {
      let label = d
      if (d == 6) {
        label = 'China'
      } else if (d == 0) {
        label = 'No Data'
      }
      return '<span style="background-color:' + scaleC(d) + '"></span>' + label
    })
}

function setupPlayBtn () {
  playBtn
    .on('click', function () {
      if (playing == false) {
        timer = setInterval(function () {
          yearRange.noUiSlider.set(currentYear + 1)
        }, 1000)

        d3.select(this)
          .classed('active', true)
        .select('span')
          .attr('class', 'pause-icon')
        playing = true
      } else {
        stopAnimation(playBtn, timer)
      }
    })
}

function stopAnimation (playBtn, timer) {
  clearInterval(timer)
  playBtn.classed('active', false).select('span').attr('class', 'play-icon')
  playing = false
}

function removeEmptyDataPoints (data) {
  let filtered = data.filter(function (column) {
    if (column[currentAxes.x.name] && column[currentAxes.y.name]) {
      d3.select('.checkbox-container #' + column.ISO).property('disabled', false)
      return column
    } else {
      d3.select('.checkbox-container #' + column.ISO).property('disabled', true)
    }
  })
  return filtered
}

function search () {
  var autocomplete = new autoComplete({
    selector: 'input[name="country-search"]',
    delay: 100,
    minChars: 1,
    source: function (term, suggest) {
      term = term.toLowerCase()
      var choices = Object.values(data.countries).map(obj => [obj.iso, obj.country])
      var matches = []
      var suggestions = []
      for (let i = 0; i < choices.length; i++) {
        if (~(choices[i][1]).toLowerCase().indexOf(term)) suggestions.push(choices[i])
      }
      suggest(suggestions)
    },
    renderItem: function (item, search) {
      searchWarning.text(null)
      search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      var re = new RegExp('(' + search.split(' ').join('|') + ')', 'gi')
      return '<div class="autocomplete-suggestion" data-name="' + item[1] + '" data-iso="' + item[0] + '" data-val="' + search + '">' + item[1].replace(re, '<strong>$1</strong>') + '</div>'
    },
    onSelect: function (e, term, selectedItem) {
      e.preventDefault()
      let iso = selectedItem.getAttribute('data-iso')
      searchItem(iso)
    }
  })

  document.querySelector('input[name="country-search"]').onkeypress = function (e) {
    if (!e) e = window.event
    var keyCode = e.keyCode || e.which
    searchWarning.text(null)
    if (keyCode == '13') {
      let capitalize = this.value.charAt(0).toUpperCase() + this.value.slice(1)
      let lowercase = this.value.toLowerCase()
      let selectedItem = document.querySelector('[data-val="' + capitalize + '"') || document.querySelector('[data-val="' + lowercase + '"')
      let iso = selectedItem.getAttribute('data-iso')
      searchItem(iso)

      // Enter pressed
      return false
    }
  }
}

function searchItem (iso) {
  if (!data.countries[iso]) {
    searchWarning.text('No data available for this item')
    return
  }

  let itemInput = d3.select('input[name="country"]#' + iso)
  if (itemInput.property('disabled')) {
    searchWarning.text('No data available for this item for the current year.')
    return
  }

  itemInput.property('checked', true).on('change')()
}

function drawPrimaryChart () {
  let selectedCountries = calculateSelectedCountries()
  currentYear = calculateYears()
  currentAxes.x.name = calculateXSelect()
  currentAxes.x.scaleType = calculateScaleTypes('x')
  currentAxes.y.name = calculateYSelect()
  currentAxes.y.scaleType = calculateScaleTypes('y')
  currentAxes.radius.name = calculateRadiusSelect()

  let sortedData = removeEmptyDataPoints(data.years[currentYear]).sort(dynamicSort('-' + currentAxes.radius))

  // If countries are selected, remove any empty data points and sort it by Year so the most recent year is always on top. Then remove that countries data from the existing array and append all of its data to the end of the existing array.
  if (selectedCountries.countriesData.length) {
    let selectedCountriesData = removeEmptyDataPoints(selectedCountries.countriesData).sort(dynamicSortMultiple('ISO', 'Year'))

    selectedCountries.countriesData = selectedCountriesData

    let filteredData = sortedData.filter(function (country) {
      return !selectedCountries.countries.includes(country.ISO)
    })
  }

  currentAxes.x.range = ranges[currentAxes.x.name]
  currentAxes.y.range = ranges[currentAxes.y.name]
  currentAxes.radius.range = ranges[currentAxes.radius.name]

  let currentValues = {
    currentYear: currentYear,
    scaleC: scaleC,
    axes: currentAxes
  }

  chart.init({
    data: sortedData,
    currentValues: currentValues,
    colorDomain: colorDomain,
    selectedCountries: selectedCountries,
    container: '.chart-primary'
  })
}

function initSidebar () {
  if (windowWidth <= 768) {
    sidebar.sidebarMobile()
  }
}

function resize () {
  if (windowWidth != window.innerWidth) {
    windowWidth = window.innerWidth
    chart.resize()
    initSidebar()
  }
}

function init () {
  loadData()
  colorDomain.colors = calculateColors()
  setupColorLegend()
  setupRegionFilter()
  search()
  setupAxisSelect()
  setupYearRange()
  initSidebar()
}

function dynamicSort (property, comparisonType = 'string') {
  var sortOrder = 1
  if (property[0] === '-') {
    sortOrder = -1
    property = property.substr(1)
  }
  return function (a, b) {
    if (comparisonType == 'string') {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0
    } else {
      var result = a[property] - b[property]
    }
    return result * sortOrder
  }
}

function dynamicSortMultiple () {
  /*
   * save the arguments object as it will be overwritten
   * note that arguments object is an array-like object
   * consisting of the names of the properties to sort by
   */
  var props = arguments
  return function (obj1, obj2) {
    var i = 0, result = 0, numberOfProperties = props.length
      /* try getting a different result from 0 (equal)
       * as long as we have extra properties to compare
       */
    while (result === 0 && i < numberOfProperties) {
      result = dynamicSort(props[i])(obj1, obj2)
      i++
    }
    return result
  }
}

window.addEventListener('DOMContentLoaded', init)
window.addEventListener('resize', resize)
