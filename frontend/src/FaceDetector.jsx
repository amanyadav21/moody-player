import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import MusicPlayer from './song';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Play, Pause, Brain, Music } from 'lucide-react';

const FaceDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [detectedEmotion, setDetectedEmotion] = useState('');
  const [emotionScore, setEmotionScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState([]);

  const emotionEmojiMap = {
    happy: "😄",
    sad: "😢",
    angry: "😠",
    surprised: "😲",
    disgusted: "🤢",
    fearful: "😨",
    neutral: "😐",
  };

  const emotionColorMap = {
    happy: "#4ade80",
    sad: "#60a5fa", 
    angry: "#f87171",
    surprised: "#facc15",
    disgusted: "#a78bfa",
    fearful: "#fb7185",
    neutral: "#94a3b8",
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        await startVideo();
        setLoading(false);
      } catch (err) {
        setError('❌ Failed to load face-api models.');
        console.error(err);
      }
    };

    loadModels();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 720, 
          height: 560,
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
      }
    } catch (err) {
      setError('❌ Camera access denied or not available.');
      setLoading(false);
      console.error('Error accessing camera:', err);
    }
  };

  const handleDetectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsDetecting(true);
    
    try {
      // Set canvas dimensions to match video
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || video.offsetWidth;
      canvas.height = video.videoHeight || video.offsetHeight;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const context = canvasRef.current.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length === 0) {
        setDetectedEmotion('');
        setEmotionScore(0);
        setError('No face detected. Please make sure you are visible in the camera.');
        return;
      }

      setError(''); // Clear any previous errors
      const expressions = detections[0].expressions;
      const maxEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );

      const score = expressions[maxEmotion];
      
      // Only update if confidence is high enough
      if (score > 0.3) {
        setDetectedEmotion(maxEmotion);
        setEmotionScore(score.toFixed(2));
        
        // Add to emotion history for better tracking
        setEmotionHistory(prev => {
          const newHistory = [...prev, { emotion: maxEmotion, score, timestamp: Date.now() }];
          return newHistory.slice(-5); // Keep last 5 detections
        });
      }

      const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
      const resizedDetections = faceapi.resizeResults(detections, dims);

      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
    } catch (err) {
      setError('Error detecting face. Please try again.');
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Emotion-Based Music Recommendation
          </h1>
          <p className="text-lg text-gray-600">
            Detect your emotion and get personalized music recommendations
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Camera & Detection */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Emotion Detection
                </CardTitle>
                <CardDescription>
                  Click detect to analyze your current emotion
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0">
                {error && (
                  <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                
                {loading && !error && (
                  <div className="mx-6 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm">Loading camera and AI models...</p>
                  </div>
                )}

                <div className="relative bg-black rounded-lg mx-6 mb-6 overflow-hidden">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    className="w-full h-80 object-cover"
                  />
                  <canvas 
                    ref={canvasRef} 
                    className="absolute top-0 left-0 w-full h-full"
                  />
                </div>

                <div className="px-6 pb-6">
                  <Button
                    onClick={handleDetectFace}
                    disabled={isDetecting || loading}
                    className="w-full mb-4"
                    size="lg"
                  >
                    {isDetecting ? (
                      <>
                        <Brain className="h-4 w-4 mr-2 animate-pulse" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Detect Emotion
                      </>
                    )}
                  </Button>

                  {/* Emotion Results */}
                  <div className="space-y-3">
                    {detectedEmotion ? (
                      <div className="text-center space-y-2">
                        <div className="flex justify-center">
                          <Badge 
                            variant="default" 
                            className="text-lg px-4 py-2"
                          >
                            {emotionEmojiMap[detectedEmotion] || '🙂'} {detectedEmotion.charAt(0).toUpperCase() + detectedEmotion.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex justify-center">
                          <Badge variant="secondary" className="text-sm">
                            Confidence: {(emotionScore * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        {emotionHistory.length > 1 && (
                          <div className="text-xs text-gray-500">
                            Recent: {emotionHistory.slice(-3).map(h => emotionEmojiMap[h.emotion]).join(' ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">
                          {isDetecting ? 'Scanning for faces...' : 'Click "Detect Emotion" to start'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Music Player */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Music Recommendations
                </CardTitle>
                <CardDescription>
                  {detectedEmotion 
                    ? `Songs matching your ${detectedEmotion} mood` 
                    : 'Detect your emotion to get personalized recommendations'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <MusicPlayer detectedMood={detectedEmotion} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceDetector;
