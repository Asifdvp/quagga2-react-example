import { useCallback, useLayoutEffect } from "react";
import PropTypes from "prop-types";
import Quagga from "@ericblade/quagga2";

function getMedian(arr) {
  const newArr = [...arr]; // copy the array before sorting, otherwise it mutates the array passed in, which is generally undesireable
  newArr.sort((a, b) => a - b);
  const half = Math.floor(newArr.length / 2);
  if (newArr.length % 2 === 1) {
    return newArr[half];
  }
  return (newArr[half - 1] + newArr[half]) / 2;
}

function getMedianOfCodeErrors(decodedCodes) {
  const errors = decodedCodes.flatMap((x) => x.error);
  const medianOfErrors = getMedian(errors);
  return medianOfErrors;
}

const defaultConstraints = {
  width: "100%",
  height: "100%",
};

const defaultLocatorSettings = {
  patchSize: "medium",
  halfSample: true,
  willReadFrequently: true,
};

const defaultDecoders = ["code_128_reader"];

const ScannerRoot = ({
  onDetected,
  scannerRef,
  onScannerReady,
  cameraId = null,
  facingMode,
  constraints = defaultConstraints,
  locator = defaultLocatorSettings,
  decoders = defaultDecoders,
  locate = true,
}) => {
  const errorCheck = useCallback(
    (result) => {
      let hasScanned = false;
      if (!onDetected) {
        return;
      }
      if (!hasScanned) {
        const err = getMedianOfCodeErrors(result.codeResult.decodedCodes);
        // if Quagga is at least 75% certain that it read correctly, then accept the code.
        if (err < 0.25) {
          hasScanned = true;
          onDetected(result.codeResult.code);
          Quagga.offDetected(errorCheck);
        }
      }
      return () => {
        hasScanned = false;
      };
    },

    [onDetected]
  );

  useLayoutEffect(() => {
    let ignoreStart = false;
    const init = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (ignoreStart) {
        return;
      }
      // begin scanner initialization
      await Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            constraints: {
              ...constraints,
              ...(cameraId && { deviceId: cameraId }),
              ...(!cameraId && { facingMode }),
            },
            target: scannerRef.current,
            willReadFrequently: true,
          },
          locator,
          decoder: { readers: decoders },
          locate,
        },

        async (err) => {
          if (err) {
            return console.error("Error starting Quagga:", err);
          }
          if (scannerRef && scannerRef.current) {
            await Quagga.start();
            if (onScannerReady) {
              onScannerReady();
            }
          }
        }
      );

      Quagga.onDetected(errorCheck);
    };
    init();
    // cleanup by turning off the camera and any listeners
    return () => {
      ignoreStart = true;
      Quagga.stop();
      Quagga.offDetected(errorCheck);
    };
  }, [
    cameraId,
    onDetected,
    onScannerReady,
    scannerRef,
    errorCheck,
    constraints,
    locator,
    decoders,
    locate,
    facingMode,
  ]);
  return null;
};

ScannerRoot.propTypes = {
  onDetected: PropTypes.func.isRequired,
  scannerRef: PropTypes.object.isRequired,
  onScannerReady: PropTypes.func,
  cameraId: PropTypes.string,
  facingMode: PropTypes.string,
  constraints: PropTypes.object,
  locator: PropTypes.object,
  decoders: PropTypes.array,
  locate: PropTypes.bool,
};

export default ScannerRoot;
