import React, { Component } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  CircularProgress,
} from "@material-ui/core";
import { css } from "@emotion/css";
import EventEmitter from "./lib/EventEmitter";

type State = {
  open: boolean;
  loading: boolean;
  value: string;
  original: string;
  plotId: string | undefined;
};

type Props = {
};

export default class UpdateDescriptionDialog extends Component<Props, State> {
  state: State = {
    open: false,
    loading: false,
    value: "",
    original: "",
    plotId: undefined,
  };

  resolve?: (value?: string | PromiseLike<string>) => void =
    undefined;

  open = (value: string, plotId: string) => {
    this.setState({
      open: true,
      value: value,
      original: value,
      plotId: plotId,
    });
    return new Promise<string | undefined>((resolve, reject) => {
      this.resolve = resolve;
    });
  };

  handleSubmitted = (value: string) => {
    const payload = {
      value,
      selectedPlotId: this.state.plotId,
    };

    EventEmitter.emit("plot-description-update", payload);
    this.setState({ loading: true });
  };

  handleUpdateSuccess = () => {
    this.setState({
      loading: false,
      open: false,
      value: "",
    });
    EventEmitter.emit("show-snackbar", {
      snackbarMessage: "Waarde is opgeslagen.",
    });
  };

  handleUpdateFailure = () => {
    this.setState({
      loading: false,
      open: false,
    });
    EventEmitter.emit("show-snackbar", {
      snackbarMessage: "De waarde kon niet worden opgeslagen.",
    });
  };

  componentDidMount() {
    EventEmitter.on(
      "plot-description-updated-success",
      this.handleUpdateSuccess
    );
    EventEmitter.on(
      "plot-description-updated-failure",
      this.handleUpdateFailure
    );
  }

  render() {
    const { open, loading, value, original } = this.state;
    return (
      <Dialog open={open} onClose={() => this.setState({ open: false })}>
        <DialogContent className={css`width: 540px;`}>
          <TextField
            type="text"
            autoFocus
            fullWidth
            multiline
            label="Perceel Commentaar"
            value={value}
            onChange={(e) =>
              this.setState({ value: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <div
            className={css`
              position: relative;
              pointer-events: none;
            `}
          >
            <Button
              color="primary"
              onClick={() => {
                this.handleSubmitted(value);
                this.resolve!(value);
              }}
              disabled={loading || value === original}
              className={css`
                pointer-events: auto;
              `}
            >
              Bijwerken
            </Button>
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
              `}
            >
              {loading && <CircularProgress size={24} />}
            </div>
          </div>
          <Button
            onClick={() => this.setState({ open: false })}
            disabled={loading}
          >
            Annuleren
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
