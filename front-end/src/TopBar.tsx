import React from 'react'
import { AppBar, Toolbar, Typography, Avatar } from '@material-ui/core'
import { Account } from 'mdi-material-ui'
import { css } from 'emotion'
import logo from './images/logo.png'
import { AuthenticationContext } from "./AuthenticationContext";

export default () =>
  <AppBar position="static">
    <Toolbar>
      <div
          className={css`flex: 1`}
        >
        <img
            src={logo}
            width='250px'
            alt='Grow with the Flow'
        />
      </div>
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
        >
          <AuthenticationContext.Consumer>
            {({keycloak}) => <>{keycloak.tokenParsed && keycloak.tokenParsed.name}</>}
        </AuthenticationContext.Consumer>
        </Typography>
        <Avatar className={css`background-color: #ba68c8 !important;`}>
          <Account/>
        </Avatar>
      </a>
    </Toolbar>
  </AppBar>