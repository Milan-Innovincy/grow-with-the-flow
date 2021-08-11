import React, { ReactNode, useEffect, useState } from "react";
import { css } from "@emotion/css";
import "date-fns";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelProps,
  RectangleProps,
  Line,
} from "recharts";
import {
  Paper,
  Fab,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Input,
} from "@material-ui/core";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import {
  Close,
  Vanish,
  CarDefrostRear,
  WaterPercent,
  Thermometer,
} from "mdi-material-ui";
import { DateTime, Duration } from "luxon";
import { padStart } from "lodash";
import EventEmitter from "./lib/EventEmitter";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import "moment/locale/nl";

import axiosInstance from "./lib/axios";

import UpdateSprinklingDialog from "./UpdateSprinklingDialog";
import DateView from "./DateView";
import { ReactComponent as AlfalfaIcon } from "./icons/alfalfa.svg";
import { ReactComponent as CornIcon } from "./icons/corn.svg";
import { ReactComponent as GenericIcon } from "./icons/generic.svg";
import { ReactComponent as PotatoIcon } from "./icons/potato.svg";
import { ReactComponent as WheatIcon } from "./icons/wheat.svg";
import { ReactComponent as RainfallIcon } from "./icons/rainfall.svg";
import { ReactComponent as IrrigationIcon } from "./icons/irrigation.svg";
import PlotListDialog from "./PlotListDialog";
import { FarmerData } from "./MapAndAnalytics";

const cropTypes = ["mais", "aardappelen", "gras"];
const cropStatusOptions: CropStatus = {
  mais: [
    { label: "Geen Activiteit", value: 0 },
    { label: "Opkomst", value: 0.01 },
    { label: "Vijfde blad", value: 0.4 },
    { label: "Derde bladkop", value: 0.65 },
    { label: "Pluimvorming", value: 0.9 },
    { label: "Bloei", value: 1 },
    { label: "Volledige afrijping", value: 2 },
  ],
  aardappelen: [
    { label: "Geen Activiteit", value: 0 },
    { label: "Opkomst", value: 0.01 },
    { label: "Aanzet knolontwikkeling", value: 1.0 },
    { label: "Gewasbedekking volledig", value: 1.2 },
    { label: "Afsterven", value: 2.0 },
  ],
  gras: [
    { label: "Geen activiteit", value: 0 },
    { label: "Bemaaien", value: 2 },
  ],
};

const getCropType = (cropType: string) => {
  if (cropType.startsWith("Grasland")) {
    return "gras";
  }
  if (
    cropType.startsWith("Mais") ||
    cropType.startsWith("Maïs") ||
    cropType.startsWith("MaÃ¯s")
  ) {
    return "mais";
  }
  if (cropType.startsWith("Aardappelen")) {
    return "aardappelen";
  }
  return "";
};

const getCropTypeIcon = (cropType: string) => {
  switch (cropType && cropType.trim()) {
    case "Snijmais":
    case "Mais CCM":
      return <CornIcon width={28} fill="#00acc1" />;
    case "Cons. en industrieaardappelen.":
      return <PotatoIcon width={28} stroke="#00acc1" />;
    case "Luzerne.":
      return <AlfalfaIcon width={28} fill="#00acc1" />;
    case "Winter Tarwe":
      return <WheatIcon width={28} fill="#00acc1" />;
    default:
      return <GenericIcon width={28} fill="#00acc1" />;
  }
};

const formatCropStatus = (
  cropStatuses: any,
  currentPlotId: string,
  cropType: string,
  date: string
) => {
  if (!cropStatuses || !cropStatuses.length) {
    return;
  }

  const selectedPlot = cropStatuses.find((plot: any) => {
    return plot.plotId === currentPlotId;
  });

  if (!selectedPlot) {
    return;
  }

  if (!cropType) {
    return;
  }

  const splitDate = date.split("/");
  const formattedDate = `${splitDate[2]}-${splitDate[1]}-${splitDate[0]}`;
  const selectedPlotStatus = selectedPlot.statuses.find((plotStatus: any) => {
    return plotStatus.date === formattedDate;
  });

  if (!selectedPlotStatus) {
    return;
  }

  return cropStatusOptions[cropType].find(
    (cropStatusValue: CropStatusValue) => {
      return (
        cropStatusValue.value === parseFloat(selectedPlotStatus["crop-status"])
      );
    }
  );
};

