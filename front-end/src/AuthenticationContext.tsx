import React from "react";

export type ContextValue = {
    authenticated: boolean,
    keycloak: any,
};

export const AuthenticationContext = React.createContext<ContextValue>({
    authenticated: false,
    keycloak: {},
});