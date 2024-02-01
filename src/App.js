import React, { useState, useRef, useEffect, useCallback } from "react";
import Quagga from "@ericblade/quagga2";
import Scanner from "./Scanner";
import "./style.css";
const App = () => {
  const [scanning, setScanning] = useState(false); // toggleable state for "should render scanner"
  const [cameras, setCameras] = useState([]); // array of available cameras, as returned by Quagga.CameraAccess.enumerateVideoDevices()
  const [cameraId, setCameraId] = useState(null); // id of the active camera device
  const [cameraError, setCameraError] = useState(null); // error message from failing to access the camera
  const [results, setResults] = useState([]); // list of scanned results
  const scannerRef = useRef(null); // reference to the scanner element in the DOM

  useEffect(() => {
    const enableCamera = async () => {
      await Quagga.CameraAccess.request(null, {});
    };
    const disableCamera = async () => {
      await Quagga.CameraAccess.release();
    };
    const enumerateCameras = async () => {
      const cameras = await Quagga.CameraAccess.enumerateVideoDevices();
      console.log("Cameras Detected: ", cameras);
      return cameras;
    };
    enableCamera()
      .then(disableCamera)
      .then(enumerateCameras)
      .then((cameras) => setCameras(cameras))
      .then(() => Quagga.CameraAccess.disableTorch()) // disable torch at start, in case it was enabled before and we hot-reloaded
      .catch((err) => setCameraError(err));
    return () => disableCamera();
  }, []);

  // provide a function to toggle the torch/flashlight
  console.log(cameraId);
  return (
    <div>
      {cameraError ? (
        <p>
          ERROR INITIALIZING CAMERA ${JSON.stringify(cameraError)} -- DO YOU
          HAVE PERMISSION?
        </p>
      ) : null}
      {cameras.length === 0 ? (
        <p>
          Enumerating Cameras, browser may be prompting for permissions
          beforehand
        </p>
      ) : (
        <form>
          <select onChange={(event) => setCameraId(event.target.value)}>
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || camera.deviceId}
              </option>
            ))}
          </select>
        </form>
      )}
      <button onClick={() => setScanning(!scanning)}>
        {scanning ? "Stop" : "Start"}
      </button>

      <div
        ref={scannerRef}
        style={{ position: "relative", border: "3px solid red" }}
      >
        {/* <video style={{ width: window.innerWidth, height: 480, border: '3px solid orange' }}/> */}
        <canvas
          className="drawingBuffer"
          style={{
            position: "absolute",
            top: "0px",
            // left: '0px',
            // height: '100%',
            // width: '100%',
            border: "3px solid green",
          }}
          width="640"
          height="480"
        />
        {scanning ? (
          <Scanner
            scannerRef={scannerRef}
            cameraId={cameraId}
            onDetected={(result) => setResults([...results, result])}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
