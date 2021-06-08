import React, { Component } from "react";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import { css } from "@emotion/css";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import TopBar from "./TopBar";
import MapAndAnalytics from "./MapAndAnalytics";
import { ApplicationContext } from "./ApplicationContext";
import Snackbar from "./Snackbar";
import Cookiebar from "./components/Cookiebar/Cookiebar";
import TextPopup from "./components/TextPopup";
import EventEmitter from "./lib/EventEmitter";
import Keycloak from "keycloak-js";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#2F3D50",
      contrastText: "#fff",
    },
    secondary: {
      main: "#fff",
      contrastText: "#000",
    },
  },
});

interface IState {
  authenticated: boolean;
  keycloak: Keycloak.KeycloakInstance;
  showModal: boolean;
}

class App extends Component<{}, IState> {
  constructor(props: any) {
    super(props);

    this.state = {
      authenticated: false,
      keycloak: Keycloak("/keycloak.json"),
      showModal: false,
    };
  }

  componentDidMount() {
    const keycloak = this.state.keycloak;

    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then(() => {
          EventEmitter.emit("authenticated", keycloak.token);
        })
        .catch(() => {});
    };

    keycloak
      .init({ onLoad: "login-required" })
      .then((authenticated: boolean) => {
        if (authenticated === true) {
          EventEmitter.emit("authenticated", keycloak.token);
        }
        this.setState({
          keycloak: keycloak,
          authenticated: authenticated,
        });
      });
  }

  render() {
    return (
      <ApplicationContext.Provider
        value={{
          authenticated: this.state.authenticated,
          keycloak: this.state.keycloak,
          showModal: this.state.showModal,
          toggleShowModal: () => {
            this.setState({
              showModal: !this.state.showModal,
            });
          },
        }}
      >
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
                z-index: -1;
              `}
            >
              <Cookiebar />
              <TopBar />
              <div
                className={css`
                  flex: 1;
                  overflow: hidden;
                `}
              >
                <Switch>
                  <Route
                    path="/map/:date?/:selectionType?/:selectionId?"
                    component={MapAndAnalytics}
                  />
                  <Redirect to="/map" />
                </Switch>
              </div>
              <TextPopup />
              <Snackbar />
            </div>
          </MuiThemeProvider>
        </BrowserRouter>
      </ApplicationContext.Provider>
    );
  }
}

export default App;
