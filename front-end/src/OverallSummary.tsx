import React from "react";
import "date-fns";
import { css } from "@emotion/css";
import { DateTime } from "luxon";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import "moment/locale/nl";

import DateView from "./DateView";
//import PlotList from "./components/PlotList/PlotList";

type Props = {
  farmerData: any;
  date: Date;
  navigate: (path: string) => void;
  isFetchingData: boolean;
};

const OverallSummary = ({ farmerData, date, navigate, isFetchingData }: Props) => {
  const handleDateViewClick = () => {
    document
      .querySelector(
        ".MuiFormControl-root.MuiTextField-root.MuiFormControl-marginNormal button"
      )
      .click();
  };

  const handleDateChange = (newDate: any) => {
    navigate(
      `/map/${DateTime.fromMillis(moment(newDate).valueOf()).toISODate()}`
    );
  };

  return (
    <div
      className={css`
        display: flex;
        height: 60px;
        padding: 30px 20px 0 20px;
      `}
    >
      <div
        className={css`
          flex: 1;
          display: flex;
          flex-direction: column;
          color: #2f3d50;
        `}
      >
        <small
          className={css`
            font-weight: lighter;
            margin: 0 0 6px 50px;
          `}
        >
          Alle Pixels
        </small>
        <div
          onClick={handleDateViewClick}
          className={css`
            cursor: pointer;
          `}
        >
          <DateView date={date} />
        </div>
        <MuiPickersUtilsProvider
          libInstance={moment}
          utils={MomentUtils}
          locale={"nl"}
        >
          <KeyboardDatePicker
            className={css`
              display: none !important;
            `}
            margin="normal"
            id="date-picker-dialog"
            disableFuture={true}
            minDate="2021.01.01"
            label="Date picker dialog"
            format="yyyy-MM-dd"
            value={date}
            onChange={handleDateChange}
            KeyboardButtonProps={{
              "aria-label": "change date",
            }}
          />
        </MuiPickersUtilsProvider>
      </div>
      {/* <div>
        <PlotList
          farmerData={farmerData}
          date={DateTime.fromJSDate(date).toISODate()}
          navigate={navigate}
          selectedPlotId={undefined}
          selectedPixel={undefined}
          isFetchingData={isFetchingData}
        />
      </div> */}
    </div>
  );
};

export default OverallSummary;
