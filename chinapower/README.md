# Development Tracker
A visulization built using [D3.js](https://d3js.org/) to show trends about global development in comparison to China over time.

ChinaPower has two different trackers that are powered by the same base code: Advanced & Basic. The advanced version does everything the basic version does but with an expanded dataset and includes a guided introduction to using the interactive.

## Development
In the `chinapower` directory:
1. Run `npm install` to install project dependencies.
2. Run `npm run start` to build a local version of the project
The basic tracker will be accessible at `http://localhost:8080/` and the advanced tracker will be available at `http://localhost:8080/advanced.html`

## Build
1. Run `npm run build`
2. Compiled files will be created in `chinapower/dist`

## File Structure Notes
The `data`, `img`, `js`, and `scss` files are common to both versions.

Files for the basic version:
- `index.html`: Page template
- `index.js`: Loads data files and calls chart

Files for the advanced version:
- `advanced.html`: Page template
- `advanced.js`: Loads data files, sets up the guided introduction, and calls chart

## Data Formatting
The chart requires two CSV files to run: one for the data and one for the indicators. Version specific data is loaded into the project by including it in either the `index.js` or `advanced.js` files depending on the version.

### Indicators
The fields required for an indicator CSV are:
- `title`: This is an ID and is used to link the indicators and data CSVs
- `type`: The type of indicator. For the X & Y axes indicators, the type is displayed next to the (X/Y-Axis) title.
  - Note: The indicator with the `title` type is used to generate the page title.
- `name_eng`: The display name of the indicator in English (Translatable Field)
- `default_axis`: Either 'c', 'r', 'x', or 'y'. Indicators may be assigned to multiple axis (separated by a comma).
- `is_default_value`: Enter '1' if the indicator should be selected by default
- `min_years`: The minimum amount of years for the indicator's dataset
- `max_years`: The maximum amount of years for the indicator's dataset
- `step_alt`: By default, the timeline will increment 1 year at a time. To accomodate gaps in the data, you may specify the start year:step;end year:step. Example: `1990:5;2005:1` This will result in the timeline skipping every 5 years from 1990 to 2005 and then reverting to every 1 year.
- `min_value`: If you want to specify the range of the axis, you must specify a minimum value and a maximum value.
- `max_value`: If you want to specify the range of the axis, you must specify a minimum value and a maximum value.
- `is_percentage`: Enter 1 if the indicator is a percentage.
- `no_formatting`: Enter 1 if no formatting should be applied to the data values
- `units_eng`: The units in English (Translatable Field)
- `is_prefix`: If the unit should be a prefix, put 1. Otherwise the unit will be assumed to be a suffix.
- `desc_eng`: The description for the indicator that will appear at the top of the page when the indicator is selected. (Translatable Field)
- `hint_eng`: Advanced version only; Text for the hint for the indicator. Leave blank to not show a hint. (Translatable Field)
- `is_logged_default`: If the indicator should be logged by default, put 1
- `comparison_countries`: A semi-colon separated list of ISO codes. These will be marked as recommended countries for comparison.


### Data
Each country should have a single row per year with the following columns:
- `ISO`: The ISO code for the country
- `country_eng`: The English name of the country (Translatable Field)
- `region_eng`: The region of the country. This field is used to group the countries together by region. (Translatable Field)
- `Year`: The year for the data
- `world_bank_classification`: The WBC classification for the country
- Indicators: The remaining columns containing the data for each country should match the `title` field from the indicators sheet.

*Note:* Fields that are translatable must have the same base name, followed by _LANG Code.