const developmentStateToLabel = (
  developmentState: number,
  cropType: string
) => {
  if (!cropType) {
    return;
  }
  if (!cropStatusOptions[cropType]) {
    return;
  }

  const nextStageIndex = cropStatusOptions[cropType].findIndex(
    (cropStatusValue: CropStatusValue) => {
      return developmentState < cropStatusValue.value;
    }
  );
  return cropStatusOptions[cropType][nextStageIndex - 1];
};

let updateSprinklingDialog: UpdateSprinklingDialog;

const SelectedSumData = ({
  circleContent,
  label,
  text,
}: {
  circleContent: ReactNode;
  label: string;
  text: string;
}) => (
  <div
    className={css`
      display: flex;
      align-items: center;
      text-transform: uppercase;
      margin-left: 40px;
    `}
  >
    <div
      className={css`
        border: 1px solid #d2eded;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
      `}
    >
      {circleContent}
    </div>
    <div
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <small
        className={css`
          color: #bcbcbc;
        `}
      >
        {label}
      </small>
      <strong>{text}</strong>
    </div>
  </div>
);

const LegendItem = ({
  label,
  shape,
  color,
  borderColor,
}: {
  label: string;
  shape: "square" | "circle" | "line";
  color: string;
  borderColor?: string;
}) => (
  <div
    className={css`
      display: flex;
      align-items: center;
      margin-right: 20px;
    `}
  >
    {shape === "square" && (
      <div
        className={css`
          width: 14px;
          height: 14px;
          margin-right: 5px;
          border-radius: 3px;
          background-color: ${color};
        `}
      />
    )}
    {shape === "circle" && (
      <div
        className={css`
          width: 10px;
          height: 10px;
          margin-right: 5px;
          background-color: ${color};
          border-radius: 50%;
          border: 1px solid ${borderColor};
        `}
      />
    )}
    {shape === "line" && (
      <div
        className={css`
          width: 10px;
          height: 0px;
          margin-right: 5px;
          border-radius: 2px;
          border: 1px solid ${color};
        `}
      />
    )}
    <small
      className={css`
        color: #757575;
      `}
    >
      {label}
    </small>
  </div>
);

const paramColor = {
  rainfall: "#64b5f6",
  sprinkling: "#1565c0",
  relativeHumidity: "#5a0494",
  moisture: "#f6511d",
  desiredMoisture: "#c12d00",
  temperature: "#383a3d"
}

const CurrentDataItem = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: any;
}) => (
  <div
    className={css`
      display: flex;
      align-items: center;
      margin-right: 20px;
    `}
  >
    <div
      className={css`
        position: relative;
        border: 1px solid ${color};
        color: ${color};
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
      `}
    >
      <div
        className={css`
          position: relative;
          z-index: 1;
        `}
      >
        {value}
      </div>
      <div
        className={css`
          position: absolute;
          top: 0;
          left: 0;
          background-color: #fff;
          border-radius: 50%;
          padding: 0 2px 2px 0px;
        `}
      >
        {icon}
      </div>
    </div>
    <div
      className={css`
        color: ${color};
      `}
    >
      {label}
    </div>
  </div>
);

type Props = {
  navigate: (path: string) => void;
  farmerData: FarmerData;
  date: Date;
  selectedPlotId?: string;
  selectedPixel?: Array<number>;
};

type CropStatus = {
  [key: string]: CropStatusValue[];
};

type CropStatusValue = {
  label: string;
  value: number;
};

type AnalyticsData = {
  date: string;
  rainfall: number;
  sprinkling: number;
  moisture: number;
  desiredMoisture: number;
  evapotranspiration: number;
  deficit: number;
  developmentStage: number;
  temperature: number;
  relativeHumidity: number;
};

