// hooks/useAttendanceMarking.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import KalmanFilter from 'kalmanjs';
import { formatToIST } from '@/lib/timezone';

// Prisma-based type:
import { Attendance } from '@prisma/client';

interface AttendanceStatus {
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
}

// Hook now takes three parameters: (username, todayRecord, onMarked)
export const useAttendanceMarking = (
  username: string,
  todayRecord: Attendance | null,
  onAttendanceMarked: () => void
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRetryingLocation, setIsRetryingLocation] = useState(false);
  const [retryAction, setRetryAction] = useState<'checkin' | 'checkout' | null>(null);

  // Local state for the day’s attendance
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    checkedIn: false,
    checkedOut: false,
    checkInTime: null,
    checkOutTime: null,
  });

  // Kalman filter refs
  const latKFRef = useRef(new KalmanFilter({ R: 0.01, Q: 3 }));
  const lonKFRef = useRef(new KalmanFilter({ R: 0.01, Q: 3 }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Initialize from 'todayRecord'
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // If there's no record => user not checked in
    if (!todayRecord) {
      setAttendanceStatus({
        checkedIn: false,
        checkedOut: false,
        checkInTime: null,
        checkOutTime: null,
      });
      return;
    }

    // If todayRecord exists, set accordingly
    setAttendanceStatus({
      checkedIn: !!todayRecord.checkInTime,
      checkedOut: !!todayRecord.checkOutTime,
      checkInTime: todayRecord.checkInTime
        ? new Date(todayRecord.checkInTime).toISOString()
        : null,
      checkOutTime: todayRecord.checkOutTime
        ? new Date(todayRecord.checkOutTime).toISOString()
        : null,
    });
  }, [todayRecord]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. getLocationPinpoint (using watch + Kalman)
  // ─────────────────────────────────────────────────────────────────────────────
  const getLocationPinpoint = async (
    desiredAccuracy = 10,
    maxWaitMs = 30000
  ): Promise<GeolocationPosition> => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      let bestPosition: GeolocationPosition | null = null;
      let watchId: number;

      const handleSuccess = (position: GeolocationPosition) => {
        const filteredLatitude = latKFRef.current.filter(position.coords.latitude);
        const filteredLongitude = lonKFRef.current.filter(position.coords.longitude);
        const { accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;

        const kalmanPosition: GeolocationPosition = {
          timestamp: position.timestamp,
          coords: {
            latitude: filteredLatitude,
            longitude: filteredLongitude,
            accuracy,
            altitude,
            altitudeAccuracy,
            heading,
            speed,
            toJSON() {
              return {
                latitude: this.latitude,
                longitude: this.longitude,
                accuracy: this.accuracy,
                altitude: this.altitude,
                altitudeAccuracy: this.altitudeAccuracy,
                heading: this.heading,
                speed: this.speed,
              };
            },
          },
          toJSON() {
            return {
              coords: this.coords,
              timestamp: this.timestamp,
            };
          },
        };

        if (!bestPosition || kalmanPosition.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = kalmanPosition;
        }

        if (bestPosition.coords.accuracy <= desiredAccuracy) {
          navigator.geolocation.clearWatch(watchId);
          resolve(bestPosition);
        }
      };

      const handleError = (error: GeolocationPositionError) => {
        navigator.geolocation.clearWatch(watchId);
        reject(error);
      };

      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
      });

      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (bestPosition) {
          resolve(bestPosition);
        } else {
          reject(
            new Error(
              `Could not get a sufficiently accurate location within ${maxWaitMs}ms`
            )
          );
        }
      }, maxWaitMs);
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. markAttendance
  // ─────────────────────────────────────────────────────────────────────────────
  const markAttendance = async (action: 'checkin' | 'checkout') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsRetryingLocation(false);
    setRetryAction(null);

    try {
      const position = await getLocationPinpoint(10, 30000);
      await handleLocationSuccess(position, action);
    } catch (err: any) {
      handleLocationError(err, action);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. handleLocationSuccess
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLocationSuccess = async (
    position: GeolocationPosition,
    action: 'checkin' | 'checkout'
  ) => {
    const { latitude, longitude, accuracy } = position.coords;

    try {
      const response = await fetch(`/api/attendance/${action}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
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

      // Let the parent know we marked attendance
      onAttendanceMarked();

      // Optionally update state or re-fetch
      // For example, you can do a direct re-fetch from an endpoint if needed
      setAttendanceStatus((prev) => ({
        ...prev,
        checkedIn: action === 'checkin' ? true : prev.checkedIn,
        checkedOut: action === 'checkout' ? true : prev.checkedOut,
        checkInTime:
          action === 'checkin' ? new Date().toISOString() : prev.checkInTime,
        checkOutTime:
          action === 'checkout' ? new Date().toISOString() : prev.checkOutTime,
      }));
    } catch (e: any) {
      setError(e.message || `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. handleLocationError
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLocationError = (error: any, action: 'checkin' | 'checkout') => {
    let errorMessage = 'Could not retrieve location.';
    switch (error?.code) {
      case error?.PERMISSION_DENIED:
        errorMessage =
          'Location access was denied. Please allow location access to check in/out.';
        break;
      case error?.POSITION_UNAVAILABLE:
        errorMessage =
          "Location information is unavailable. Please ensure your device's location services are enabled.";
        break;
      case error?.TIMEOUT:
        errorMessage = 'The request to get location timed out. Please try again.';
        setRetryAction(action);
        break;
      default:
        errorMessage = error?.message
          ? error.message
          : 'An unknown error occurred while getting location.';
    }
    setError(errorMessage);
    setLoading(false);
    console.error('Geolocation error:', error);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Retrying location
  // ─────────────────────────────────────────────────────────────────────────────
  const retryGetLocation = () => {
    if (retryAction) {
      setError(null);
      setIsRetryingLocation(true);
      markAttendance(retryAction);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Return the Hook’s Public API
  // ─────────────────────────────────────────────────────────────────────────────
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
