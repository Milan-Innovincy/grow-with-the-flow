import React, {useState, useEffect, useContext} from 'react'
import { RouteComponentProps, Redirect } from 'react-router-dom'
import axios from 'axios'
import { css } from 'emotion'
import { Paper, CircularProgress } from '@material-ui/core'
import { fromPairs } from 'lodash'
import { DateTime, Duration } from 'luxon'

import { BASE_URL, DEFAULT_DATE } from './constants'
import MapView from './MapView'
import Analytics from './Analytics'
import OverallSummary from './OverallSummary'
import { ApplicationContext } from "./ApplicationContext"

type Props = RouteComponentProps<{
  date?: string
  selectionType?: 'plot' | 'pixel'
  selectionId?: string
}>

export default ({ match, history }: Props) => {

  const [ farmerData, setFarmerData ] = useState(null as any)
  const [ sprinklingCache, setSprinklingCache ] = useState({})
  const contextValue = useContext(ApplicationContext)

  const currentDate = DateTime.fromJSDate(new Date())
                                  .minus(Duration.fromObject({ days: 2 }))
                                  .toFormat('yyyy-MM-dd')

  useEffect(() => {
    (async () => {
      // TODO: Refactor so that defaultDate is no longer used. Endpoints have to be migrated first by Yaniv.
      const prefix = 'https://storage.googleapis.com/grow-with-the-flow.appspot.com'
      const defaultDate = DEFAULT_DATE
      const dateToken = defaultDate.replace(/-/g, '')
      const isAuthenticated = contextValue.keycloak && contextValue.keycloak.token

      // TODO: Clean this stuff up ASAP
      const { data: landUse } = await axios.get(`${prefix}/gwtf-land-use.json`)
      const { data: soilMap } = await axios.get(`${prefix}/gwtf-soil-map.json`)
      const { data: pixelsData } = await axios.get(`${prefix}/gwtf-pixels-${dateToken}.json`)

      if (isAuthenticated) {
        // TODO: Move this into the global context once old API calls are not longer a bottleneck
        const axiosInstance = axios.create({
          baseURL: BASE_URL
        })
        const { keycloak: { token: authToken } } = contextValue
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

        const plotsGeoJSON = await axiosInstance.get(`/plots`).then(({ data }) => {
          return data
        }).catch(error => {
          // TODO: Properly handle error
          return {}
        })
        const plotsAnalytics = await axiosInstance.get(`/plot-analytics?on=${currentDate}&attributes=deficit,measuredPrecipitation,evapotranspiration,availableSoilWater`).then(({ data }) => {          
          return data
        }).catch(error => {
          // TODO: Properly handle error
          return {}
        })

        pixelsData.landUse = landUse
        pixelsData.soilMap = soilMap

        // TODO: Processing features data should NOT happen while entire app is still loading. Find responsible component and move logic there.
        plotsGeoJSON.features = plotsGeoJSON.features.filter((feature: any) => feature.properties.plotId)
        
        // TODO: Remove default date once endpoints are upgraded 
        const farmerData = {
          currentDate,
          pixelsData,
          plotsGeoJSON,
          plotsAnalytics
        }

        setFarmerData(farmerData)
      }
    })()
  }, [contextValue.authenticated])

  const { date, selectionType, selectionId } = match.params
  if (!date) {
    return <Redirect to={`/map/${currentDate}`}/>
  }

  if(!farmerData) {
    return(
      <div
        className={css`
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <CircularProgress/>
      </div>
    )
  }

  let selectedPlotId: string | undefined = undefined
  let selectedPixel: Array<number> | undefined = undefined

  if(selectionId) {
    switch(selectionType) {
      case 'plot':
        selectedPlotId = selectionId
        break
      case 'pixel':
        selectedPixel = selectionId.split('-').map(n => parseInt(n, 10))
        break
      default:
        return <Redirect to={`/map/${date}`}/>
    }
  }

  const navigate = (path: string) => history.push(path)

  return (
    <div
      className={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          position: relative;
          flex: 1;
        `}
      >
        <MapView
          navigate={navigate}
          farmerData={farmerData}
          date={date}
          selectedPlotId={selectedPlotId}
          selectedPixel={selectedPixel}
        />
      </div>
      <Paper
        elevation={5}
        className={css`
          position: relative;
          z-index: 1000;
        `}
        square
      >
        {(selectedPlotId || selectedPixel) ?
          <Analytics
            date={new Date(date)}
            farmerData={farmerData}
            navigate={navigate}
            selectedPixel={selectedPixel}
            selectedPlotId={selectedPlotId}
            sprinklingCache={sprinklingCache}
            setSprinklingCache={setSprinklingCache}
          /> : <OverallSummary
            date={new Date(date)}
            farmerData={farmerData}
            navigate={navigate}
            sprinklingCache={sprinklingCache}
          />
        }
      </Paper>
    </div>
  )
}