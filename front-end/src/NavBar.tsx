import React from 'react'
import { Paper, BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import { ChartBar, FormatListChecks, ViewDashboardOutline, DotsHorizontal } from 'mdi-material-ui'
import { css } from 'emotion'

export default () =>
  <Paper
    elevation={4}
    className={css`
      position: relative;
      z-index: 1000;
    `}
    square
  >
    <BottomNavigation
      showLabels
    >
      <BottomNavigationAction
        label="Dashboard"
        icon={<ChartBar/>}
      />
      <BottomNavigationAction
        label="To Do"
        icon={<FormatListChecks/>}
      />
      <BottomNavigationAction
        label="Mijn Plots"
        icon={<ViewDashboardOutline/>}
        className={css`
          border-top: 2px solid #00acc1 !important;
          color: #00bcd4 !important;
        `}
      />
      <BottomNavigationAction
        label="Meer"
        icon={<DotsHorizontal/>}
      />
    </BottomNavigation>
  </Paper>
