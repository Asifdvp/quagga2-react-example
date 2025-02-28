import React, { useState, useRef, useEffect, useCallback } from "react";
import Quagga from "@ericblade/quagga2";
import Scanner from "./Scanner";
import "./style.css";
import Webcam from "react-webcam";

const App = () => {
  const [scanning, setScanning] = useState(false); // toggleable state for "should render scanner"
  const [cameras, setCameras] = useState([]); // array of available cameras, as returned by Quagga.CameraAccess.enumerateVideoDevices()
  const [cameraId, setCameraId] = useState(null); // id of the active camera device
  const [cameraError, setCameraError] = useState(null); // error message from failing to access the camera
  const [results, setResults] = useState([]); // list of scanned results
  const [torchOn, setTorch] = useState(false); // toggleable state for "should torch be on"
  const scannerRef = useRef(null); // reference to the scanner element in the DOM

  // at start, we need to get a list of the available cameras.  We can do that with Quagga.CameraAccess.enumerateVideoDevices.
  // HOWEVER, Android will not allow enumeration to occur unless the user has granted camera permissions to the app/page.
  // AS WELL, Android will not ask for permission until you actually try to USE the camera, just enumerating the devices is not enough to trigger the permission prompt.
  // THEREFORE, if we're going to be running in Android, we need to first call Quagga.CameraAccess.request() to trigger the permission prompt.
  // AND THEN, we need to call Quagga.CameraAccess.release() to release the camera so that it can be used by the scanner.
  // AND FINALLY, we can call Quagga.CameraAccess.enumerateVideoDevices() to get the list of cameras.

  // Normally, I would place this in an application level "initialization" event, but for this demo, I'm just going to put it in a useEffect() hook in the App component.

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
  const onTorchClick = useCallback(() => {
    const torch = !torchOn;
    setTorch(torch);
    if (torch) {
      Quagga.CameraAccess.enableTorch();
    } else {
      Quagga.CameraAccess.disableTorch();
    }
  }, [torchOn, setTorch]);
  const screenWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
  const screenHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  const deviceId = cameras.find(
    (item) => item.label === "camera2 2, facing back"
  );
  const webcamRef = useRef(null);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        // Kamera akışını webcam bileşenine bağla
        webcamRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Kamera erişimi hatası:", error);
      });
  };
  return (
    <div>
      <center>
        <button onClick={startCamera}>Kamerayı Aç</button>
        <Webcam ref={webcamRef} />
      </center>
    </div>
    // <div>
    //   {cameraError ? (
    //     <p>
    //       ERROR INITIALIZING CAMERA ${JSON.stringify(cameraError)} -- DO YOU
    //       HAVE PERMISSION?
    //     </p>
    //   ) : null}
    //   {cameras.length === 0 ? (
    //     <p>
    //       Enumerating Cameras, browser may be prompting for permissions
    //       beforehand
    //     </p>
    //   ) : (
    //     <form>
    //       <select onChange={(event) => setCameraId(event.target.value)}>
    //         {cameras.map((camera) => (
    //           <option key={camera.deviceId} value={camera.deviceId}>
    //             {camera.label || camera.deviceId}
    //           </option>
    //         ))}
    //       </select>
    //     </form>
    //   )}
    //   <button onClick={() => setScanning(!scanning)}>
    //     {scanning ? "Stop" : "Start"}
    //   </button>

    //   <div ref={scannerRef} className="asif">
    //     {/* <video style={{ width: window.innerWidth, height: 480, border: '3px solid orange' }}/> */}
    //     <canvas
    //       className="drawingBuffer"
    //       style={{
    //         // position: "absolute",
    //         // top: "0px",
    //         // left: '0px',
    //         // height: '100%',
    //         // width: '100%',
    //         border: "3px solid green",
    //       }}
    //       width={screenWidth}
    //       height={screenHeight}
    //     />
    //     {5 ? (
    //       <Scanner
    //         scannerRef={scannerRef}
    //         cameraId={cameraId || null}
    //         onDetected={(result) => setResults([...results, result])}
    //       />
    //     ) : null}
    //   </div>
    // </div>
  );
};

export default App;
