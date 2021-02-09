import React from 'react'
import { Button, Dialog, DialogActions, DialogContent, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core'
import { css } from '@emotion/css'
import {ApplicationContext} from "./ApplicationContext"

import EventEmitter from './lib/EventEmitter'

type Props = {
  farmerData: any
  date: string
}

const PlotListDialog = ({ farmerData, date, navigate }: Props) => {
  return(
    <ApplicationContext.Consumer>
      {({showModal, toggleShowModal}) =>
          <Dialog
              open={showModal}
              onClose={toggleShowModal}
              fullScreen
          >
            <DialogContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Boer</TableCell>
                    <TableCell>GEWAS</TableCell>
                    <TableCell>Vochtgehalte</TableCell>
                    <TableCell>Vocht tekort</TableCell>
                    <TableCell>Evapotranspiratie</TableCell>
                    <TableCell>Beregening</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {farmerData.plotsGeoJSON.features.map((feature: any) => {
                    const [sprinklingData] = farmerData.plotFeedback.filter((feedback: any) => feedback.plotId === feature.properties.plotId)
                    const quantityForDate = sprinklingData ? sprinklingData.quantities.find((q: any) => q.date === date) : null
                    const sprinkling = quantityForDate ? quantityForDate.quantityMM : 0
                    let analytics = undefined
                    if (feature.properties.plotId && farmerData.plotsAnalytics[feature.properties.plotId]) {
                      const analyticsIndex = farmerData.plotsAnalytics[feature.properties.plotId].findIndex((a: any) => a.date === date)
                      analytics = farmerData.plotsAnalytics[feature.properties.plotId][analyticsIndex]
                    }
                    if (!analytics) {
                      analytics = {}
                    }
                    return (
                        <TableRow
                            key={feature.properties!.plotId}
                            onClick={() => {
                              const path = `/map/${date}/plot/${feature.properties!.plotId}`
                              EventEmitter.emit('navigate', path)
                              toggleShowModal()
                            }}
                            className={css`cursor: pointer;`}
                        >
                          <TableCell>{feature.properties.plotId}</TableCell>
                          <TableCell>{feature.properties.farmerName}</TableCell>
                          <TableCell>{feature.properties.cropTypes}</TableCell>
                          <TableCell>{Math.round(analytics.availableSoilWater)}</TableCell>
                          <TableCell>{Math.round(analytics.deficit)}</TableCell>
                          <TableCell>{Math.round(analytics.evapotranspiration)}</TableCell>
                          <TableCell>{sprinkling}</TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </DialogContent>
            <DialogActions>
              <Button
                  onClick={toggleShowModal}
              >Annuleren</Button>
            </DialogActions>
          </Dialog>
      }
    </ApplicationContext.Consumer>
  )
}

export default PlotListDialog