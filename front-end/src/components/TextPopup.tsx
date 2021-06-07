import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@material-ui/core";
// import './cookiebar.scss'
import EventEmitter from "../lib/EventEmitter";

type State = {
  showTextPopup: boolean;
  textContent: React.Component | string;
};

export default class Cookiebar extends React.Component<{}, State> {
  state: State = {
    showTextPopup: false,
    textContent: "",
  };

  componentDidMount() {
    EventEmitter.on("open-text-popup", this.handleOpenTextPopup);
  }

  handleOpenTextPopup = (textContent: React.Component | string) => {
    this.setState({
      showTextPopup: true,
      textContent,
    });
  };

  handleClose = () => {
    this.setState({
      showTextPopup: false,
      textContent: "",
    });
  };

  render() {
    const { showTextPopup, textContent } = this.state;

    return (
      <Dialog open={showTextPopup} onClose={this.handleClose}>
        <DialogContent>{textContent}</DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose}>Sluiten</Button>
        </DialogActions>
      </Dialog>
    );
  }
}
