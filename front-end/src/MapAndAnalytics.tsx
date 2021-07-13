import React, { useState, useEffect, useContext } from "react";
import { RouteComponentProps, Redirect } from "react-router-dom";
import axios from "axios";
import { css } from "@emotion/css";
import { Paper, CircularProgress } from "@material-ui/core";
import { DateTime, Duration } from "luxon";
import EventEmitter from "./lib/EventEmitter";

import MapView from "./MapView";
import Analytics from "./Analytics";
import OverallSummary from "./OverallSummary";
import LoadingError from "./components/LoadingError";
import { ApplicationContext } from "./ApplicationContext";

import axiosInstance from "./lib/axios";

type Props = RouteComponentProps<{
  date?: string;
  selectionType?: "plot" | "pixel";
  selectionId?: string;
}>;

export type FarmerData = {
  pixelsData: {
    analytics: {
      availableSoilWater: number[][];
      deficit: number[][];
      developmentStage: number[][];
      evapotranspiration: number[][];
      isForecast: boolean;
      measuredPrecipitation: number[][];
      relativeTranspiration: number[][];
      time: string;
    }[];
    boundingBox: number[];
    dimensions: number[];
    landUse: string[][];
    soilMap: string[][];
  };
  plotCropStatus: {
    plotId: string;
    statuses: {
      "crop-status": string;
      date: string;
    }[];
  }[];
  plotFeedback: {
    plotId: string;
    quantities: {
      date: string;
      quantityMM: number;
    }[];
  }[];
  plotsAnalytics: {
    [key: string]: {
      availableSoilWater: number;
      date: string;
      deficit: number;
      developmentStage: number;
      evapotranspiration: number;
      isForecast: boolean;
      measuredPrecipitation: number;
      relativeTranspiration: number;
    }[];
  };
  plotsGeoJSON: {
    features: {
      geometry: {
        coordinates: number[][];
        type: string;
      };
      properties: {
        cropTypes: string;
        farmerId: string;
        farmerName: string;
        featureType: string;
        name: string;
        plotId: string;
        plotSizeHa: number;
        soilType: string;
      };
      type: string;
    }[];
  };
};
export type FarmerGeoData = {
  plotsGeoJSON: {
    features: {
      geometry: {
        coordinates: number[][];
        type: string;
      };
      properties: {
        cropTypes: string;
        farmerId: string;
        farmerName: string;
        featureType: string;
        name: string;
        plotId: string;
        plotSizeHa: number;
        soilType: string;
      };
      type: string;
    }[];
  };
};

