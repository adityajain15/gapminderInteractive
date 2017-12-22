import * as plot from './js/createPlot'
import Data from './data/basic-data-20171222.csv'
import Indicators from './data/basic-indicators-20171222.csv'
import './scss/main.scss'
import intro from 'intro.js'
const introJs = intro.introJs()

let plotted

function init () {
  plotted = plot.createPlot({
    data: Data,
    indicators: Indicators
  })
  plotted.init()
}
window.addEventListener('DOMContentLoaded', init)
