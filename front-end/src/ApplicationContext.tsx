import React from "react";

export type ContextValue = {
  authenticated: boolean;
  keycloak: any;
  showModal: boolean;
  toggleShowModal: () => void;
};

export const ApplicationContext = React.createContext<ContextValue>({
  authenticated: false,
  keycloak: {},
  showModal: false,
  toggleShowModal: () => null,
});
