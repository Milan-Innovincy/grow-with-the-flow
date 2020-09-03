import React, { Component } from 'react';
import Keycloak from 'keycloak-js';

class KeycloakWrapper extends Component {

    constructor(props) {
        super(props);
        this.state = { keycloak: null, authenticated: false };
    }

    componentDidMount() {
        const keycloak = Keycloak('/keycloak.json');
        keycloak.init({onLoad: 'login-required'}).then(authenticated => {
            this.setState({ keycloak: keycloak, authenticated: authenticated })
        })
    }

    render() {
        if (this.state.keycloak) {
            if (this.state.authenticated) return (
                <>{this.props.children}</>
        ); else return (<div>Unable to authenticate!</div>)
        }
        return (
            <div>Initializing Keycloak...</div>
    );
    }
}
export default KeycloakWrapper;