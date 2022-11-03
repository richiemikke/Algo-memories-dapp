import React from "react";
import { ToastContainer } from "react-toastify";

const Notification = () => (
  <ToastContainer
    position="bottom-center"
    autoClose={3000}
    hideProgressBar
    newestOnTop
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable={false}
    pauseOnHover
  />
);

export { Notification };
