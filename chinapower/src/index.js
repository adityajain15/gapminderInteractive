import * as plot from './js/createPlot'
import Data from './data/basic-data-20171222.csv'
import Indicators from './data/basic-indicators-20171222.csv'
import './scss/main.scss'
import translations from './js/translations'
import strings from './js/translationStrings-20180130'

let plotted
let lang = translations.displayLang()
const langStrings = strings.strings

function init () {
  plotted = plot.createPlot({
    data: Data,
    indicators: Indicators,
    language: lang,
    strings: langStrings
  })
  plotted.init()
}
window.addEventListener('DOMContentLoaded', init)
