import React, { useState, useEffect, useContext } from "react";
import { RouteComponentProps, Redirect } from "react-router-dom";
import axios from "axios";
import { css } from "@emotion/css";
import { Paper, CircularProgress, Grid } from "@material-ui/core";
import { DateTime, Duration } from "luxon";
import EventEmitter from "./lib/EventEmitter";

import MapView from "./MapView";
import Analytics from "./Analytics";
import OverallSummary from "./OverallSummary";
import LoadingError from "./components/LoadingError";
import { ApplicationContext } from "./ApplicationContext";
import _ from "lodash";
import axiosInstance from "./lib/axios";
import PlotList from "./components/PlotList/PlotList";

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
      updatedAt: string;
    }[];
  }[];
  plotFeedback: {
    plotId: string;
    quantities: {
      date: string;
      quantityMM: number;
      updatedAt: string;
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
  const [farmerData, setFarmerData] = useState<FarmerData | undefined>(
    undefined
  );
  const [farmerGeoData, setFarmerGeoData] = useState<FarmerGeoData | undefined>(
    undefined
  );
  const contextValue = useContext(ApplicationContext);
  const [isFetchingFarmerData, setIsFetchingFarmerData] = useState(false);
  const [isTableTruncated, setIsTableTruncated] = useState(true);

  const { date, selectionType, selectionId } = match.params;
  const latestAvailableDate = DateTime.fromJSDate(new Date())
    .minus(Duration.fromObject({ days: 1 }))
    .toFormat("yyyy-MM-dd");

  useEffect(() => {
    EventEmitter.on(
      "sprinkling-updated-success",
      updateFarmerDataOnSprinklingUpdate
    );
    EventEmitter.on("plot-details-updated-success", updatePlotDetails);
    return () => {
      EventEmitter.removeListener(
        "sprinkling-updated-success",
        updateFarmerDataOnSprinklingUpdate
      );
      EventEmitter.removeListener(
        "plot-details-updated-success",
        updatePlotDetails
      );
    };
  }, [farmerData]);

  const updateFarmerDataOnSprinklingUpdate = async () => {
    await updatePlotFeedback();
  };

  const handleError = () => {
    setIsFetchingFarmerData(false);
    EventEmitter.emit(
      "open-text-popup",
      <LoadingError date={new Date(date ? date : "")} />
    );
    window.stop();
  };

  const fetchPixelsData = async () => {
    const prefix =
      "https://storage.googleapis.com/grow-with-the-flow.appspot.com";

    const landUse = await axios
      .get(`${prefix}/gwtf-land-use.json`)
      .then(({ data }) => {
        if (data === {}) {
          handleError();
        }
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
        `/pixels?on=${date}&attributes=deficit,measuredPrecipitation,evapotranspiration,availableSoilWater,relativeTranspiration,developmentStage,trafficability,relativeHumidity,averageTemperature`
      )
      .then(({ data }) => {
        if (_.isEmpty(data)) {
          handleError();
        } else return data;
      })
      .catch((error: Error) => {
        console.error(error.message);
        handleError();
      });

    if (landUse && soilMap && pixelsData) {
      pixelsData.landUse = landUse;
      pixelsData.soilMap = soilMap;
    }

    return pixelsData;
  };

  const initPixelsData = async () => {
    setIsFetchingFarmerData(true);
    let pixelsData = await fetchPixelsData();
    setFarmerData({ ...farmerData!, pixelsData });
    EventEmitter.emit("farmer-data-updated");
    setIsFetchingFarmerData(false);
  };

  useEffect(() => {
    setIsFetchingFarmerData(true);
    (async () => {
      const isAuthenticated =
        contextValue.keycloak && contextValue.keycloak.token;

      if (isAuthenticated) {
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

        const pixelsData =
          selectionType === "pixel" ? await fetchPixelsData() : undefined;

        let plotsAnalytics = undefined;

        if (date) {
          var dateInPast = new Date(date)
          var dateInFuture = new Date(date)
          dateInPast.setDate(dateInPast.getDate() - 21);
          dateInFuture.setDate(dateInFuture.getDate() + 8);
          const formattedPastDate = DateTime.fromJSDate(dateInPast).toFormat(
            "yyyy-MM-dd"
          );
          const formattedFutureDate = DateTime.fromJSDate(dateInFuture).toFormat(
            "yyyy-MM-dd"
          );
          plotsAnalytics = await axiosInstance
          .get(
            `/plot-analytics?from=${formattedPastDate}&to=${formattedFutureDate}&attributes=deficit,measuredPrecipitation,evapotranspiration,availableSoilWater,relativeTranspiration,developmentStage,trafficability,relativeHumidity,averageTemperature`
          )
          .then(({ data }) => {
            if (_.isEmpty(data)) {
              handleError();
            } else return data;
          })
          .catch((error: Error) => {
            console.error(error.message);
            handleError();
          });
        } else {
          handleError();
        }
        
        if (plotsGeoJSON && plotsAnalytics) {
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
          EventEmitter.on("plot-name-update", handleNameUpdate);
          EventEmitter.on("plot-description-update", handleDescriptionUpdate);

          getPlotFeedback(farmerData);
        }
      }
    })();
  }, [contextValue.authenticated, contextValue.keycloak, date]);

  const handleNameUpdate = (payload: any) => {
    const { selectedPlotId, value } = payload;

    axiosInstance
      .put(`/plots/id/${selectedPlotId}`, {
        name: value,
      })
      .then(({ data }) => {
        EventEmitter.emit("plot-name-updated-success");
        //Update data to reflect change
        EventEmitter.emit("plot-details-updated-success");
      })
      .catch((error: Error) => {
        EventEmitter.emit("plot-name-updated-failure");
        console.error(error);
      });
  };

  const handleDescriptionUpdate = (payload: any) => {
    const { selectedPlotId, value } = payload;

    axiosInstance
      .put(`/plots/id/${selectedPlotId}`, {
        description: value,
      })
      .then(({ data }) => {
        EventEmitter.emit("plot-description-updated-success");
        //Update data to reflect change
        EventEmitter.emit("plot-details-updated-success");
      })
      .catch((error: Error) => {
        EventEmitter.emit("plot-description-updated-failure");
        console.error(error);
      });
  };

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
        `/plot-feedback/crop-status?from=${dateFrom}&to=${dateTo}&withLastUpdateBeforeStartOfRange=true`
      ),
      axiosInstance.get(
        `/plot-feedback/irrigation?from=${dateFrom}&to=${dateTo}&withLastUpdateBeforeStartOfRange=true`
      ),
    ];

    const results = await Promise.all(promises).catch((error: Error) => {
      // TODO: Properly handle error
      handleError();
      throw new Error(error.message);
    });

    const data = results.map((res) => res.data);
    setFarmerData({
      ...farmerData,
      plotCropStatus: data[0],
      plotFeedback: data[1],
    });
    EventEmitter.emit("farmer-data-updated");
    setIsFetchingFarmerData(false);
  };

  const updatePlotDetails = async () => {
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

      setFarmerData({
        ...farmerData!,
        plotsGeoJSON,
      });
    }
  };

  const updatePlotFeedback = async () => {
    const { plotsAnalytics } = farmerData!;
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
        `/plot-feedback/crop-status?from=${dateFrom}&to=${dateTo}&withLastUpdateBeforeStartOfRange=true`
      ),
      axiosInstance.get(
        `/plot-feedback/irrigation?from=${dateFrom}&to=${dateTo}&withLastUpdateBeforeStartOfRange=true`
      ),
    ];

    const results = await Promise.all(promises).catch((error: Error) => {
      // TODO: Properly handle error
      handleError();
      throw new Error(error.message);
    });

    const data = results.map((res) => res.data);
    setFarmerData({
      ...farmerData!,
      plotCropStatus: data[0],
      plotFeedback: data[1],
    });
    EventEmitter.emit("farmer-data-updated");
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
        display: flex;
        flex-direction: column;
        position: relative;
        height: 100%;
      `}
    >
      {farmerData && (
        <Grid
          container
          direction="row"
          className={css`
            height: 100%;
          `}
        >
          {isTableTruncated && (
            <Grid item xs={7}>
              <MapView
                navigate={navigate}
                farmerData={farmerData}
                getPixelsData={initPixelsData}
                farmerGeoData={farmerGeoData}
                date={date}
                selectedPlotId={selectedPlotId}
                selectedPixel={selectedPixel}
              />
            </Grid>
          )}

          <Grid item xs={isTableTruncated ? 5 : 12}>
            <div
              className={css`
                height: 100%;
              `}
            >
              <PlotList
                farmerData={farmerData}
                date={date}
                navigate={navigate}
                selectedPlotId={selectedPlotId}
                selectedPixel={selectedPixel}
                isFetchingData={isFetchingFarmerData}
                truncated={isTableTruncated}
                setTruncated={setIsTableTruncated}
              />
            </div>
          </Grid>
        </Grid>
      )}

      {farmerData && (
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
              isFetchingData={isFetchingFarmerData}
            />
          ) : (
            <OverallSummary
              date={new Date(date)}
              farmerData={farmerData}
              navigate={navigate}
              isFetchingData={isFetchingFarmerData}
            />
          )}
        </Paper>
      )}
      {isFetchingFarmerData && (
        <div
          className={css`
            position: absolute;
            top: 0;
            left: 0;
            background: #ffffff99;
            z-index: 9000;
            height: 100%;
            width: 100%;
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
