import { useState, useEffect, useCallback } from 'react';
import { formatToIST } from '@/lib/timezone'; // Import the helper function

interface AttendanceStatus {
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export const useAttendanceMarking = (username: string, onAttendanceMarked: () => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRetryingLocation, setIsRetryingLocation] = useState(false);
  const [retryAction, setRetryAction] = useState<'checkin' | 'checkout' | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    checkedIn: false,
    checkedOut: false,
    checkInTime: null,
    checkOutTime: null,
  });

  const [previousPosition, setPreviousPosition] = useState<GeolocationPosition | null>(null);

  const fetchAttendanceStatus = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/attendance/status?username=${username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: AttendanceStatus = await response.json();
      setAttendanceStatus(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch attendance status");
    } finally {
      setLoading(false);
    }
  }, [username]);

  const getLocation = async (maxRetries = 3): Promise<GeolocationPosition> => {
    let attempts = 0;
    let bestPosition: GeolocationPosition | null = null;
    let bestAccuracy = Infinity;

    const attemptToFetchLocation = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );
      });

    while (attempts < maxRetries) {
      try {
        const position = await attemptToFetchLocation();
        const accuracy = position.coords.accuracy;

        if (accuracy < bestAccuracy) {
          bestPosition = position;
          bestAccuracy = accuracy;
        }

        if (bestAccuracy <= 10) break;
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
      }

      attempts++;
    }

    if (!bestPosition) {
      throw new Error("Failed to retrieve accurate location after retries.");
    }

    return bestPosition;
  };

  const markAttendance = async (action: 'checkin' | 'checkout') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsRetryingLocation(false);
    setRetryAction(null);

    try {
      const position = await getLocation();
      handleLocationSuccess(position, action);
    } catch (err: any) {
      handleLocationError(err, action);
    }
  };

  const handleLocationSuccess = async (position: GeolocationPosition, action: 'checkin' | 'checkout') => {
    const { latitude, longitude, accuracy } = position.coords;

    checkAccuracy(accuracy);
    checkRapidLocationChange(position);
    setPreviousPosition(position);

    try {
      const response = await fetch(`/api/attendance/${action}?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          date: new Date().toISOString().split('T')[0],
          checkInTime: action === 'checkin' ? formatToIST(new Date()) : undefined,
          checkOutTime: action === 'checkout' ? formatToIST(new Date()) : undefined,
          checkInLatitude: action === 'checkin' ? latitude : undefined,
          checkInLongitude: action === 'checkin' ? longitude : undefined,
          checkOutLatitude: action === 'checkout' ? latitude : undefined,
          checkOutLongitude: action === 'checkout' ? longitude : undefined,
          checkInAccuracy: action === 'checkin' ? accuracy : undefined,
          checkOutAccuracy: action === 'checkout' ? accuracy : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action}`);
      }

      const successData = await response.json();
      setSuccess(successData.message);
      onAttendanceMarked();
      fetchAttendanceStatus();
    } catch (e: any) {
      setError(e.message || `Failed to ${action} attendance`);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationError = (error: any, action: 'checkin' | 'checkout') => {
    let errorMessage = "Could not retrieve location.";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location access was denied. Please allow location access to check in/out.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable. Please ensure your device's location services are enabled.";
        break;
      case error.TIMEOUT:
        errorMessage = "The request to get location timed out. Please try again.";
        setRetryAction(action);
        break;
      default:
        errorMessage = `An unknown error occurred while getting location: ${error.message}`;
    }
    setError(errorMessage);
    setLoading(false);
    console.error("Geolocation error:", error);
  };

  const retryGetLocation = () => {
    if (retryAction) {
      setError(null);
      setIsRetryingLocation(true);
      markAttendance(retryAction);
    }
  };

  const checkAccuracy = (accuracy: number) => {
    const accuracyThreshold = 5;
    if (accuracy > accuracyThreshold) {
      console.warn(`Low location accuracy: ${accuracy} meters`);
    }
  };

  const checkRapidLocationChange = (currentPosition: GeolocationPosition) => {
    if (previousPosition && currentPosition?.coords) {
      const distance = calculateDistance(
        previousPosition.coords.latitude,
        previousPosition.coords.longitude,
        currentPosition.coords.latitude,
        currentPosition.coords.longitude
      );
      const timeDifference = currentPosition.timestamp - previousPosition.timestamp;
      const speed = distance / (timeDifference / 1000);
      const speedThreshold = 30;

      if (speed > speedThreshold) {
        console.warn("Suspiciously rapid location change detected!");
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    fetchAttendanceStatus();
  }, [fetchAttendanceStatus]);

  return {
    markAttendance,
    loading,
    error,
    success,
    attendanceStatus,
    isRetryingLocation,
    retryGetLocation,
  };
};
