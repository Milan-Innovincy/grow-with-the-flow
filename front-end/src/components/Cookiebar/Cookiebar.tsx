import React from "react";
import "./cookiebar.scss";
import EventEmitter from "../../lib/EventEmitter";

import CookieStatement from "../CookieStatement";
import { css } from "@emotion/css";

type State = {
  showCookiebar: boolean;
};

export default class Cookiebar extends React.Component<{}, State> {
  state: State = {
    showCookiebar: false,
  };

  componentDidMount() {
    // Due to the way the app is built (loads of rerenders in the loading phase) this is unfortunaly a necessary evil.
    setTimeout(() => {
      if (this.getCookie("cookieBarDismissed") !== "true") {
        this.setState({ showCookiebar: true });
      }
    }, 2000);
  }

  handleClose = () => {
    this.setCookie("cookieBarDismissed", true, 30);
    this.setState({ showCookiebar: false });
  };

  setCookie(
    cookieName: string,
    cookieValue: string | boolean,
    amountOfDays: number
  ) {
    const d = new Date();
    d.setTime(d.getTime() + amountOfDays * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie =
      cookieName + "=" + cookieValue + ";" + expires + ";path=/";
  }

  getCookie = (ookieName: string) => {
    const cookieName = ookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];

      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1);
      }

      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }

    return "";
  };

  openTextPopup = () => {
    EventEmitter.emit("open-text-popup", <CookieStatement />);
  };

  render() {
    const { showCookiebar } = this.state;

    if (showCookiebar === true) {
      return (
        <div className="cookie-bar">
          <span className="message">
            Deze site gebruikt cookies om u een betere ervaring te leveren. Door
            deze website te gebruiken gaat u akkoord met de
            <button
              className={css`
                background: none;
                border: none;
                color: #5cf2ff;
                font-size: 14px;
              `}
              onClick={this.openTextPopup}
            >
              voorwaarden
            </button>
          </span>
          <span className="mobile">
            This website uses cookies,{" "}
            <div onClick={this.openTextPopup}>learn more</div>
          </span>
          <label className="close-cb" onClick={this.handleClose}>
            x
          </label>
        </div>
      );
    }

    return null;
  }
}
