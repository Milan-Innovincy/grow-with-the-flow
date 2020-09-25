import React, { Component } from 'react'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { css } from 'emotion'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'

import TopBar from './TopBar'
import MapAndAnalytics from './MapAndAnalytics';
import { AuthenticationContext } from './AuthenticationContext';
import Keycloak from "keycloak-js";

const theme = createMuiTheme({
  palette: {
    primary: { main: '#2F3D50', contrastText: '#fff' }
  },
  typography: { useNextVariants: true }
})

interface IState {
    authenticated: boolean,
    keycloak: Keycloak.KeycloakInstance
}

class App extends Component<{}, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            authenticated: false,
            keycloak: Keycloak('/keycloak.json'),
        };
    }

    componentDidMount() {
        const keycloak = this.state.keycloak;
        keycloak.init({onLoad: 'login-required'})
            .success((authenticated: boolean) => {
            this.setState({ keycloak: keycloak, authenticated: authenticated })
        });
    }

  render() {
    return (<AuthenticationContext.Provider value={{
        authenticated: this.state.authenticated,
        keycloak: this.state.keycloak
    }}>
        <BrowserRouter>
        <MuiThemeProvider theme={theme}>
        <div
    className={css`
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        `}
        >
        <TopBar/>
        <div className={css`flex: 1; overflow: hidden;`}>
        <Switch>
        <Route path="/map/:date?/:selectionType?/:selectionId?" component={MapAndAnalytics}/>
    <Redirect to="/map"/>
        </Switch>
        </div>
        </div>
        </MuiThemeProvider>
        </BrowserRouter>
        </AuthenticationContext.Provider>)
  }
}

export default App;