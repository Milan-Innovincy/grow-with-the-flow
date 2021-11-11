import _ from "lodash";

import axiosInstance from "../../lib/axios";
import EventEmitter from "../../lib/EventEmitter";

const handleErrorMessage = () => {
  EventEmitter.emit("show-snackbar", {
    snackbarMessage: "Oeps! Er is iets fout gegaan.",
  });
};

export const getLimitLevel = async (
  plotId: string
): Promise<number | undefined> => {
  try {
    const result = await axiosInstance.get(
      `/plot-feedback/water-limit-level/${plotId}`
    );
    if (!_.isEmpty(result.data)) {
      return result.data["water-limit-level"];
    } else {
      return undefined;
    }
  } catch (error) {
    handleErrorMessage();
    console.error(error);
  }
};

export const setLimitLevel = async (plotId: string, limitLevel: number): Promise<number | undefined>  => {
  try {
    await axiosInstance.put(
      `/plot-feedback/water-limit-level/${plotId}?limit=${limitLevel}`
    );
    return limitLevel
  } catch (error) {
    handleErrorMessage();
    console.error(error);
  }
};

export const deleteLimitLevel = async (plotId: string) => {
  try {
    await axiosInstance.delete(`/plot-feedback/water-limit-level/${plotId}`);
  } catch (error) {
    handleErrorMessage();
    console.error(error);
  }
};

export const setCropStatus = async (plotId: string, date: string, cropStatus: string) => {
  try {
    await axiosInstance.put(
      `/plot-feedback/crop-status?plotId=${plotId}&date=${date}&crop-status=${cropStatus}`
    )
  } catch (error) {
    handleErrorMessage();
    console.error(error);
  }
}