const Analytics: React.FC<Props> = ({
  navigate,
  farmerData,
  date,
  selectedPlotId,
  selectedPixel,
}) => {
  const [cropStatus, setCropStatus] = useState<CropStatusValue>();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [label, setLabel] = useState<string>("");
  const [cropType, setCropType] = useState<string>("");
  const [soilType, setSoilType] = useState<string>("");
  const [area, setArea] = useState<number>(0);

  useEffect(() => {
    const { pixelsData, plotsAnalytics, plotFeedback, plotCropStatus } = farmerData;

    if (selectedPlotId) {
      setLabel(`Plot ${selectedPlotId}`);
      const [sprinklingData] = plotFeedback.filter(
        (feedback: any) => feedback.plotId === selectedPlotId
      );
      const feature = farmerData.plotsGeoJSON.features.find(
        (f: any) => f.properties!.plotId === selectedPlotId
      );

      setCropType(getCropType(feature.properties.cropTypes));
      setSoilType(feature.properties.soilType);
      setArea(feature.properties.plotSizeHa);
      setCropStatus(
        formatCropStatus(
          plotCropStatus,
          selectedPlotId,
          getCropType(feature.properties.cropTypes),
          DateTime.fromJSDate(date).toFormat("dd/MM/yyyy")
        )
      );

      if (!!plotsAnalytics[feature.properties.plotId]) {
        setAnalyticsData(
          plotsAnalytics[feature.properties.plotId].map((i: any) => {
            const quantityForDate = sprinklingData
              ? sprinklingData.quantities.find((q: any) => q.date === i.date)
              : null;
            const sprinkling = quantityForDate ? quantityForDate.quantityMM : 0;

            return {
              date: DateTime.fromISO(i.date).toFormat("dd/MM/yyyy"),
              rainfall: i.measuredPrecipitation,
              sprinkling,
              moisture: i.availableSoilWater,
              desiredMoisture: i.relativeTranspiration * 100.00,
              evapotranspiration: i.evapotranspiration,
              deficit: i.deficit,
              developmentStage: i.developmentStage,
              temperature: i.averageTemperature,
              relativeHumidity: i.relativeHumidity.toFixed(0),
            };
          })
        );
      } else {
        alert("No data available for this plot.");
        navigate(`/map/${DateTime.fromJSDate(date).toISODate()}`);
      }
    }

    if (selectedPixel) {
      const [x, y] = selectedPixel;

      setLabel(
        `Pixel ${padStart(x.toString(), 3, "0")}${padStart(
          y.toString(),
          3,
          "0"
        )}`
      );
      setCropType(getCropType(pixelsData.landUse[x][y]));
      setSoilType(pixelsData.soilMap[x][y]);
      setArea(1);

      setAnalyticsData(
        pixelsData.analytics.map((i: any, index: number) => ({
          date: DateTime.fromISO(i.time).toFormat("dd/MM/yyyy"),
          isForecast: i.isForecast,
          rainfall: i.measuredPrecipitation[x][y],
          sprinkling: 0,
          moisture: i.availableSoilWater[x][y],
          desiredMoisture: i.relativeTranspiration[x][y] * 100,
          evapotranspiration: i.evapotranspiration[x][y],
          deficit: i.deficit[x][y],
          developmentStage: i.developmentStage,
          temperature: i.averageTemperature[x][y],
          relativeHumidity: i.relativeHumidity[x][y].toFixed(0),
        }))
      );
    }
  }, [selectedPlotId, selectedPixel, farmerData, farmerData.plotCropStatus]);
  const currentAnalyticsData = analyticsData.find(
    (i) => i.date === DateTime.fromJSDate(date).toFormat("dd/MM/yyyy")
  );

  setTimeout(() => {
    const nodes = document.querySelectorAll(
      ".recharts-layer.recharts-cartesian-axis-tick"
    );
    nodes.forEach((node) => {
      const textNode = node.querySelector("tspan");
      const rawDate = textNode ? textNode.innerHTML : null;

      if (rawDate && rawDate.indexOf("/") !== -1) {
        const formattedDate = new Date(
          DateTime.fromFormat(rawDate, "dd/MM/yyyy").toFormat("yyyy-MM-dd")
        );
        const predictionDate = new Date(
          DateTime.fromJSDate(new Date())
            .minus(Duration.fromObject({ days: 1 }))
            .toFormat("yyyy-MM-dd")
        );

        if (textNode) {
          if (new Date().toDateString() === formattedDate.toDateString()) {
            textNode.style.fontWeight = "900";
            textNode.style.fontSize = "12px";
          }

          if (formattedDate >= predictionDate) {
            textNode.style.fontStyle = "italic";
          }
        }
      }
    });
  }, 750);

  const handleDateViewClick = () => {
    document
      .querySelector(
        ".MuiFormControl-root.MuiTextField-root.MuiFormControl-marginNormal button"
      )
      .click();
  };

  const changeCropStatus = (event: any) => {
    setCropStatus(event.target.value);
    const formattedDate = DateTime.fromJSDate(new Date(date)).toFormat(
      "yyyy-MM-dd"
    );

    axiosInstance
      .put(
        `/plot-feedback/crop-status?plotId=${selectedPlotId}&date=${formattedDate}&crop-status=${event.target.value.toString()}`
      )
      .then(() => {
        EventEmitter.emit("sprinkling-updated-success");
      })
      .catch((error: Error) => {
        EventEmitter.emit("sprinkling-updated-failure");
        console.error(error);
      });
  };

  const handleDateChange = (newDate: any) => {
    if (selectedPlotId) {
      navigate(
        `/map/${DateTime.fromMillis(
          moment(newDate).valueOf()
        ).toISODate()}/plot/${selectedPlotId}`
      );
    }

    if (selectedPixel) {
      navigate(
        `/map/${DateTime.fromMillis(
          moment(newDate).valueOf()
        ).toISODate()}/pixel/${selectedPixel.join("-")}`
      );
    }
  };

  // const disableToday = (newDate: any) => {
  //   const fullDate = new Date();
  //   const year = fullDate.getFullYear();
  //   let month = fullDate.getMonth() + 1;
  //   if (month < 10) {
  //     month = "0" + month;
  //   }

  //   let day = fullDate.getDate();
  //   if (day < 10) {
  //     day = "0" + day;
  //   }

  //   const today = year + "-" + month + "-" + day;
  //   const dayApp = DateTime.fromMillis(moment(newDate).valueOf()).toISODate();

  //   if (today === dayApp) {
  //     return true;
  //   }
  // };

  const [leftAxe, setLeftAxe] = useState("rainfall");
  const [rightAxe, setRightAxe] = useState("moisture");

  const displayRainfall =
    leftAxe === "rainfall" ? true : rightAxe === "rainfall" ? true : false;

  const displayDesiredMoisture =
    leftAxe === "desiredMoisture"
      ? true
      : rightAxe === "desiredMoisture"
      ? true
      : false;

  const displayMoisture =
    leftAxe === "moisture" ? true : rightAxe === "moisture" ? true : false;

  const displaySprinkling =
    leftAxe === "sprinkling" ? true : rightAxe === "sprinkling" ? true : false;

  const displayTemperature =
    leftAxe === "temperature"
      ? true
      : rightAxe === "temperature"
      ? true
      : false;

  const displayHumidity =
    leftAxe === "relativeHumidity" ? true : rightAxe === "relativeHumidity" ? true : false;

  const changeLeftAxe = (event: any) => {
    setLeftAxe(event.target.value);
  };

  const changeRightAxe = (event: any) => {
    setRightAxe(event.target.value);
  };

  const axesOptions = [
    {
      value: "rainfall",
      label: "Regenval in mm",
      shape: "square",
      color: paramColor.rainfall,
      borderColor: undefined,
    },
    {
      value: "sprinkling",
      label: "Beregening in mm",
      shape: "square",
      color: paramColor.sprinkling,
      borderColor: undefined,
    },
    {
      value: "relativeHumidity",
      label: "Luchtvochtigheid in %",
      shape: "square",
      color: paramColor.relativeHumidity,
      borderColor: undefined,
    },
    {
      value: "moisture",
      label: "Beschikbaar bodemvocht in mm",
      shape: "circle",
      color: "#ffd1a0",
      borderColor: paramColor.moisture,
    },
    {
      value: "desiredMoisture",
      label: "Droogtestress in %",
      shape: "line",
      color: paramColor.desiredMoisture,
      borderColor: undefined,
    },
    {
      value: "temperature",
      label: "Temperatuur in °C",
      shape: "line",
      color: paramColor.temperature,
      borderColor: undefined,
    },
  ]

  return (
    <Paper
      elevation={5}
      className={css`
        position: relative;
        z-index: 1000;
      `}
      square
    >
      <Fab
        onClick={() => {
          navigate(`/map/${DateTime.fromJSDate(date).toISODate()}`);
          window.dispatchEvent(new Event("resize"));
        }}
        size="medium"
        className={css`
          position: absolute !important;
          right: 24px;
          top: -24px;
          background-color: #fff !important;
          color: #2f3d50 !important;
          box-shadow: 0px 3px 5px -1px #2f3d50, 0px -1px 10px 0px #2f3d50,
            0px 1px 18px 0px #2f3d50 !important;
        `}
      >
        <Close />
      </Fab>
      <div
        className={css`
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          height: 60px;
          padding: 30px 20px 0 20px;
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: row;
            color: #2f3d50;
          `}
        >
          <div className={css`
           padding-right: 20px;
          `}>
            <small
              className={css`
                white-space: nowrap;
                font-weight: lighter;
                margin-left: 50px;
              `}
            >
              {label}
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
                // shouldDisableDate={disableToday}
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
        </div>
        {currentAnalyticsData && (
          <div
            className={css`
              display: flex;
            `}
          >
            <CurrentDataItem
              label="Regenval (mm)"
              value={Math.round(currentAnalyticsData.rainfall || 0)}
              color={paramColor.rainfall}
              icon={
                <RainfallIcon
                  fill="#80A1D4"
                  className={css`
                    width: 20px;
                    height: 20px;
                  `}
                />
              }
            />
            <CurrentDataItem
              label="Verdamping (mm)"
              value={Math.round(currentAnalyticsData.evapotranspiration || 0)}
              color={paramColor.relativeHumidity}
              icon={
                <CarDefrostRear
                  fill="#6A7152"
                  className={css`
                    width: 18px !important;
                    height: 18px !important;
                    transform: rotate(180deg);
                  `}
                />
              }
            />
            <CurrentDataItem
              label="Beschikbaar bodemvocht (mm)"
              value={Math.round(currentAnalyticsData.moisture || 0)}
              color={paramColor.moisture}
              icon={
                <Vanish
                  fill="#f6511d"
                  width={20}
                  className={css`
                    width: 18px !important;
                    height: 18px !important;
                  `}
                />
              }
            />

            <CurrentDataItem
              label="Te beregenen (mm)"
              value={Math.round(currentAnalyticsData.sprinkling || 0)}
              color={paramColor.sprinkling}
              icon={
                <IrrigationIcon
                  fill="#1565c0"
                  className={css`
                    width: 20px;
                    height: 20px;
                  `}
                />
              }
            />
            <CurrentDataItem
              label="Temperatuur (°C)"
              value={Math.round(currentAnalyticsData.temperature || 0)}
              color={paramColor.temperature}
              icon={
                <Thermometer
                  fill="#383a3d"
                  viewBox="0 0 30 30"
                  className={css`
                    width: 20px;
                    height: 20px;
                  `}
                />
              }
            />
            <CurrentDataItem
              label="Luchtvochtigheid (%)"
              value={currentAnalyticsData.relativeHumidity || 0}
              color={paramColor.relativeHumidity}
              icon={
                <WaterPercent
                  fill="#5a0494"
                  viewBox="0 0 26 26"
                  className={css`
                    width: 20px;
                    height: 20px;
                  `}
                />
              }
            />
            <SelectedSumData
              circleContent={getCropTypeIcon(cropType)}
              label="Gewas"
              text={cropType}
            />
            <SelectedSumData
              circleContent={Math.round(area)}
              label="Hectare"
              text={soilType}
            />
            <PlotListDialog
              farmerData={farmerData}
              date={DateTime.fromJSDate(date).toISODate()}
              navigate={navigate}
              selectedPlotId={selectedPlotId}
              selectedPixel={selectedPixel}
            />
          </div>
        )}
      </div>
      <div
        className={css`
          background-color: #fcfcfc;
          padding-top: 10px;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            padding: 10px 20px;
          `}
        ></div>
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
          `}
        >
          <div
            className={css`
              display: flex;
            `}
          >
            {/* Select left Axes Dropdown  */}            
            <FormControl
              className={css`
                margin-left: 0 !important;
              `}
            >
              <InputLabel htmlFor="component-simple">Y-as Links</InputLabel>
              <Select
                className={css`
                  min-width: 180px;
                `}
                value={leftAxe}
                onChange={changeLeftAxe}
              >
                {axesOptions.filter((i) => rightAxe !== i.value).map((item) => 
                  <MenuItem value={item.value}><LegendItem 
                    label={item.label} 
                    shape={item.shape}
                    color={item.color} 
                    borderColor={item.borderColor}
                  /></MenuItem>
                )}
              </Select>
            </FormControl>
                        
            {/*  Select right Axes Dropdown  */}
            <FormControl
              className={css`
                margin-left: 0 !important;
                margin-right: 1rem !important;
              `}
            >
              <InputLabel htmlFor="component-simple">Y-as Rechts</InputLabel>
              <Select
                className={css`
                  min-width: 180px;
                `}
                value={rightAxe}
                onChange={changeRightAxe}
              >
                {axesOptions.filter((i) => leftAxe !== i.value).map((item) => 
                  <MenuItem value={item.value}><LegendItem 
                    label={item.label} 
                    shape={item.shape}
                    color={item.color} 
                    borderColor={item.borderColor}
                  /></MenuItem>
                )}
              </Select>
            </FormControl>
          </div>
          <div
            className={css`
              display: flex;
            `}
          >
            <FormControl
              className={css`
                margin-right: 10px !important;
              `}
              disabled={!selectedPlotId}
            >
              <InputLabel htmlFor="component-simple">
                Update gewasstatus
              </InputLabel>
              <Select
                className={css`
                  min-width: 180px;
                `}
                value={
                  cropStatus && cropStatus.value
                    ? cropStatus.value.toString()
                    : ""
                }
                onChange={changeCropStatus}
                disabled={cropTypes.every((type) => cropType !== type)}
              >
                {Object.keys(cropStatusOptions).map((key: string) =>
                  key === cropType
                    ? cropStatusOptions[key].map((object: CropStatusValue) => (
                        <MenuItem
                          key={object.value}
                          value={object.value.toString()}
                        >
                          {object.label} ({object.value})
                        </MenuItem>
                      ))
                    : null
                )}
              </Select>
            </FormControl>
            <FormControl
              className={css`
                margin-left: 30px !important;
              `}
              disabled={!selectedPlotId}
            >
              <InputLabel id="crop-status-label">
                Berekend gewasstatus
              </InputLabel>
              <Input
                id="component-simple"
                value={
                  currentAnalyticsData &&
                  developmentStateToLabel(
                    currentAnalyticsData.developmentStage,
                    cropType
                  )
                    ? `${
                        developmentStateToLabel(
                          currentAnalyticsData.developmentStage,
                          cropType
                        ).label
                      } ${currentAnalyticsData.developmentStage.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`
                    : ""
                }
                readOnly
                style={{ width: "250px"}}
              />
            </FormControl>
          </div>
        </div>
          {/* Chart */}
        <ResponsiveContainer height={200}>
          <ComposedChart
            data={analyticsData}
            margin={{ top: 20, bottom: 0, left: 0, right: 0 }}
          >
            <defs>
              <linearGradient id="moistureColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ffe0b2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="temperatureColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc9cf0" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4946e8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="desiredMoistureColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e80707" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ffb2b2" stopOpacity={0} />
              </linearGradient>
              <radialGradient
                id="radial"
                fx="50%"
                fy="50%"
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor="#1e88e5" stopOpacity="1" />
                <stop offset="100%" stopColor="#1e88e5" stopOpacity="0" />
              </radialGradient>
              <clipPath id="bar-rounded-corners">
                <rect x="0" y="0" width="100" height="100" rx="5" ry="5" />
              </clipPath>
            </defs>
            <CartesianGrid />
            <XAxis
              dataKey="date"
              xAxisId={0}
              axisLine={{ stroke: "#383a3d" }}
              tickLine={false}
              tick={{ fill: "#757575", fontSize: 10 }}
            />
            <XAxis dataKey="date" xAxisId={1} hide />
            <XAxis dataKey="date" xAxisId={2} hide />
            <YAxis
              yAxisId="left"
              padding={{ bottom: 0, top: 0 }}
              axisLine={{ stroke: paramColor[leftAxe] }}
              tickLine={false}
              tick={{ fill: paramColor[leftAxe], fontSize: 10 }}
              width={30}
              domain={[0, (()=>{
                if(leftAxe === 'relativeHumidity' || leftAxe === 'desiredMoisture'){
                  return 100;
                }
                if(leftAxe === 'rainfall'){
                  let maxValue = 0;
                  analyticsData.forEach(data => {
                    if(data.rainfall && data.rainfall > maxValue){
                      maxValue = data.rainfall
                    }
                  })
                  return maxValue < 6 ? 6 : 'auto';
                }
                return 'auto'
              })()]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={{ stroke: paramColor[rightAxe] }}
              tickLine={false}
              tick={{ fill: paramColor[rightAxe], fontSize: 10 }}
              width={30}
              domain={[0, (()=>{
                if(rightAxe === 'relativeHumidity' || rightAxe === 'desiredMoisture'){
                  return 100;
                }
                if(rightAxe === 'rainfall'){
                  let maxValue = 0;
                  analyticsData.forEach(data => {
                    if(data.rainfall && data.rainfall > maxValue){
                      maxValue = data.rainfall
                    }
                  })
                  return maxValue < 6 ? 6 : 'auto';
                }
                return 'auto'
              })()]}
            />
            {displayMoisture ? (
              <Area
                dataKey="moisture"
                xAxisId={leftAxe === "moisture" ? 0 : 2}
                yAxisId={leftAxe === "moisture" ? "left" : "right"}
                stroke="#f6511d"
                fill="url(#moistureColor)"
              />
            ) : null}
            {displayDesiredMoisture ? (
              <Line
                dataKey="desiredMoisture"
                xAxisId={leftAxe === "desiredMoisture" ? 0 : 2}
                yAxisId={leftAxe === "desiredMoisture" ? "left" : "right"}
                stroke="#c12d00"
                fill="url(#desiredMoistureColor)"
              />
            ) : null}
            {displayTemperature ? (
              <Line
                dataKey="temperature"
                xAxisId={leftAxe === "temperature" ? 0 : 2}
                yAxisId={leftAxe === "temperature" ? "left" : "right"}
                stroke="#383a3d"
                fill="url(#temperatureColor)"
              />
            ) : null}
            {displayRainfall ? (
              <Bar
                dataKey="rainfall"
                xAxisId={leftAxe === "rainfall" ? 0 : 2}
                yAxisId={leftAxe === "rainfall" ? "left" : "right"}
                barSize={60}
                shape={({ x, y, width, height }: RectangleProps) =>
                  height! < 10 ? null : (
                    <path
                      {...{ x, y, width, height }}
                      fill="#64b5f6"
                      opacity={0.8}
                      d={`m${x},${y! + height!} v-${
                        height! - 10
                      } a10,10 270 0 1 10 -10 h${
                        width! - 20
                      } a10,10 0 0 1 10 10 v${height! - 10} z`}
                    />
                  )
                }
              />
            ) : null}
            {displayHumidity ? (
              <Bar
                dataKey="relativeHumidity"
                xAxisId={leftAxe === "relativeHumidity" ? 0 : 2}
                yAxisId={leftAxe === "relativeHumidity" ? "left" : "right"}
                barSize={60}
                shape={({ x, y, width, height }: RectangleProps) =>
                  height! < 10 ? null : (
                    <path
                      {...{ x, y, width, height }}
                      fill="#5a0494"
                      opacity={0.4}
                      d={`m${x},${y! + height!} v-${
                        height! - 10
                      } a10,10 270 0 1 10 -10 h${
                        width! - 20
                      } a10,10 0 0 1 10 10 v${height! - 10} z`}
                    />
                  )
                }
              />
            ) : null}
            {displaySprinkling ? (
              <Bar
                dataKey="sprinkling"
                isAnimationActive={false}
                xAxisId={1}
                yAxisId={leftAxe === "sprinkling" ? "left" : "right"}
                fill="#1565c0"
                opacity={0.8}
                barSize={40}
                label={({
                  value,
                  x,
                  y,
                  width,
                  index,
                }: LabelProps & { index: number }) => (
                  <g
                    className={css`cursor: pointer;`}
                    onClick={async () => {
                      await updateSprinklingDialog.open(
                        value as number,
                        analyticsData ? analyticsData[index] : ""
                      );
                    }}
                  >
                    <circle
                      cx={x! + width! / 2}
                      cy={value ? y! : '140px'}
                      r={width! / 2 + 8}
                      fill="url(#radial)"
                    />
                    <circle
                      cx={x! + width! / 2}
                      cy={value ? y! : '140px'}
                      r={width! / 2 + 3}
                      fill="#ffffff"
                      stroke="#64b5f6"
                    />
                    <circle
                      cx={x! + width! / 2}
                      cy={value ? y! : '140px'}
                      r={width! / 2}
                      fill="#ffffff"
                      stroke="#1565c0"
                      strokeWidth={2}
                    />
                    <text
                      x={x! + width! / 2}
                      y={value ? y! : '140px'}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#1565c0"
                      fontSize={10}
                    >
                      {value ? `${value} mm` : `...`}
                    </text>
                  </g>
                )}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <UpdateSprinklingDialog
        selectedPlotId={selectedPlotId}
        farmerData={farmerData}
        ref={(d) => (updateSprinklingDialog = d!)}
      />
    </Paper>
  );
};

export default Analytics;