const MapAndAnalytics = ({ match, history }: Props) => {
  const [farmerData, setFarmerData] = useState<FarmerData>(null);
  const [farmerGeoData, setFarmerGeoData] = useState<FarmerGeoData>(null);
  const contextValue = useContext(ApplicationContext);
  const [isFetchingFarmerData, setIsFetchingFarmerData] = useState(false);

  const { date, selectionType, selectionId } = match.params;
  const latestAvailableDate = DateTime.fromJSDate(new Date())
    .minus(Duration.fromObject({ days: 1 }))
    .toFormat("yyyy-MM-dd");

  useEffect(() => {
    EventEmitter.on(
      "sprinkling-updated-success",
      updateFarmerDataOnSprinklingUpdate
    );
    return () =>
      EventEmitter.removeListener(
        "sprinkling-updated-success",
        updateFarmerDataOnSprinklingUpdate
      );
  }, [farmerData]);

  const updateFarmerDataOnSprinklingUpdate = async () => {
    await updatePlotFeedback();
  };

  useEffect(() => {
    setIsFetchingFarmerData(true);
    (async () => {
      const isAuthenticated =
        contextValue.keycloak && contextValue.keycloak.token;

      if (isAuthenticated) {
        const handleError = () => {
          setIsFetchingFarmerData(false);
          EventEmitter.emit(
            "open-text-popup",
            <LoadingError date={new Date(date ? date : "")} />
          );
          window.stop();
        };
        const prefix =
          "https://storage.googleapis.com/grow-with-the-flow.appspot.com";
        const plotsGeoJSON = await axiosInstance
          .get(`/plots`)
          .then(({ data }) => {
            return data;
          })
          .catch((error: Error) => {
            console.error(error.message);
            handleError();
          });

        if (plotsGeoJSON) {
          plotsGeoJSON.features = plotsGeoJSON.features.filter(
            (feature: any) => feature.properties.plotId
          );
          const farmerGeoData = {
            plotsGeoJSON,
          };
          setFarmerGeoData(farmerGeoData);
        }

        const landUse = await axios
          .get(`${prefix}/gwtf-land-use.json`)
          .then(({ data }) => {
            return data;
          })
          .catch((error: Error) => {
            console.error(error.message);
            handleError();
          });
        const soilMap = await axios
          .get(`${prefix}/gwtf-soil-map.json`)
          .then(({ data }) => {
            return data;
          })
          .catch((error: Error) => {
            console.error(error.message);
            handleError();
          });
        const pixelsData = await axiosInstance
          .get(
            `/pixels?on=${date}&attributes=deficit,measuredPrecipitation,evapotranspiration,availableSoilWater,relativeTranspiration,developmentStage,trafficability,humidity,averageTemperature`
          )
          .then(({ data }) => {
            return data;
          })
          .catch((error: Error) => {
            console.error(error.message);
            handleError();
          });
        const plotsAnalytics = await axiosInstance
          .get(
            `/plot-analytics?on=${date}&attributes=deficit,measuredPrecipitation,evapotranspiration,availableSoilWater,relativeTranspiration,developmentStage,trafficability,humidity,averageTemperature`
          )
          .then(({ data }) => {
            return data;
          })
          .catch((error: Error) => {
            console.error(error.message);
            handleError();
          });

        if (
          landUse &&
          soilMap &&
          pixelsData &&
          plotsGeoJSON &&
          plotsAnalytics
        ) {
          pixelsData.landUse = landUse;
          pixelsData.soilMap = soilMap;

          plotsGeoJSON.features = plotsGeoJSON.features.filter(
            (feature: any) => feature.properties.plotId
          );

          const farmerData = {
            pixelsData,
            plotsGeoJSON,
            plotsAnalytics,
            plotFeedback: [],
            plotCropStatus: [],
          };

          EventEmitter.on("sprinkling-update", handleSprinklingUpdate);

          getPlotFeedback(farmerData);
        }
      }
    })();
  }, [contextValue.authenticated, contextValue.keycloak, date]);

  const handleSprinklingUpdate = (payload: any) => {
    const { date, selectedPlotId, value } = payload;

    const formattedDate = DateTime.fromJSDate(new Date(date)).toFormat(
      "yyyy-MM-dd"
    );

    axiosInstance
      .put(
        `/plot-feedback/irrigation?plotId=${selectedPlotId}&date=${formattedDate}&irrigationMM=${value}`
      )
      .then(({ data }) => {
        EventEmitter.emit("sprinkling-updated-success");
      })
      .catch((error: Error) => {
        EventEmitter.emit("sprinkling-updated-failure");
        console.error(error);
      });
  };

  const getPlotFeedback = async (farmerData: any) => {
    const { plotsAnalytics } = farmerData;
    const datesInTimeRange = plotsAnalytics[Object.keys(plotsAnalytics)[0]].map(
      (a: any) => a.date
    );
    const sortedDates = datesInTimeRange.sort(
      (dateA: string, dateB: string) => {
        return Date.parse(dateA) > Date.parse(dateB);
      }
    );
    const dateFrom = sortedDates[0];
    const dateTo = sortedDates[sortedDates.length - 1];

    const promises = [
      axiosInstance.get(
        `/plot-feedback/crop-status?from=${dateFrom}&to=${dateTo}`
      ),
      axiosInstance.get(
        `/plot-feedback/irrigation?from=${dateFrom}&to=${dateTo}`
      ),
    ];

    const results = await Promise.all(promises).catch((error: Error) => {
      // TODO: Properly handle error
      throw new Error(error.message);
    });

    const data = results.map((res) => res.data);
    setFarmerData({
      ...farmerData,
      plotCropStatus: data[0],
      plotFeedback: data[1],
    });
    EventEmitter.emit("plotfeedback-updated");
    setIsFetchingFarmerData(false);
  };

  const updatePlotFeedback = async () => {
    const { plotsAnalytics } = farmerData;
    const datesInTimeRange = plotsAnalytics[Object.keys(plotsAnalytics)[0]].map(
      (a: any) => a.date
    );
    const sortedDates = datesInTimeRange.sort(
      (dateA: string, dateB: string) => {
        return Date.parse(dateA) > Date.parse(dateB);
      }
    );
    const dateFrom = sortedDates[0];
    const dateTo = sortedDates[sortedDates.length - 1];

    const promises = [
      axiosInstance.get(
        `/plot-feedback/crop-status?from=${dateFrom}&to=${dateTo}`
      ),
      axiosInstance.get(
        `/plot-feedback/irrigation?from=${dateFrom}&to=${dateTo}`
      ),
    ];

    const results = await Promise.all(promises).catch((error: Error) => {
      // TODO: Properly handle error
      throw new Error(error.message);
    });

    const data = results.map((res) => res.data);
    setFarmerData({
      ...farmerData,
      plotCropStatus: data[0],
      plotFeedback: data[1],
    });
    EventEmitter.emit("plotfeedback-updated");
    setIsFetchingFarmerData(false);
  };

  if (!date) {
    return <Redirect to={`/map/${latestAvailableDate}`} />;
  }

  if (!farmerGeoData) {
    return (
      <div
        className={css`
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <CircularProgress />
      </div>
    );
  }

  let selectedPlotId: string | undefined = undefined;
  let selectedPixel: Array<number> | undefined = undefined;

  if (selectionId) {
    switch (selectionType) {
      case "plot":
        selectedPlotId = selectionId;
        break;
      case "pixel":
        selectedPixel = selectionId.split("-").map((n) => parseInt(n, 10));
        break;
      default:
        return <Redirect to={`/map/${date}`} />;
    }
  }

  const navigate = (path: string) => history.push(path);

  return (
    <div
      className={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          position: relative;
          flex: 1;
        `}
      >
        {farmerData && (
          <MapView
            navigate={navigate}
            farmerData={farmerData}
            farmerGeoData={farmerGeoData}
            date={date}
            selectedPlotId={selectedPlotId}
            selectedPixel={selectedPixel}
          />
        )}
      </div>
      {farmerData && !isFetchingFarmerData ? (
        <Paper
          elevation={5}
          className={css`
            position: relative;
            z-index: 1000;
          `}
          square
        >
          {selectedPlotId || selectedPixel ? (
            <Analytics
              date={new Date(date)}
              farmerData={farmerData}
              navigate={navigate}
              selectedPixel={selectedPixel}
              selectedPlotId={selectedPlotId}
            />
          ) : (
            <OverallSummary
              date={new Date(date)}
              farmerData={farmerData}
              navigate={navigate}
            />
          )}
        </Paper>
      ) : (
        <div
          className={css`
            padding: 24px 0;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          <CircularProgress />
        </div>
      )}
    </div>
  );
};

export default MapAndAnalytics;
