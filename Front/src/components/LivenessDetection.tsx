import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useSpeechSynthesis } from 'react-speech-kit';
import * as faceapi from '@vladmandic/face-api';

const LivenessDetection: React.FC = () => {
    

  const webcamRef = useRef<Webcam>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(5); // Estado para el tiempo restante
  const [livenessDetected, setLivenessDetected] = useState<boolean>(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const { speak } = useSpeechSynthesis();

  const handleSpeak = (text: string) => {
    speak({ text });
  };

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        if (timeLeft > 0) {
          setTimeLeft(timeLeft - 1);
        }
        if (timeLeft === 0) {
          setIsAnalyzing(false);
        }
        detectFace();
      }, 1000); // Actualizar cada segundo
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, timeLeft]);

  const startAnalyzing = () => {
    setScreenshot(null);
    setIsAnalyzing(true);
    setTimeLeft(5); // Reiniciar el contador
  };

  
  const sendImage = async (screenshot) => {
    const imageBase64 = screenshot?.split(',')[1];
    try {
       await fetch('https://l6wzkgjlae.execute-api.us-east-1.amazonaws.com/FirstStage/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source_image: imageBase64 }),
      }).then(response => {
        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
          throw new Error('Hubo un problema al obtener la respuesta');
        }
        // Convertir el cuerpo de la respuesta a JSON
        return response.json();
      })
      .then(data => {
        // Manejar los datos obtenidos
        // Aquí puedes hacer lo que necesites con los datos
        console.log(JSON.parse(data.body)); 
        const body = JSON.parse(data.body);

        if(body.message === "Match found"){
          handleSpeak(body.matched_image_metadata.matched_image_fullname);
        } if (body.message.includes("Missing")){
          handleSpeak(body.message);
        }

      })
      .catch(error => {
        console.error('Error al obtener la respuesta:', error);
      }); 
    } catch (error) {
      console.error('Error de red:', error);
    }
  };

  const detectFace = async () => {
    if (webcamRef.current && webcamRef.current.video?.readyState === 4) {
      const video = webcamRef.current.video;
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
      if (detections.length > 0) {
        setLivenessDetected(true);
        const screenshot = webcamRef.current.getScreenshot()
        setScreenshot(screenshot);
        await sendImage(screenshot);
        setIsAnalyzing(false); // Detener el análisis
      }
    }
  };

  return (
    <>
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          width={640}
          height={480}
          screenshotFormat="image/jpeg"
          className="rounded-lg shadow-lg"
        />
        {!isAnalyzing && (
          <button
            onClick={startAnalyzing}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Start Analyzing
          </button>
        )}
      </div>
      {isAnalyzing && (
        <p className="text-xl mt-4">Time Left: {timeLeft}</p> // Mostrar el tiempo restante
      )}
      {/* Visualizar Screenshot
      {screenshot && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Screenshot</h2>
          <img src={screenshot} alt="Screenshot" className="rounded-lg shadow-md" />
        </div>
      )} */}
    </>
  );
};

export default LivenessDetection;
