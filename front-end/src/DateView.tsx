import React from "react";
import { css } from "@emotion/css";
import { DateTime } from "luxon";
import { CalendarBlank } from "mdi-material-ui";

const DateView = ({ date }: { date: Date }) => {
  const luxonDate = DateTime.fromJSDate(date).setLocale("nl");
  const day = luxonDate.toFormat("dd");
  const month = luxonDate.toFormat("MMMM");
  return (
    <div
      className={css`
        position: relative;
        top: -20px;
        display: flex;
        align-items: center;
      `}
    >
      <div
        className={css`
          position: relative;
          font-weight: bold;
          font-size: 20px;
          color: #2f3d50;
        `}
      >
        <CalendarBlank
          className={css`
            width: 50px !important;
            height: 50px !important;
            color: #e0f2f1;
          `}
        />
        <div
          className={css`
            position: absolute;
            top: 10px;
            left: 8px;
            width: 34px;
            height: 32px;
            background-color: #e0f2f1;
            display: flex;
            align-items: flex-end;
            justify-content: center;
          `}
        >
          {day}
        </div>
      </div>
      <div
        className={css`
          margin-top: 6px;
        `}
      >
        {month}
      </div>
    </div>
  );
};

export default DateView;
