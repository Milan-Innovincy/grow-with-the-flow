import React from 'react'
import { AppBar, Toolbar, Typography, Avatar, Menu, MenuItem } from '@material-ui/core'
import { Account } from 'mdi-material-ui'
import { css } from 'emotion'

export default () =>
  <AppBar position="static">
    <Toolbar>
      <Typography
        color="inherit"
        variant="h6"
        className={css`flex: 1;`}
      >Interpolis. Glashelder</Typography>
      <a
        className={css`
          display: flex;
          align-items: center;
        `}
      >
        <Typography
          color="inherit"
          variant="h6"
          className={css`margin-right: 10px !important;`}
        >Johan van Gerwen</Typography>
        <Avatar className={css`background-color: #ba68c8 !important;`}>
          <Account/>
        </Avatar>
      </a>
    </Toolbar>
  </AppBar>