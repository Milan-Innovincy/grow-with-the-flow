import React, { Component, ReactNode, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core'
import { css } from 'emotion'
import {ApplicationContext} from "./ApplicationContext";

type Props = {
  farmerData: any
  date: string
  navigate: (path: string) => void
  sprinklingCache: any
}

export default ({ farmerData, date, navigate, sprinklingCache }: Props) => {
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
                    let analytics = undefined
                    let sprinkling = 0
                    if (feature.properties.plotId && farmerData.plotsAnalytics[feature.properties.plotId]) {
                      const analyticsIndex = farmerData.plotsAnalytics[feature.properties.plotId].findIndex((a: any) => a.date === date)
                      analytics = farmerData.plotsAnalytics[feature.properties.plotId][analyticsIndex]
                      sprinkling = sprinklingCache[`${feature.properties.plotId}-${analyticsIndex}`] || 0
                    }
                    if (!analytics) {
                      analytics = {}
                    }
                    return (
                        <TableRow
                            key={feature.properties!.plotId}
                            onClick={() => {
                              navigate(`/map/${date}/plot/${feature.properties!.plotId}`)
                              toggleShowModal();
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
